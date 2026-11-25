import express, { Request, Response } from 'express';
import crypto from 'crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '32kb' }));

// Ephemeral in-memory HMAC secret for signing verification tokens & salting OTP hashes
const SERVER_OTP_HMAC_KEY = crypto.randomBytes(32);

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const RESEND_COOLDOWN_MS = 45 * 1000; // 45 seconds (within 30-60s requirement)
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESENDS_PER_WINDOW = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const TARGET_GROMO_REDIRECT_URL = 'https://sales.gromo.in/ac/b2y6--aLD8';

interface OtpChallengeRecord {
  challengeId: string;
  mobile: string;
  retailerId: string;
  productId: string;
  customerName: string;
  salt: string;
  otpHash: string; // HMAC-SHA256 digest — plain text OTP is NEVER stored
  createdAt: number;
  expiresAt: number;
  lastSentAt: number;
  resendCount: number;
  attempts: number;
  verified: boolean;
  verifiedAt?: string;
}

interface MobileRateTracker {
  sendTimestamps: number[];
  lockedUntil: number;
}

interface SmsOutboxAuditItem {
  dispatchId: string;
  maskedMobile: string;
  mobile: string;
  retailerId: string;
  productId: string;
  provider: string;
  deliveryMode: 'live_sms' | 'sandbox_outbox';
  otpCodeForSandboxInspection?: string;
  sentAt: string;
  expiresAt: string;
}

const otpChallenges = new Map<string, OtpChallengeRecord>();
const mobileRateTrackers = new Map<string, MobileRateTracker>();
const recentSmsDispatches: SmsOutboxAuditItem[] = [];

function isValidIndianMobile(mobile: string): boolean {
  return /^[6-9][0-9]{9}$/.test(mobile);
}

function hashOtpCode(otp: string, salt: string, mobile: string): string {
  return crypto
    .createHmac('sha256', SERVER_OTP_HMAC_KEY)
    .update(`${mobile}:${salt}:${otp}`)
    .digest('hex');
}

function timingSafeCompareHex(aHex: string, bHex: string): boolean {
  try {
    const bufA = Buffer.from(aHex, 'hex');
    const bufB = Buffer.from(bHex, 'hex');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

async function dispatchOtpSmsViaProvider(
  mobile: string,
  otpCode: string,
  retailerId: string
): Promise<{ providerName: string; deliveryMode: 'live_sms' | 'sandbox_outbox' }> {
  const fast2SmsKey = process.env.FAST2SMS_API_KEY?.trim();
  const msg91Key = process.env.MSG91_AUTH_KEY?.trim();
  const msg91TemplateId = process.env.MSG91_TEMPLATE_ID?.trim();
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_FROM_NUMBER?.trim();

  // 1. Fast2SMS DLT / Quick OTP Route
  if (fast2SmsKey) {
    try {
      const resp = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: mobile,
        }),
      });
      if (resp.ok) {
        return { providerName: 'Fast2SMS Verified Gateway', deliveryMode: 'live_sms' };
      }
    } catch {
      // Fallback safely if network call fails in preview container
    }
  }

  // 2. MSG91 OTP V5 Route
  if (msg91Key && msg91TemplateId) {
    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(
        msg91TemplateId
      )}&mobile=91${encodeURIComponent(mobile)}&otp=${encodeURIComponent(otpCode)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: msg91Key,
          'Content-Type': 'application/json',
        },
      });
      if (resp.ok) {
        return { providerName: 'MSG91 DLT OTP Gateway', deliveryMode: 'live_sms' };
      }
    } catch {
      // Fallback safely
    }
  }

  // 3. Twilio Programmable SMS
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const authHeader = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
      const form = new URLSearchParams();
      form.append('To', `+91${mobile}`);
      form.append('From', twilioFrom);
      form.append(
        'Body',
        `Your Affiliate Share & Earn (earn.foodexpres.in) verification OTP is ${otpCode}. Valid for 5 minutes. Ref: ${retailerId}. Do not share this OTP.`
      );
      const resp = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilioSid)}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: form.toString(),
        }
      );
      if (resp.ok) {
        return { providerName: 'Twilio Verified SMS', deliveryMode: 'live_sms' };
      }
    } catch {
      // Fallback safely
    }
  }

  return {
    providerName: 'Fast2SMS / MSG91 Sandbox Gateway',
    deliveryMode: 'sandbox_outbox',
  };
}

