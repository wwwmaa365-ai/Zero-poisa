import React, { useState, useEffect } from 'react';
import {
  PlatformSettings,
  Product,
  RetailerPublic,
  ReferralLead,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { HERO_BANNER_IMAGE, ZERO_POISA_LOGO } from '../lib/seedData';
import {
  ShieldCheck,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowRight,
  UserCheck,
  Phone,
  User,
  FileCheck2,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface CustomerReferralViewProps {
  settings: PlatformSettings;
  products: Product[];
  retailersPublic: RetailerPublic[];
  referralLeads: ReferralLead[];
  activeRetailerCode: string;
  selectedProductId: string;
  onSelectRetailerCode: (code: string) => void;
  onSelectProductId: (productId: string) => void;
  onSubmitReferralLead: (lead: ReferralLead) => Promise<void>;
  onSwitchWorkspace: (mode: 'customer' | 'retailer' | 'admin') => void;
}

const OFFICIAL_GROMO_REDIRECT_URL = 'https://sales.gromo.in/ac/b2y6--aLD8';

interface SandboxDispatchItem {
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

export const CustomerReferralView: React.FC<CustomerReferralViewProps> = ({
  settings,
  products,
  retailersPublic,
  referralLeads,
  activeRetailerCode,
  selectedProductId,
  onSelectRetailerCode,
  onSelectProductId,
  onSubmitReferralLead,
  onSwitchWorkspace,
}) => {
  const activeProducts = products.filter((p) => p.active);
  const currentProduct =
    activeProducts.find((p) => p.productId === selectedProductId) || activeProducts[0];
  const currentRetailer =
    retailersPublic.find(
      (r) => r.retailerId.toUpperCase() === activeRetailerCode.toUpperCase()
    ) || retailersPublic[0];

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  // Backend OTP Challenge State (No OTP code is ever generated or stored in frontend code)
  const [otpStep, setOtpStep] = useState<'details' | 'verify_otp' | 'verified'>('details');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [maskedMobile, setMaskedMobile] = useState<string>('');
  const [otpInput, setOtpInput] = useState('');
  const [otpProviderName, setOtpProviderName] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'live_sms' | 'sandbox_outbox'>('live_sms');
  const [expiryCountdown, setExpiryCountdown] = useState(0); // 300s (5 mins)
  const [resendCooldown, setResendCooldown] = useState(0); // 45s (30-60s range)
  const [remainingResends, setRemainingResends] = useState(3);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Optional Sandbox SMS Inbox inspector for testing when DLT API keys are not yet configured
  const [sandboxDispatches, setSandboxDispatches] = useState<SandboxDispatchItem[]>([]);
  const [showSandboxInbox, setShowSandboxInbox] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [createdLead, setCreatedLead] = useState<ReferralLead | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(activeProducts.map((p) => p.category)))];
  const filteredProducts =
    selectedCategory === 'All'
      ? activeProducts
      : activeProducts.filter((p) => p.category === selectedCategory);

  // 1-second timer for 5-minute OTP expiry and 45-second resend cooldown
  useEffect(() => {
    if (otpStep !== 'verify_otp') return;
    const interval = setInterval(() => {
      setExpiryCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpStep]);

  // Automatic redirect countdown after successful backend OTP verification
  useEffect(() => {
    if (redirectCountdown === null) return;
    if (redirectCountdown <= 0 && createdLead) {
      try {
        window.location.assign(OFFICIAL_GROMO_REDIRECT_URL);
      } catch {
        // If blocked by iframe sandbox, the manual redirect CTA button remains prominently available
      }
      setRedirectCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [redirectCountdown, createdLead]);

  const formatMmSs = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const fetchSandboxSmsInbox = async (mobile: string) => {
    try {
      const resp = await fetch(
        `/api/otp/sandbox-outbox?mobile=${encodeURIComponent(mobile)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        setSandboxDispatches(data.dispatches || []);
      }
    } catch {
      // Ignore network errors
    }
  };

  // Step 1: Request SMS OTP from backend after validating privacy consent and 10-digit Indian mobile
  const handleSendOtpRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!currentProduct) {
      setErrorMsg('Please select an active financial product.');
      return;
    }
    if (!currentRetailer || currentRetailer.status !== 'active') {
      setErrorMsg('This retailer referral code is currently inactive.');
      return;
    }
    if (!settings.gromoLinkActive) {
      setErrorMsg('Partner application links are temporarily paused by the administrator.');
      return;
    }

    if (!consentGiven) {
      setErrorMsg(
        'Please read the Privacy Notice and accept the Customer Consent checkbox before entering or verifying your mobile number.'
      );
      return;
    }

    const cleanName = customerName.trim();
    const cleanMobile = customerMobile.replace(/\D/g, '');

    if (cleanName.length < 2) {
      setErrorMsg('Please enter your full name (minimum 2 characters).');
      return;
    }
    if (!/^[6-9][0-9]{9}$/.test(cleanMobile)) {
      setErrorMsg(
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
      );
      return;
    }

    // Check if this mobile + product + retailer was already OTP-verified in the current session
    const sessionHash = `${currentRetailer.retailerId}_${currentProduct.productId}_${cleanMobile}`;
    const existingVerified = referralLeads.find(
      (l) => l.sessionHash === sessionHash && l.otpStatus === 'Verified'
    );
    if (existingVerified) {
      setCreatedLead(existingVerified);
      setOtpStep('verified');
      setRedirectCountdown(3);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: cleanMobile,
          customerName: cleanName,
          retailerId: currentRetailer.retailerId,
          productId: currentProduct.productId,
          consentGiven: true,
          existingChallengeId: challengeId,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (typeof data.retryAfterSeconds === 'number') {
          setResendCooldown(Math.min(60, data.retryAfterSeconds));
        }
        throw new Error(data.error || 'Failed to send SMS OTP.');
      }

      setChallengeId(data.challengeId);
      setMaskedMobile(data.maskedMobile || `+91 ${cleanMobile}`);
      setExpiryCountdown(data.expiresInSeconds || 300);
      setResendCooldown(data.resendCooldownSeconds || 45);
      setRemainingResends(
        typeof data.remainingResends === 'number' ? data.remainingResends : 3
      );
      setAttemptsRemaining(data.maxAttempts || 5);
      setOtpProviderName(data.provider || 'Verified SMS Gateway');
      setDeliveryMode(data.deliveryMode || 'live_sms');
      setOtpInput('');
      setOtpStep('verify_otp');
      setInfoMsg(
        `6-digit OTP sent via ${data.provider} to ${data.maskedMobile}. Valid for 5 minutes.`
      );

      if (data.deliveryMode === 'sandbox_outbox') {
        await fetchSandboxSmsInbox(cleanMobile);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to send OTP at this moment.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Verify OTP on backend -> Save verified lead in Firestore (status: 'Lead Generated') -> Redirect to https://sales.gromo.in/ac/b2y6--aLD8
  const handleVerifyOtpAndRedirect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!currentProduct || !currentRetailer) return;

    const cleanMobile = customerMobile.replace(/\D/g, '');
    const cleanOtp = otpInput.replace(/\D/g, '');

    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP sent to your mobile number.');
      return;
    }
    if (expiryCountdown <= 0) {
      setErrorMsg('Your OTP has expired (5-minute limit). Please tap Resend OTP.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId,
          mobile: cleanMobile,
          otpCode: cleanOtp,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (typeof data.attemptsRemaining === 'number') {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        throw new Error(data.error || 'OTP verification failed.');
      }

      const verifiedTimestamp = data.otpVerifiedAt || new Date().toISOString();
      const referralRef = data.referralRef;
      const sessionHash = `${currentRetailer.retailerId}_${currentProduct.productId}_${cleanMobile}`;

      // CRITICAL RULE: Never mark a lead as a successful loan just because OTP is verified.
      // Status is strictly recorded as 'Lead Generated' with otpStatus: 'Verified'.
      const newLead: ReferralLead = {
        referralRef,
        retailerId: currentRetailer.retailerId,
        retailerUid: currentRetailer.uid,
        retailerName: currentRetailer.name,
        productId: currentProduct.productId,
        productTitle: currentProduct.title,
        customerName: customerName.trim(),
        customerMobile: cleanMobile,
        otpStatus: 'Verified',
        otpVerifiedAt: verifiedTimestamp,
        consentGiven: true,
        consentTimestamp: verifiedTimestamp,
        sessionHash,
        status: 'Lead Generated',
        targetGromoUrl: OFFICIAL_GROMO_REDIRECT_URL,
        createdAt: verifiedTimestamp,
      };

      await onSubmitReferralLead(newLead);
      setCreatedLead(newLead);
      setOtpStep('verified');
      setRedirectCountdown(3);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to verify OTP. Please check the code and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetCustomerFlow = () => {
    setCreatedLead(null);
    setOtpStep('details');
    setChallengeId(null);
    setOtpInput('');
    setCustomerName('');
    setCustomerMobile('');
    setConsentGiven(false);
    setErrorMsg(null);
    setInfoMsg(null);
    setRedirectCountdown(null);
    setShowSandboxInbox(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Royal Blue & Slate Referral Attribution Header */}
      <div className="bg-gradient-to-r from-[#0e54b7] via-[#1363d1] to-[#0a3d8f] text-white rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={ZERO_POISA_LOGO}
                alt="Zero Poisa Official Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white/30 shadow-sm shrink-0"
              />
              <div>
                <div className="text-sm font-bold tracking-tight text-amber-300">
                  {settings.platformName} · Official Referral Portal
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-blue-100 font-mono">
                  <span>{settings.domain}/ref/{currentRetailer?.retailerId || 'FE1001'}</span>
                  <span aria-hidden="true">·</span>
                  <span>Referred by {currentRetailer?.name || 'Sanjit Badyakar'}</span>
                  <span aria-hidden="true">·</span>
                  <span>SMS OTP Verified Attribution</span>
                </div>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Explore Banking, Credit Cards, Loans & Investment Offers
            </h1>
            <p className="text-sm sm:text-base text-blue-100 max-w-2xl leading-relaxed">
              Select your financial product below. After you accept the privacy consent and verify your 10-digit Indian mobile number via SMS OTP, you will be automatically redirected to the official GroMo portal.
            </p>

            {/* Quick Retailer Referral Link Switcher for Testing Attribution */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <label className="text-xs font-medium text-blue-100">
                Active Referral Link:
              </label>
              <select
                value={currentRetailer?.retailerId || 'FE1001'}
                onChange={(e) => {
                  onSelectRetailerCode(e.target.value);
                  resetCustomerFlow();
                }}
                className="bg-white/15 border border-white/30 text-white text-xs font-mono rounded-xl px-3 py-2 focus:outline-none"
              >
                {retailersPublic.map((r) => (
                  <option key={r.retailerId} value={r.retailerId} className="text-slate-900">
                    https://{settings.domain}/ref/{r.retailerId} ({r.name})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => onSwitchWorkspace('retailer')}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors whitespace-nowrap shrink-0"
              >
                Open Sell & Earn Retailer App →
              </button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-white/20 shadow-md">
              <ResilientImage
                src={HERO_BANNER_IMAGE}
                alt="Financial Products Showcase"
                fallbackTitle="Affiliate Share & Earn Financial Suite"
                className="w-full h-52 sm:h-60 object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Product Catalog on Left, Mobile-Friendly OTP Verification Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 Columns: Dynamic Product Catalog */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                01. Choose Your Financial Product
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                All products redirect to {OFFICIAL_GROMO_REDIRECT_URL} after mobile OTP verification.
              </p>
            </div>

            {/* Category Filter Controls */}
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filteredProducts.map((product) => {
              const isSelected = currentProduct?.productId === product.productId;
              return (
                <div
                  key={product.productId}
                  onClick={() => {
                    onSelectProductId(product.productId);
                    resetCustomerFlow();
                  }}
                  className={`cursor-pointer rounded-2xl border bg-white transition-all overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <ResilientImage
                      src={product.imageUrl}
                      alt={product.title}
                      fallbackTitle={product.title}
                      className="w-full h-44 object-cover"
                    />
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{product.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.bannerTag}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {product.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-slate-100">
                    <span className="text-xs font-mono text-slate-500">
                      ID: {product.productId}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProductId(product.productId);
                        resetCustomerFlow();
                      }}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isSelected ? 'Selected' : product.buttonText}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Mobile-First Privacy Consent & Backend OTP Verification Card */}
        <div className="lg:col-span-5 lg:sticky lg:top-20">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            {currentProduct ? (
              <>
                <div className="relative">
                  <ResilientImage
                    src={currentProduct.imageUrl}
                    alt={currentProduct.title}
                    fallbackTitle={currentProduct.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs">
                    <span className="font-medium">
                      Referring Partner: {currentRetailer?.name}
                    </span>
                    <span className="font-mono text-emerald-400">
                      ID: {currentRetailer?.retailerId}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>
                        {currentProduct.category} · {currentProduct.bannerTag}
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        {otpStep === 'verified' ? 'OTP: Verified' : 'Step ' + (otpStep === 'details' ? '1 of 2' : '2 of 2')}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {currentProduct.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {currentProduct.description}
                    </p>
                  </div>

                  {/* Mandatory Privacy Notice & Zero-Sensitive-Data Guarantee */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <Lock className="w-4 h-4 text-[#1363d1] shrink-0" />
                      <span>Privacy Notice & Zero-Sensitive-Data Guarantee</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      We only verify your 10-digit mobile number via SMS OTP to record referral attribution for Partner{' '}
                      <strong className="text-slate-900">{currentRetailer?.retailerId}</strong>. We never collect Aadhaar, PAN, bank account details, or loan credentials on this page. OTP verification records your referral lead only—loan or card approval is determined on GroMo and verified separately by Admin.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {infoMsg && !errorMsg && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-3.5 text-xs flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-[#1363d1] shrink-0 mt-0.5" />
                      <span>{infoMsg}</span>
                    </div>
                  )}

                  {/* STATE 3: OTP VERIFIED & AUTO-REDIRECTING TO https://sales.gromo.in/ac/b2y6--aLD8 */}
                  {otpStep === 'verified' && createdLead && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              Mobile OTP Verified
                            </h3>
                            <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              {createdLead.otpStatus}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Verified mobile, referral ID, and consent saved. Lead status is{' '}
                            <strong className="text-slate-900">{createdLead.status}</strong> (final loan/application approval is verified separately via GroMo reports).
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-3.5 border border-emerald-200 text-xs space-y-1.5 font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Referral ID:</span>
                          <span className="font-bold text-slate-900">
                            {createdLead.referralRef}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Verified Mobile:</span>
                          <span className="font-bold text-emerald-700">
                            +91 {createdLead.customerMobile}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Retailer ID:</span>
                          <span className="font-bold text-slate-900">
                            {createdLead.retailerId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Product ID:</span>
                          <span className="text-slate-900">{createdLead.productId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Verified At:</span>
                          <span className="text-slate-700">
                            {createdLead.otpVerifiedAt.slice(0, 19).replace('T', ' ')}
                          </span>
                        </div>
                      </div>

                      {redirectCountdown !== null && redirectCountdown > 0 && (
                        <div className="text-center text-xs font-semibold text-emerald-900 bg-emerald-100/80 rounded-xl py-2 px-3">
                          Automatically redirecting to GroMo in {redirectCountdown}s...
                        </div>
                      )}

                      <a
                        href={OFFICIAL_GROMO_REDIRECT_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <span>Proceed to GroMo Application Now</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <div className="text-center font-mono text-[11px] text-slate-500 truncate">
                        Target: {OFFICIAL_GROMO_REDIRECT_URL}
                      </div>

                      <button
                        type="button"
                        onClick={resetCustomerFlow}
                        className="w-full text-xs text-slate-600 hover:text-slate-900 font-medium py-1.5"
                      >
                        Verify Another Mobile Number
                      </button>
                    </div>
                  )}

                  {/* STATE 1: CONSENT FIRST, THEN MOBILE NUMBER & SEND OTP */}
                  {otpStep === 'details' && (
                    <form onSubmit={handleSendOtpRequest} className="space-y-4">
                      {/* Consent Checkbox Placed BEFORE Collecting Mobile Number */}
                      <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={consentGiven}
                          onChange={(e) => setConsentGiven(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#1363d1] focus:ring-[#1363d1]"
                        />
                        <span className="text-xs text-slate-700 leading-relaxed">
                          <strong className="text-slate-900">
                            1. Privacy & Referral Consent (Required First):
                          </strong>{' '}
                          I agree to the {settings.domain} Privacy Policy and consent to verifying my mobile number via SMS OTP to record referral attribution for Retailer{' '}
                          <strong className="text-slate-900">
                            {currentRetailer?.retailerId}
                          </strong>{' '}
                          before redirecting to GroMo.
                        </span>
                      </label>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                          2. Applicant Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type="text"
                            required
                            maxLength={100}
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="e.g. Rani Barman"
                            className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                          3. Valid Indian 10-Digit Mobile Number *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3.5 text-xs font-mono font-bold text-slate-500">
                            +91
                          </span>
                          <input
                            type="tel"
                            inputMode="numeric"
                            required
                            maxLength={10}
                            disabled={!consentGiven}
                            value={customerMobile}
                            onChange={(e) =>
                              setCustomerMobile(
                                e.target.value.replace(/\D/g, '').slice(0, 10)
                              )
                            }
                            placeholder={
                              consentGiven
                                ? '9832109876'
                                : 'Check consent box above to enter mobile'
                            }
                            className="w-full pl-12 pr-3.5 py-2.5 text-sm font-mono bg-white disabled:bg-slate-100 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Must be a 10-digit Indian mobile number (starts with 6, 7, 8, or 9).
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || !consentGiven}
                        className="w-full min-h-[48px] bg-[#1363d1] hover:bg-[#0e54b7] disabled:opacity-50 text-white font-bold text-sm rounded-xl px-5 py-3 flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <Phone className="w-4 h-4" />
                        <span>
                          {submitting ? 'Dispatching SMS OTP...' : 'Send Verification OTP via SMS'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </form>
                  )}

                  {/* STATE 2: ENTER 6-DIGIT OTP WITH 5-MIN EXPIRY & 45-SEC RESEND TIMER */}
                  {otpStep === 'verify_otp' && (
                    <form onSubmit={handleVerifyOtpAndRedirect} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-800">
                            SMS Sent to {maskedMobile}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStep('details');
                              setErrorMsg(null);
                              setInfoMsg(null);
                            }}
                            className="text-[#1363d1] font-semibold hover:underline"
                          >
                            Change Number
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200/80">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              Expires in:{' '}
                              <strong
                                className={
                                  expiryCountdown < 60 ? 'text-red-600' : 'text-slate-900'
                                }
                              >
                                {formatMmSs(expiryCountdown)}
                              </strong>
                            </span>
                          </span>
                          <span>Attempts left: {attemptsRemaining}/5</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                          Enter 6-Digit SMS OTP *
                        </label>
                        <div className="relative">
                          <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            maxLength={6}
                            value={otpInput}
                            onChange={(e) =>
                              setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            placeholder="••••••"
                            className="w-full pl-10 pr-4 py-3 text-base tracking-[0.35em] font-mono font-bold bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1363d1]"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting || otpInput.length !== 6 || expiryCountdown <= 0}
                        className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl px-5 py-3 flex items-center justify-center gap-2 transition-colors shadow-xs"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>
                          {submitting
                            ? 'Verifying OTP on Backend...'
                            : 'Verify OTP & Continue to GroMo'}
                        </span>
                      </button>

                      {/* Resend OTP Controls (30-60s cooldown + max resend limit) */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-slate-500">
                          {resendCooldown > 0
                            ? `Resend available in ${resendCooldown}s`
                            : `Resends remaining: ${remainingResends}`}
                        </span>
                        <button
                          type="button"
                          disabled={
                            submitting || resendCooldown > 0 || remainingResends <= 0
                          }
                          onClick={() => handleSendOtpRequest()}
                          className="font-semibold text-[#1363d1] disabled:text-slate-400 flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Resend OTP</span>
                        </button>
                      </div>

                      {/* Preview Sandbox SMS Outbox Inspector (Only shown when live SMS secret keys are not set in environment) */}
                      {deliveryMode === 'sandbox_outbox' && (
                        <div className="pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={async () => {
                              const nextState = !showSandboxInbox;
                              setShowSandboxInbox(nextState);
                              if (nextState) {
                                await fetchSandboxSmsInbox(
                                  customerMobile.replace(/\D/g, '')
                                );
                              }
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between"
                          >
                            <span className="flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-[#1363d1]" />
                              <span>
                                {otpProviderName} — View Dispatched SMS (Preview Test Mode)
                              </span>
                            </span>
                            <span className="font-mono text-[11px] text-[#1363d1]">
                              {showSandboxInbox ? 'Hide' : 'Open SMS'}
                            </span>
                          </button>

                          {showSandboxInbox && (
                            <div className="mt-2 p-3 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2">
                              <div className="text-[11px] text-slate-400">
                                Server SMS Gateway Outbox (Add FAST2SMS_API_KEY or MSG91_AUTH_KEY in Secrets for live carrier delivery):
                              </div>
                              {sandboxDispatches.length === 0 ? (
                                <div className="text-slate-400">No active SMS dispatches.</div>
                              ) : (
                                sandboxDispatches.map((item) => (
                                  <div
                                    key={item.dispatchId}
                                    className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="text-emerald-400 font-bold">
                                        To: +91 {item.mobile}
                                      </div>
                                      <div className="text-[11px] text-slate-300">
                                        OTP Code:{' '}
                                        <strong className="text-white text-sm">
                                          {item.otpCodeForSandboxInspection || 'Consumed'}
                                        </strong>
                                      </div>
                                    </div>
                                    {item.otpCodeForSandboxInspection && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setOtpInput(
                                            item.otpCodeForSandboxInspection || ''
                                          )
                                        }
                                        className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold rounded text-[11px]"
                                      >
                                        Fill OTP
                                      </button>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-sm text-slate-500">
                No active products configured.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transparency & Attribution Workflow Explanation Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <h3 className="text-base font-bold text-slate-900 mb-6">
          02. How Secure Mobile OTP Referral Attribution Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Step 1 · Privacy Consent & 10-Digit Indian Mobile</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Customers open their partner's unique link (e.g.{' '}
              <span className="font-mono text-slate-800">
                https://{settings.domain}/ref/FE1001
              </span>
              ), review the privacy notice, accept consent, and enter a valid 10-digit Indian mobile number.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
              <span>Step 2 · Backend HMAC-SHA256 OTP Verification & Redirect</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our backend dispatches a 6-digit SMS OTP (5-minute expiry, 45-second resend cooldown, max 5 attempts) without exposing or storing plain-text OTPs. Upon verification, the referral record is saved and the customer is redirected to{' '}
              <span className="font-mono text-slate-800">{OFFICIAL_GROMO_REDIRECT_URL}</span>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Step 3 · Separate GroMo Report Loan Verification</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verifying mobile OTP records a verified referral lead (<code className="font-mono">Lead Generated</code>) and never marks a loan as successful automatically. Final loan approval and the 80/20 commission split are confirmed separately by Admin from GroMo's official report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