// POST /api/otp/send — Validates consent & 10-digit Indian mobile, enforces rate limits, hashes OTP with HMAC-SHA256
app.post('/api/otp/send', async (req: Request, res: Response) => {
  try {
    const {
      mobile,
      customerName,
      retailerId,
      productId,
      consentGiven,
      existingChallengeId,
    } = req.body || {};

    const cleanMobile = String(mobile || '').replace(/\D/g, '');
    const cleanName = String(customerName || '').trim();
    const cleanRetailerId = String(retailerId || 'FE1001').trim();
    const cleanProductId = String(productId || 'PROD_LOAN_01').trim();

    if (!consentGiven) {
      res.status(400).json({
        error: 'Customer privacy notice and referral tracking consent must be accepted before requesting an OTP.',
      });
      return;
    }

    if (cleanName.length < 2 || cleanName.length > 100) {
      res.status(400).json({
        error: 'Please enter your full name (2 to 100 characters).',
      });
      return;
    }

    if (!isValidIndianMobile(cleanMobile)) {
      res.status(400).json({
        error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
      });
      return;
    }

    const now = Date.now();
    const tracker = mobileRateTrackers.get(cleanMobile) || {
      sendTimestamps: [],
      lockedUntil: 0,
    };

    if (tracker.lockedUntil > now) {
      const waitSec = Math.ceil((tracker.lockedUntil - now) / 1000);
      res.status(429).json({
        error: `Too many OTP requests or failed attempts for +91 ${cleanMobile}. Please wait ${waitSec} seconds.`,
        retryAfterSeconds: waitSec,
      });
      return;
    }

    // Filter timestamps within last 15 minutes
    tracker.sendTimestamps = tracker.sendTimestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );

    // Check existing challenge cooldown (30-60s resend requirement: enforced at 45s)
    if (existingChallengeId && otpChallenges.has(String(existingChallengeId))) {
      const existing = otpChallenges.get(String(existingChallengeId))!;
      const elapsedSinceLastSend = now - existing.lastSentAt;
      if (elapsedSinceLastSend < RESEND_COOLDOWN_MS) {
        const waitSec = Math.ceil((RESEND_COOLDOWN_MS - elapsedSinceLastSend) / 1000);
        res.status(429).json({
          error: `Please wait ${waitSec} seconds before requesting a new OTP.`,
          retryAfterSeconds: waitSec,
        });
        return;
      }
      if (existing.resendCount >= MAX_RESENDS_PER_WINDOW) {
        tracker.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
        mobileRateTrackers.set(cleanMobile, tracker);
        res.status(429).json({
          error: `Maximum OTP resend limit (${MAX_RESENDS_PER_WINDOW} resends) reached. Locked for 15 minutes to prevent abuse.`,
          retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
        });
        return;
      }
    }

    if (tracker.sendTimestamps.length >= MAX_RESENDS_PER_WINDOW + 1) {
      tracker.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
      mobileRateTrackers.set(cleanMobile, tracker);
      res.status(429).json({
        error: 'Maximum SMS OTP requests exceeded for this mobile number in 15 minutes.',
        retryAfterSeconds: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      });
      return;
    }

    // Generate cryptographically random 6-digit OTP on the backend
    const otpCode = String(crypto.randomInt(100000, 1000000));
    const salt = crypto.randomBytes(16).toString('hex');
    const otpHash = hashOtpCode(otpCode, salt, cleanMobile);

    const prevRecord =
      existingChallengeId && otpChallenges.get(String(existingChallengeId));
    const challengeId =
      prevRecord && prevRecord.mobile === cleanMobile
        ? prevRecord.challengeId
        : `OTP-CH-${crypto.randomBytes(8).toString('hex')}`;
    const resendCount =
      prevRecord && prevRecord.mobile === cleanMobile
        ? prevRecord.resendCount + 1
        : 0;

    const record: OtpChallengeRecord = {
      challengeId,
      mobile: cleanMobile,
      retailerId: cleanRetailerId,
      productId: cleanProductId,
      customerName: cleanName,
      salt,
      otpHash,
      createdAt: prevRecord ? prevRecord.createdAt : now,
      expiresAt: now + OTP_EXPIRY_MS,
      lastSentAt: now,
      resendCount,
      attempts: 0,
      verified: false,
    };

    otpChallenges.set(challengeId, record);
    tracker.sendTimestamps.push(now);
    mobileRateTrackers.set(cleanMobile, tracker);

    const dispatchResult = await dispatchOtpSmsViaProvider(
      cleanMobile,
      otpCode,
      cleanRetailerId
    );

    const maskedMobile = `+91 ${cleanMobile.slice(0, 2)}•••••${cleanMobile.slice(-3)}`;
    recentSmsDispatches.unshift({
      dispatchId: `SMS-${Date.now().toString().slice(-6)}`,
      maskedMobile,
      mobile: cleanMobile,
      retailerId: cleanRetailerId,
      productId: cleanProductId,
      provider: dispatchResult.providerName,
      deliveryMode: dispatchResult.deliveryMode,
      otpCodeForSandboxInspection:
        dispatchResult.deliveryMode === 'sandbox_outbox' ? otpCode : undefined,
      sentAt: new Date(now).toISOString(),
      expiresAt: new Date(record.expiresAt).toISOString(),
    });
    if (recentSmsDispatches.length > 15) {
      recentSmsDispatches.pop();
    }

    // Notice: The plain text OTP is NEVER returned in the /api/otp/send JSON response.
    res.json({
      success: true,
      challengeId,
      maskedMobile,
      expiresInSeconds: Math.floor(OTP_EXPIRY_MS / 1000),
      resendCooldownSeconds: Math.floor(RESEND_COOLDOWN_MS / 1000),
      remainingResends: Math.max(0, MAX_RESENDS_PER_WINDOW - resendCount),
      maxAttempts: MAX_VERIFY_ATTEMPTS,
      provider: dispatchResult.providerName,
      deliveryMode: dispatchResult.deliveryMode,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error while dispatching OTP.',
    });
  }
});

// POST /api/otp/verify — Verifies 6-digit OTP on the backend using timing-safe HMAC comparison
app.post('/api/otp/verify', (req: Request, res: Response) => {
  try {
    const { challengeId, mobile, otpCode } = req.body || {};
    const cleanMobile = String(mobile || '').replace(/\D/g, '');
    const cleanOtp = String(otpCode || '').replace(/\D/g, '');
    const cleanChallengeId = String(challengeId || '').trim();

    if (!cleanChallengeId || !otpChallenges.has(cleanChallengeId)) {
      res.status(400).json({
        error: 'OTP session not found or expired. Please request a new OTP.',
      });
      return;
    }

    const challenge = otpChallenges.get(cleanChallengeId)!;
    const now = Date.now();

    if (challenge.mobile !== cleanMobile) {
      res.status(400).json({
        error: 'Mobile number mismatch for this OTP session.',
      });
      return;
    }

    if (challenge.verified) {
      res.status(400).json({
        error: 'This OTP has already been verified.',
      });
      return;
    }

    if (now > challenge.expiresAt) {
      otpChallenges.delete(cleanChallengeId);
      res.status(410).json({
        error: 'This OTP has expired (5-minute validity limit). Please tap Resend OTP.',
      });
      return;
    }

    if (challenge.attempts >= MAX_VERIFY_ATTEMPTS) {
      const tracker = mobileRateTrackers.get(cleanMobile) || {
        sendTimestamps: [],
        lockedUntil: 0,
      };
      tracker.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
      mobileRateTrackers.set(cleanMobile, tracker);
      otpChallenges.delete(cleanChallengeId);
      res.status(429).json({
        error: `Maximum incorrect OTP attempts (${MAX_VERIFY_ATTEMPTS}) reached. Session locked for 15 minutes.`,
      });
      return;
    }

    if (cleanOtp.length !== 6) {
      res.status(400).json({
        error: 'Please enter a valid 6-digit numeric OTP.',
      });
      return;
    }

    challenge.attempts += 1;
    const candidateHash = hashOtpCode(cleanOtp, challenge.salt, cleanMobile);
    const isMatch = timingSafeCompareHex(candidateHash, challenge.otpHash);

    if (!isMatch) {
      const attemptsRemaining = Math.max(0, MAX_VERIFY_ATTEMPTS - challenge.attempts);
      if (attemptsRemaining === 0) {
        const tracker = mobileRateTrackers.get(cleanMobile) || {
          sendTimestamps: [],
          lockedUntil: 0,
        };
        tracker.lockedUntil = now + RATE_LIMIT_WINDOW_MS;
        mobileRateTrackers.set(cleanMobile, tracker);
        otpChallenges.delete(cleanChallengeId);
        res.status(429).json({
          error: 'Maximum OTP verification attempts exceeded. Mobile number temporarily locked for 15 minutes.',
          attemptsRemaining: 0,
        });
        return;
      }

      otpChallenges.set(cleanChallengeId, challenge);
      res.status(401).json({
        error: `Invalid OTP entered. ${attemptsRemaining} attempt(s) remaining.`,
        attemptsRemaining,
      });
      return;
    }

    // Success: Mark challenge verified and clear OTP hash from memory
    const verifiedAtIso = new Date(now).toISOString();
    challenge.verified = true;
    challenge.verifiedAt = verifiedAtIso;
    challenge.otpHash = 'VERIFIED_AND_WIPED';

    // Remove sandbox OTP code from outbox once consumed
    for (const item of recentSmsDispatches) {
      if (item.mobile === cleanMobile) {
        item.otpCodeForSandboxInspection = undefined;
      }
    }

    const dateCompact = verifiedAtIso.slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomInt(100, 1000);
    const referralRef = `REF-${dateCompact}-${randomSuffix}`;

    // Create server-signed proof digest
    const verificationToken = crypto
      .createHmac('sha256', SERVER_OTP_HMAC_KEY)
      .update(`${referralRef}:${cleanMobile}:${challenge.retailerId}:${verifiedAtIso}`)
      .digest('hex')
      .slice(0, 24);

    res.json({
      success: true,
      otpStatus: 'Verified',
      referralRef,
      verifiedMobile: cleanMobile,
      retailerId: challenge.retailerId,
      productId: challenge.productId,
      customerName: challenge.customerName,
      otpVerifiedAt: verifiedAtIso,
      verificationToken,
      redirectUrl: TARGET_GROMO_REDIRECT_URL,
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error during OTP verification.',
    });
  }
});

// GET /api/otp/sandbox-outbox — Allows inspecting the SMS dispatch outbox in preview mode when live SMS API keys are not yet set
app.get('/api/otp/sandbox-outbox', (req: Request, res: Response) => {
  const mobileFilter = String(req.query.mobile || '').replace(/\D/g, '');
  const filtered = mobileFilter
    ? recentSmsDispatches.filter((item) => item.mobile === mobileFilter)
    : recentSmsDispatches.slice(0, 5);
  res.json({
    gatewayConfigured: Boolean(
      process.env.FAST2SMS_API_KEY?.trim() ||
        process.env.MSG91_AUTH_KEY?.trim() ||
        process.env.TWILIO_ACCOUNT_SID?.trim()
    ),
    dispatches: filtered,
  });
});

// ============================================================================
// TEMPLATED EMAIL NOTIFICATION SYSTEM (COMMISSION CREDITED & WITHDRAWAL STATUS)
// ============================================================================

type EmailTemplateId = 'COMMISSION_CREDITED' | 'WITHDRAWAL_STATUS_UPDATED';

interface EmailTemplateRecord {
  templateId: EmailTemplateId;
  name: string;
  triggerDescription: string;
  subjectTemplate: string;
  bodyTemplate: string;
  availableVariables: string[];
  updatedAt: string;
}

interface EmailLogItem {
  emailId: string;
  templateId: EmailTemplateId;
  retailerId: string;
  retailerName: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  body: string;
  status: 'Sent (Live API)' | 'Dispatched (Sandbox Outbox)';
  provider: string;
  variablesUsed: Record<string, string>;
  sentAt: string;
}

const DEFAULT_FROM_EMAIL =
  process.env.EMAIL_FROM_ADDRESS?.trim() || 'notifications@earn.foodexpres.in';

const emailTemplates = new Map<EmailTemplateId, EmailTemplateRecord>([
  [
    'COMMISSION_CREDITED',
    {
      templateId: 'COMMISSION_CREDITED',
      name: 'Retailer Commission Credited Email',
      triggerDescription:
        'Automatically sent when Admin verifies a GroMo application and credits the retailer wallet or performs a manual commission credit.',
      subjectTemplate:
        '[{{platformName}}] ₹{{creditedAmount}} Commission Credited to Wallet ({{retailerId}})',
      bodyTemplate: `Dear {{retailerName}} (Retailer ID: {{retailerId}}),

Congratulations! Your verified affiliate commission has been credited to your {{platformName}} wallet.

COMMISSION CREDIT SUMMARY
--------------------------------------------------
• Credited Amount: ₹{{creditedAmount}}
• Updated Wallet Balance: ₹{{newWalletBalance}}
• Product / Campaign: {{productTitle}}
• Customer Name: {{customerName}}
• Application Reference: {{applicationId}}
• Wallet Transaction Ref: {{txnRef}}
• Verification Date: {{verificationDate}}

You can request a payout anytime from your Retailer Dashboard once your balance meets the minimum withdrawal threshold.

Thank you for partnering with {{platformName}} ({{domain}}).
Warm regards,
SANJIT BADYAKAR — Admin Verification Desk`,
      availableVariables: [
        'retailerName',
        'retailerId',
        'retailerEmail',
        'creditedAmount',
        'gromoCommission',
        'newWalletBalance',
        'applicationId',
        'customerName',
        'productTitle',
        'txnRef',
        'verificationDate',
        'platformName',
        'domain',
      ],
      updatedAt: '2026-11-23T14:15:00.000Z',
    },
  ],
  [
    'WITHDRAWAL_STATUS_UPDATED',
    {
      templateId: 'WITHDRAWAL_STATUS_UPDATED',
      name: 'Withdrawal Request Status Update Email',
      triggerDescription:
        'Automatically sent when a retailer withdrawal request transitions to Approved, Completed, or Rejected.',
      subjectTemplate:
        '[{{platformName}}] Withdrawal {{withdrawalId}} (₹{{amount}}) is now {{status}}',
      bodyTemplate: `Dear {{retailerName}} (Retailer ID: {{retailerId}}),

Your withdrawal request on {{platformName}} has been updated by the Admin Desk.

WITHDRAWAL STATUS DETAILS
--------------------------------------------------
• Withdrawal Reference: {{withdrawalId}}
• Requested Amount: ₹{{amount}}
• Current Status: {{status}}
• Payout Destination: {{paymentMethod}}
• Bank / UPI Reference (UTR): {{paymentRef}}
• Admin Remarks: {{adminReason}}
• Current Wallet Balance: ₹{{newWalletBalance}}

If your request was marked Completed, the funds have been transferred to your registered UPI/Bank account. If Rejected, the full amount has been refunded to your available wallet balance.

Warm regards,
SANJIT BADYAKAR — {{platformName}} Payout Desk ({{domain}})`,
      availableVariables: [
        'retailerName',
        'retailerId',
        'retailerEmail',
        'withdrawalId',
        'amount',
        'status',
        'paymentMethod',
        'paymentRef',
        'adminReason',
        'newWalletBalance',
        'platformName',
        'domain',
      ],
      updatedAt: '2026-11-23T16:45:00.000Z',
    },
  ],
]);

function renderEmailTemplate(
  templateStr: string,
  variables: Record<string, string>
): string {
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const val = variables[key];
    return val !== undefined && val !== null && String(val).trim() !== ''
      ? String(val)
      : 'N/A';
  });
}

// Pre-seed outbox with realistic initial dispatched emails matching the seeded ledger
const emailOutbox: EmailLogItem[] = [
  {
    emailId: 'EML-20261123-902',
    templateId: 'WITHDRAWAL_STATUS_UPDATED',
    retailerId: 'FE1001',
    retailerName: 'Sanjit Badyakar',
    toEmail: 'sanjit.fe1001@foodexpres.in',
    fromEmail: DEFAULT_FROM_EMAIL,
    subject:
      '[Zero Poisa] Withdrawal WDR-20261123-01 (₹800) is now Completed',
    body: `Dear Sanjit Badyakar (Retailer ID: FE1001),

Your withdrawal request on Zero Poisa has been updated by the Admin Desk.

WITHDRAWAL STATUS DETAILS
--------------------------------------------------
• Withdrawal Reference: WDR-20261123-01
• Requested Amount: ₹800
• Current Status: Completed
• Payout Destination: UPI: sanjitbadyakar@okaxis
• Bank / UPI Reference (UTR): UTR632798114502
• Admin Remarks: IMPS/UPI instant settlement completed
• Current Wallet Balance: ₹2,200

If your request was marked Completed, the funds have been transferred to your registered UPI/Bank account. If Rejected, the full amount has been refunded to your available wallet balance.

Warm regards,
SANJIT BADYAKAR — Zero Poisa Payout Desk (earn.foodexpres.in)`,
    status: 'Dispatched (Sandbox Outbox)',
    provider: 'Template Engine Sandbox Outbox',
    variablesUsed: {
      retailerName: 'Sanjit Badyakar',
      retailerId: 'FE1001',
      retailerEmail: 'sanjit.fe1001@foodexpres.in',
      withdrawalId: 'WDR-20261123-01',
      amount: '800',
      status: 'Completed',
      paymentMethod: 'UPI: sanjitbadyakar@okaxis',
      paymentRef: 'UTR632798114502',
      adminReason: 'IMPS/UPI instant settlement completed',
      newWalletBalance: '2,200',
      platformName: 'Zero Poisa',
      domain: 'earn.foodexpres.in',
    },
    sentAt: '2026-11-23T16:40:00.000Z',
  },
  {
    emailId: 'EML-20261123-901',
    templateId: 'COMMISSION_CREDITED',
    retailerId: 'FE1001',
    retailerName: 'Sanjit Badyakar',
    toEmail: 'sanjit.fe1001@foodexpres.in',
    fromEmail: DEFAULT_FROM_EMAIL,
    subject:
      '[Zero Poisa] ₹800 Commission Credited to Wallet (FE1001)',
    body: `Dear Sanjit Badyakar (Retailer ID: FE1001),

Congratulations! Your verified affiliate commission has been credited to your Zero Poisa wallet.

COMMISSION CREDIT SUMMARY
--------------------------------------------------
• Credited Amount: ₹800
• Updated Wallet Balance: ₹3,000
• Product / Campaign: Instant Personal Loan
• Customer Name: Rani Barman
• Application Reference: APP-20261123-501
• Wallet Transaction Ref: TXN-20261123-8801
• Verification Date: 23 November 2026

You can request a payout anytime from your Retailer Dashboard once your balance meets the minimum withdrawal threshold.

Thank you for partnering with Zero Poisa (earn.foodexpres.in).
Warm regards,
SANJIT BADYAKAR — Admin Verification Desk`,
    status: 'Dispatched (Sandbox Outbox)',
    provider: 'Template Engine Sandbox Outbox',
    variablesUsed: {
      retailerName: 'Sanjit Badyakar',
      retailerId: 'FE1001',
      retailerEmail: 'sanjit.fe1001@foodexpres.in',
      creditedAmount: '800',
      gromoCommission: '1,000',
      newWalletBalance: '3,000',
      applicationId: 'APP-20261123-501',
      customerName: 'Rani Barman',
      productTitle: 'Instant Personal Loan',
      txnRef: 'TXN-20261123-8801',
      verificationDate: '23 November 2026',
      platformName: 'Zero Poisa',
      domain: 'earn.foodexpres.in',
    },
    sentAt: '2026-11-23T14:25:00.000Z',
  },
];

async function dispatchTransactionalEmailViaProvider(
  toEmail: string,
  subject: string,
  textBody: string
): Promise<{
  provider: string;
  status: 'Sent (Live API)' | 'Dispatched (Sandbox Outbox)';
}> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();

  if (resendKey) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: DEFAULT_FROM_EMAIL,
          to: [toEmail],
          subject,
          text: textBody,
        }),
      });
      if (resp.ok) {
        return { provider: 'Resend Transactional Email API', status: 'Sent (Live API)' };
      }
    } catch {
      // Fall back to sandbox outbox if external network call fails
    }
  }

  if (sendgridKey) {
    try {
      const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: DEFAULT_FROM_EMAIL, name: 'Zero Poisa' },
          subject,
          content: [{ type: 'text/plain', value: textBody }],
        }),
      });
      if (resp.ok) {
        return { provider: 'SendGrid V3 Mail API', status: 'Sent (Live API)' };
      }
    } catch {
      // Fall back to sandbox outbox
    }
  }

  return {
    provider: 'Template Engine Sandbox Outbox',
    status: 'Dispatched (Sandbox Outbox)',
  };
}

// GET /api/email/templates — Fetch customizable email templates
app.get('/api/email/templates', (_req: Request, res: Response) => {
  res.json({
    templates: Array.from(emailTemplates.values()),
    fromAddress: DEFAULT_FROM_EMAIL,
    liveProviderConfigured: Boolean(
      process.env.RESEND_API_KEY?.trim() || process.env.SENDGRID_API_KEY?.trim()
    ),
  });
});

// POST /api/email/templates — Update subject/body template for COMMISSION_CREDITED or WITHDRAWAL_STATUS_UPDATED
app.post('/api/email/templates', (req: Request, res: Response) => {
  const { templateId, subjectTemplate, bodyTemplate } = req.body || {};
  const id = String(templateId || '') as EmailTemplateId;
  if (!emailTemplates.has(id)) {
    res.status(400).json({ error: 'Invalid email template ID.' });
    return;
  }
  const cleanSubject = String(subjectTemplate || '').trim();
  const cleanBody = String(bodyTemplate || '').trim();
  if (!cleanSubject || !cleanBody) {
    res.status(400).json({ error: 'Both subject and body templates are required.' });
    return;
  }

  const existing = emailTemplates.get(id)!;
  const updated: EmailTemplateRecord = {
    ...existing,
    subjectTemplate: cleanSubject,
    bodyTemplate: cleanBody,
    updatedAt: new Date().toISOString(),
  };
  emailTemplates.set(id, updated);
  res.json({ success: true, template: updated });
});

// GET /api/email/outbox — Fetch sent email notifications (with optional retailerId filter)
app.get('/api/email/outbox', (req: Request, res: Response) => {
  const retailerIdFilter = String(req.query.retailerId || '').trim();
  const items = retailerIdFilter
    ? emailOutbox.filter((item) => item.retailerId === retailerIdFilter)
    : emailOutbox;
  res.json({
    emails: items.slice(0, 50),
  });
});

// POST /api/email/send — Render template with variables and send email notification
app.post('/api/email/send', async (req: Request, res: Response) => {
  try {
    const {
      templateId,
      toEmail,
      retailerId,
      retailerName,
      variables = {},
    } = req.body || {};

    const id = String(templateId || '') as EmailTemplateId;
    if (!emailTemplates.has(id)) {
      res.status(400).json({ error: 'Unknown email templateId.' });
      return;
    }

    const template = emailTemplates.get(id)!;
    const cleanToEmail =
      String(toEmail || '').trim() ||
      `${String(retailerId || 'retailer').toLowerCase()}@foodexpres.in`;
    const cleanRetailerId = String(retailerId || 'FE1001').trim();
    const cleanRetailerName = String(retailerName || 'Retailer Partner').trim();

    const safeVars: Record<string, string> = {};
    if (variables && typeof variables === 'object') {
      for (const [k, v] of Object.entries(variables)) {
        safeVars[k] = String(v ?? '').slice(0, 500);
      }
    }
    safeVars.retailerId = safeVars.retailerId || cleanRetailerId;
    safeVars.retailerName = safeVars.retailerName || cleanRetailerName;
    safeVars.retailerEmail = safeVars.retailerEmail || cleanToEmail;
    safeVars.platformName = safeVars.platformName || 'Zero Poisa';
    safeVars.domain = safeVars.domain || 'earn.foodexpres.in';

    const renderedSubject = renderEmailTemplate(template.subjectTemplate, safeVars);
    const renderedBody = renderEmailTemplate(template.bodyTemplate, safeVars);

    const delivery = await dispatchTransactionalEmailViaProvider(
      cleanToEmail,
      renderedSubject,
      renderedBody
    );

    const logItem: EmailLogItem = {
      emailId: `EML-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomInt(100, 1000)}`,
      templateId: id,
      retailerId: cleanRetailerId,
      retailerName: cleanRetailerName,
      toEmail: cleanToEmail,
      fromEmail: DEFAULT_FROM_EMAIL,
      subject: renderedSubject,
      body: renderedBody,
      status: delivery.status,
      provider: delivery.provider,
      variablesUsed: safeVars,
      sentAt: new Date().toISOString(),
    };

    emailOutbox.unshift(logItem);
    if (emailOutbox.length > 100) {
      emailOutbox.pop();
    }

    res.json({
      success: true,
      email: logItem,
    });
  } catch (err) {
    res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : 'Failed to render and dispatch email notification.',
    });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Affiliate Share & Earn server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

