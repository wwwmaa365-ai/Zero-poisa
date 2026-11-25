/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  collection,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from './lib/firebase';
import {
  PlatformSettings,
  Product,
  RetailerPublic,
  RetailerProfile,
  ReferralLead,
  ApplicationRecord,
  WalletTransaction,
  WithdrawalRequest,
  NotificationItem,
  AuditLog,
  EmailTemplate,
  EmailLogItem,
  EmailTemplateId,
} from './types';
import {
  DEFAULT_PLATFORM_SETTINGS,
  INITIAL_PRODUCTS,
  INITIAL_RETAILERS_PUBLIC,
  INITIAL_RETAILER_PROFILES,
  INITIAL_REFERRAL_LEADS,
  INITIAL_APPLICATIONS,
  INITIAL_WALLET_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './lib/seedData';
import { CustomerReferralView } from './components/CustomerReferralView';
import { RetailerDashboardView } from './components/RetailerDashboardView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';

type WorkspaceMode = 'customer' | 'retailer' | 'admin';

const FALLBACK_EMAIL_TEMPLATES: EmailTemplate[] = [
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
];

export default function App() {
  // Parse initial URL query/path for /ref/FE1001 or /retailer or /admin
  const getInitialWorkspace = (): WorkspaceMode => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    if (path.includes('/admin') || params.get('mode') === 'admin') return 'admin';
    if (path.includes('/ref/') || params.get('mode') === 'customer') return 'customer';
    return 'retailer';
  };

  const getInitialRefCode = (): string => {
    const path = window.location.pathname;
    const match = path.match(/\/ref\/(FE\d+)/i);
    if (match) return match[1].toUpperCase();
    const params = new URLSearchParams(window.location.search);
    return (params.get('ref') || 'FE1001').toUpperCase();
  };

  const [workspace, setWorkspace] = useState<WorkspaceMode>(getInitialWorkspace);
  const [activeReferralCode, setActiveReferralCode] = useState<string>(getInitialRefCode);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    INITIAL_PRODUCTS[0].productId
  );

  // Firebase Auth User
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // Application State (Hydrated with production seed data and synced with Firestore)
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_PLATFORM_SETTINGS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [retailersPublic, setRetailersPublic] = useState<RetailerPublic[]>(
    INITIAL_RETAILERS_PUBLIC
  );
  const [retailerProfiles, setRetailerProfiles] = useState<RetailerProfile[]>(
    INITIAL_RETAILER_PROFILES
  );
  const [activeRetailerId, setActiveRetailerId] = useState<string>('FE1001');
  const [referralLeads, setReferralLeads] = useState<ReferralLead[]>(INITIAL_REFERRAL_LEADS);
  const [applications, setApplications] = useState<ApplicationRecord[]>(INITIAL_APPLICATIONS);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(
    INITIAL_WALLET_TRANSACTIONS
  );
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(INITIAL_WITHDRAWALS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>(
    FALLBACK_EMAIL_TEMPLATES
  );
  const [emailLogs, setEmailLogs] = useState<EmailLogItem[]>([]);

  const isAuthorizedAdmin = Boolean(
    currentUser?.email && currentUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncFromFirestore(user);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const loadEmailTemplatesAndOutbox = async () => {
      try {
        const [tplResp, outboxResp] = await Promise.all([
          fetch('/api/email/templates'),
          fetch('/api/email/outbox'),
        ]);
        if (tplResp.ok) {
          const tplData = await tplResp.json();
          if (Array.isArray(tplData.templates) && tplData.templates.length > 0) {
            setEmailTemplates(tplData.templates);
          }
        }
        if (outboxResp.ok) {
          const outboxData = await outboxResp.json();
          if (Array.isArray(outboxData.emails)) {
            setEmailLogs(outboxData.emails);
          }
        }
      } catch {
        // Keep local fallback templates if server route is warming up
      }
    };
    loadEmailTemplatesAndOutbox();
  }, []);

  const syncFromFirestore = async (user: FirebaseUser) => {
    const isAdminUser =
      user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    try {
      const settingsSnap = await getDoc(doc(db, 'platform_settings', 'global'));
      if (!settingsSnap.exists() && isAdminUser) {
        // Seed initial database records when owner signs in for the first time
        await setDoc(doc(db, 'platform_settings', 'global'), DEFAULT_PLATFORM_SETTINGS);
        for (const p of INITIAL_PRODUCTS) {
          await setDoc(doc(db, 'products', p.productId), p);
        }
        for (const rp of INITIAL_RETAILERS_PUBLIC) {
          await setDoc(doc(db, 'retailers_public', rp.retailerId), rp);
        }
        for (const prof of INITIAL_RETAILER_PROFILES) {
          await setDoc(doc(db, 'retailer_profiles', prof.uid), prof);
        }
        for (const lead of INITIAL_REFERRAL_LEADS) {
          await setDoc(doc(db, 'referral_leads', lead.referralRef), lead);
        }
        for (const app of INITIAL_APPLICATIONS) {
          await setDoc(doc(db, 'applications', app.applicationId), app);
        }
        for (const txn of INITIAL_WALLET_TRANSACTIONS) {
          await setDoc(doc(db, 'wallet_transactions', txn.txnRef), txn);
        }
        for (const wdr of INITIAL_WITHDRAWALS) {
          await setDoc(doc(db, 'withdrawals', wdr.withdrawalId), wdr);
        }
        for (const notif of INITIAL_NOTIFICATIONS) {
          await setDoc(doc(db, 'notifications', notif.notificationId), notif);
        }
        for (const log of INITIAL_AUDIT_LOGS) {
          await setDoc(doc(db, 'audit_logs', log.logId), log);
        }
      } else if (settingsSnap.exists()) {
        const remoteSettings = settingsSnap.data() as PlatformSettings;
        const normalizedSettings: PlatformSettings =
          remoteSettings.platformName === 'Affiliate Share & Earn'
            ? { ...remoteSettings, platformName: 'Zero Poisa' }
            : remoteSettings;
        setSettings(normalizedSettings);
        if (isAdminUser && remoteSettings.platformName === 'Affiliate Share & Earn') {
          await setDoc(doc(db, 'platform_settings', 'global'), normalizedSettings);
        }
      }

      if (isAdminUser) {
        const [
          prodsSnap,
          retSnap,
          pubSnap,
          leadsSnap,
          appsSnap,
          txnsSnap,
          wdrSnap,
          notifSnap,
          logsSnap,
        ] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'retailer_profiles')),
          getDocs(collection(db, 'retailers_public')),
          getDocs(collection(db, 'referral_leads')),
          getDocs(collection(db, 'applications')),
          getDocs(collection(db, 'wallet_transactions')),
          getDocs(collection(db, 'withdrawals')),
          getDocs(collection(db, 'notifications')),
          getDocs(collection(db, 'audit_logs')),
        ]);
        if (!prodsSnap.empty) setProducts(prodsSnap.docs.map((d) => d.data() as Product));
        if (!retSnap.empty)
          setRetailerProfiles(retSnap.docs.map((d) => d.data() as RetailerProfile));
        if (!pubSnap.empty)
          setRetailersPublic(pubSnap.docs.map((d) => d.data() as RetailerPublic));
        if (!leadsSnap.empty)
          setReferralLeads(leadsSnap.docs.map((d) => d.data() as ReferralLead));
        if (!appsSnap.empty)
          setApplications(appsSnap.docs.map((d) => d.data() as ApplicationRecord));
        if (!txnsSnap.empty)
          setWalletTransactions(txnsSnap.docs.map((d) => d.data() as WalletTransaction));
        if (!wdrSnap.empty)
          setWithdrawals(wdrSnap.docs.map((d) => d.data() as WithdrawalRequest));
        if (!notifSnap.empty)
          setNotifications(notifSnap.docs.map((d) => d.data() as NotificationItem));
        if (!logsSnap.empty) setAuditLogs(logsSnap.docs.map((d) => d.data() as AuditLog));
      } else {
        // Non-admin retailer: load only their own profile and records (Pillar 8 Secure List Queries)
        const myProfSnap = await getDoc(doc(db, 'retailer_profiles', user.uid));
        if (myProfSnap.exists()) {
          const myProf = myProfSnap.data() as RetailerProfile;
          setRetailerProfiles((prev) => [
            myProf,
            ...prev.filter((r) => r.retailerId !== myProf.retailerId),
          ]);
          setActiveRetailerId(myProf.retailerId);
        }
      }
    } catch (err) {
      console.warn('Firestore sync note:', err);
    }
  };

  const handleSignInGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      console.error('Google Sign-In error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const appendAuditLog = async (action: string, details: string) => {
    const nowIso = new Date().toISOString();
    const newLog: AuditLog = {
      logId: `LOG-${Date.now()}`,
      actorUid: currentUser?.uid || 'admin_sanjit',
      actorName: currentUser?.email || `${settings.ownerName} (Admin)`,
      action,
      details: details.slice(0, 500),
      createdAt: nowIso,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'audit_logs', newLog.logId), newLog);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `audit_logs/${newLog.logId}`);
      }
    }
  };

  // Customer Referral Consent Submission Handler
  const handleSubmitReferralLead = async (newLead: ReferralLead) => {
    setReferralLeads((prev) => [newLead, ...prev]);
    // Increment retailer referral count & create Clicked/Lead Generated application tracking entry
    setRetailerProfiles((prev) =>
      prev.map((r) =>
        r.retailerId === newLead.retailerId
          ? {
              ...r,
              totalReferrals: r.totalReferrals + 1,
              totalClicks: r.totalClicks + 1,
              updatedAt: newLead.createdAt,
            }
          : r
      )
    );

    const prod = products.find((p) => p.productId === newLead.productId);
    const estComm = prod?.estimatedCommission || 1000;
    const retShare = Math.round((estComm * settings.retailerSharePercent) / 100);

    const pendingApp: ApplicationRecord = {
      applicationId: `APP-${newLead.referralRef.replace('REF-', '')}`,
      referralRef: newLead.referralRef,
      customerName: newLead.customerName,
      customerMobile: newLead.customerMobile,
      productId: newLead.productId,
      productTitle: newLead.productTitle,
      retailerId: newLead.retailerId,
      retailerUid: newLead.retailerUid,
      retailerName: newLead.retailerName,
      status: 'Lead Generated',
      gromoCommission: estComm,
      retailerCommission: retShare,
      adminCommission: estComm - retShare,
      gromoTxnRef: 'PENDING_GROMO_VERIFICATION',
      verificationDate: newLead.createdAt.slice(0, 10),
      adminNotes: 'Customer consented on referral landing page and redirected to GroMo.',
      isUnmatched: false,
      walletCredited: false,
      createdAt: newLead.createdAt,
      updatedAt: newLead.createdAt,
    };
    setApplications((prev) => [pendingApp, ...prev]);

    try {
      await setDoc(doc(db, 'referral_leads', newLead.referralRef), newLead);
    } catch (e) {
      // Customer referral lead creation is allowed publicly when consentGiven == true
      handleFirestoreError(e, OperationType.CREATE, `referral_leads/${newLead.referralRef}`);
    }
  };

  // Retailer Registration with Auto Permanent ID Generation (FE1004, FE1005...)
  const handleRegisterRetailer = async (data: {
    name: string;
    mobile: string;
    city: string;
    upiId: string;
  }) => {
    const seq = settings.nextRetailerSeq;
    const newRetailerId = `FE${seq}`;
    const uid = currentUser?.uid || `ret_${newRetailerId.toLowerCase()}`;
    const nowIso = new Date().toISOString();

    const newPublic: RetailerPublic = {
      retailerId: newRetailerId,
      uid,
      name: data.name,
      status: 'active',
      createdAt: nowIso,
    };

    const newProfile: RetailerProfile = {
      uid,
      retailerId: newRetailerId,
      name: data.name,
      mobile: data.mobile,
      email: currentUser?.email || `${newRetailerId.toLowerCase()}@foodexpres.in`,
      city: data.city,
      upiId: data.upiId,
      status: 'active',
      customCommissionPercent: -1,
      walletBalance: 0,
      pendingEarnings: 0,
      totalVerifiedEarnings: 0,
      totalWithdrawn: 0,
      totalClicks: 0,
      totalReferrals: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const updatedSettings: PlatformSettings = {
      ...settings,
      nextRetailerSeq: seq + 1,
      updatedAt: nowIso,
    };

    setRetailersPublic((prev) => [...prev, newPublic]);
    setRetailerProfiles((prev) => [...prev, newProfile]);
    setSettings(updatedSettings);
    setActiveRetailerId(newRetailerId);

    if (currentUser) {
      try {
        await setDoc(doc(db, 'retailers_public', newRetailerId), newPublic);
        await setDoc(doc(db, 'retailer_profiles', uid), newProfile);
        await setDoc(doc(db, 'platform_settings', 'global'), updatedSettings);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `retailer_profiles/${uid}`);
      }
    }
  };

  const handleUpdateRetailerProfile = async (data: {
    name: string;
    mobile: string;
    city: string;
    upiId: string;
  }) => {
    const nowIso = new Date().toISOString();
    setRetailerProfiles((prev) =>
      prev.map((r) =>
        r.retailerId === activeRetailerId
          ? {
              ...r,
              name: data.name,
              mobile: data.mobile,
              city: data.city,
              upiId: data.upiId,
              updatedAt: nowIso,
            }
          : r
      )
    );
    setRetailersPublic((prev) =>
      prev.map((rp) =>
        rp.retailerId === activeRetailerId ? { ...rp, name: data.name } : rp
      )
    );
  };

  const handleRequestWithdrawal = async (amount: number, paymentMethod: string) => {
    const activeRet = retailerProfiles.find((r) => r.retailerId === activeRetailerId);
    if (!activeRet) return;

    const nowIso = new Date().toISOString();
    const wdrId = `WDR-${nowIso.slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100 + Math.random() * 900
    )}`;
    const newWdr: WithdrawalRequest = {
      withdrawalId: wdrId,
      retailerId: activeRet.retailerId,
      retailerUid: activeRet.uid,
      retailerName: activeRet.name,
      amount,
      paymentMethod,
      status: 'Pending',
      paymentRef: '',
      adminReason: 'Awaiting Admin review',
      requestedAt: nowIso,
      updatedAt: nowIso,
    };

    const newBalance = Math.max(0, activeRet.walletBalance - amount);
    const txn: WalletTransaction = {
      txnRef: `TXN-${wdrId}`,
      retailerId: activeRet.retailerId,
      retailerUid: activeRet.uid,
      retailerName: activeRet.name,
      type: 'withdrawal',
      amount,
      balanceAfter: newBalance,
      reason: `Withdrawal requested via ${paymentMethod}`,
      relatedAppId: wdrId,
      createdBy: `${activeRet.name} (${activeRet.retailerId})`,
      createdAt: nowIso,
    };

    setWithdrawals((prev) => [newWdr, ...prev]);
    setWalletTransactions((prev) => [txn, ...prev]);
    setRetailerProfiles((prev) =>
      prev.map((r) =>
        r.retailerId === activeRet.retailerId
          ? {
              ...r,
              walletBalance: newBalance,
              totalWithdrawn: r.totalWithdrawn + amount,
              updatedAt: nowIso,
            }
          : r
      )
    );

    if (currentUser && currentUser.uid === activeRet.uid) {
      try {
        await setDoc(doc(db, 'withdrawals', wdrId), newWdr);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, `withdrawals/${wdrId}`);
      }
    }
  };

  const handleSimulateShareClick = async (retailerId: string, _productId: string) => {
    setRetailerProfiles((prev) =>
      prev.map((r) =>
        r.retailerId === retailerId ? { ...r, totalClicks: r.totalClicks + 1 } : r
      )
    );
  };

  // Admin Handlers
  const handleUpdateSettings = async (newSettings: PlatformSettings, actionNote: string) => {
    setSettings(newSettings);
    await appendAuditLog('SETTINGS_UPDATED', actionNote);
    if (isAuthorizedAdmin) {
      try {
        await setDoc(doc(db, 'platform_settings', 'global'), newSettings);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, 'platform_settings/global');
      }
    }
  };

  const handleToggleRetailerStatus = async (retailerId: string) => {
    let nextStatus: 'active' | 'inactive' = 'active';
    setRetailerProfiles((prev) =>
      prev.map((r) => {
        if (r.retailerId === retailerId) {
          nextStatus = r.status === 'active' ? 'inactive' : 'active';
          return { ...r, status: nextStatus, updatedAt: new Date().toISOString() };
        }
        return r;
      })
    );
    setRetailersPublic((prev) =>
      prev.map((rp) => (rp.retailerId === retailerId ? { ...rp, status: nextStatus } : rp))
    );
    await appendAuditLog(
      'RETAILER_STATUS_CHANGED',
      `Set Retailer ${retailerId} status to ${nextStatus}`
    );
  };

  const handleUpdateRetailerCustomCommission = async (
    retailerId: string,
    customPercent: number
  ) => {
    setRetailerProfiles((prev) =>
      prev.map((r) =>
        r.retailerId === retailerId
          ? { ...r, customCommissionPercent: customPercent, updatedAt: new Date().toISOString() }
          : r
      )
    );
    await appendAuditLog(
      'RETAILER_COMMISSION_OVERRIDE',
      `Set Retailer ${retailerId} custom commission to ${
        customPercent === -1 ? 'Global Default' : `${customPercent}%`
      }`
    );
  };

  const handleSaveProduct = async (product: Product, isNew: boolean) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.productId === product.productId);
      if (exists) {
        return prev.map((p) => (p.productId === product.productId ? product : p));
      }
      return [product, ...prev];
    });
    await appendAuditLog(
      isNew ? 'PRODUCT_CREATED' : 'PRODUCT_UPDATED',
      `${isNew ? 'Added' : 'Updated'} product ${product.title} (${product.productId})`
    );
    if (isAuthorizedAdmin) {
      try {
        await setDoc(doc(db, 'products', product.productId), product);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `products/${product.productId}`);
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.productId !== productId));
    if (isAuthorizedAdmin) {
      try {
        await deleteDoc(doc(db, 'products', productId));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `products/${productId}`);
      }
    }
  };

  // Helper to render and dispatch a templated email via /api/email/send
  const dispatchTemplatedEmail = async (
    templateId: EmailTemplateId,
    retailer: RetailerProfile | undefined,
    retailerId: string,
    retailerName: string,
    variables: Record<string, string>
  ) => {
    const toEmail =
      retailer?.email || `${retailerId.toLowerCase()}@foodexpres.in`;

    try {
      const resp = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          toEmail,
          retailerId,
          retailerName,
          variables: {
            ...variables,
            retailerId,
            retailerName,
            retailerEmail: toEmail,
            platformName: settings.platformName,
            domain: settings.domain,
          },
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data.email) {
          setEmailLogs((prev) => [data.email as EmailLogItem, ...prev]);
          await appendAuditLog(
            'EMAIL_NOTIFICATION_DISPATCHED',
            `Template [${templateId}] sent to ${toEmail} (${retailerId}). Subject: "${data.email.subject}"`
          );
          return;
        }
      }
    } catch {
      // Fallback client-side template rendering if API is unreachable
    }

    const tpl =
      emailTemplates.find((t) => t.templateId === templateId) ||
      FALLBACK_EMAIL_TEMPLATES[0];
    const mergedVars: Record<string, string> = {
      ...variables,
      retailerId,
      retailerName,
      retailerEmail: toEmail,
      platformName: settings.platformName,
      domain: settings.domain,
    };
    const renderStr = (str: string) =>
      str.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, k) =>
        mergedVars[k] !== undefined && mergedVars[k] !== '' ? mergedVars[k] : 'N/A'
      );

    const fallbackItem: EmailLogItem = {
      emailId: `EML-${Date.now().toString().slice(-6)}`,
      templateId,
      retailerId,
      retailerName,
      toEmail,
      fromEmail: 'notifications@earn.foodexpres.in',
      subject: renderStr(tpl.subjectTemplate),
      body: renderStr(tpl.bodyTemplate),
      status: 'Dispatched (Sandbox Outbox)',
      provider: 'Template Engine Sandbox Outbox',
      variablesUsed: mergedVars,
      sentAt: new Date().toISOString(),
    };
    setEmailLogs((prev) => [fallbackItem, ...prev]);
  };

  const handleUpdateEmailTemplate = async (
    templateId: EmailTemplateId,
    subjectTemplate: string,
    bodyTemplate: string
  ) => {
    const nowIso = new Date().toISOString();
    setEmailTemplates((prev) =>
      prev.map((t) =>
        t.templateId === templateId
          ? { ...t, subjectTemplate, bodyTemplate, updatedAt: nowIso }
          : t
      )
    );

    try {
      const resp = await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, subjectTemplate, bodyTemplate }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.template) {
          setEmailTemplates((prev) =>
            prev.map((t) =>
              t.templateId === templateId ? (data.template as EmailTemplate) : t
            )
          );
        }
      }
    } catch {
      // Updated in state
    }

    await appendAuditLog(
      'EMAIL_TEMPLATE_UPDATED',
      `Updated email notification template [${templateId}]`
    );
  };

  const handleVerifyOrSaveApplication = async (
    appRecord: ApplicationRecord,
    creditWalletNow: boolean
  ) => {
    setApplications((prev) => {
      const exists = prev.some((a) => a.applicationId === appRecord.applicationId);
      if (exists) {
        return prev.map((a) => (a.applicationId === appRecord.applicationId ? appRecord : a));
      }
      return [appRecord, ...prev];
    });

    if (appRecord.referralRef && appRecord.referralRef !== 'UNMATCHED') {
      setReferralLeads((prev) =>
        prev.map((l) =>
          l.referralRef === appRecord.referralRef ? { ...l, status: appRecord.status } : l
        )
      );
    }

    if (creditWalletNow && !appRecord.isUnmatched && appRecord.retailerCommission > 0) {
      const targetRet = retailerProfiles.find((r) => r.retailerId === appRecord.retailerId);
      const currentBal = targetRet?.walletBalance || 0;
      const nextBal = currentBal + appRecord.retailerCommission;
      const nowIso = new Date().toISOString();
      const txnRef = `TXN-${appRecord.gromoTxnRef || Date.now()}`;

      const newTxn: WalletTransaction = {
        txnRef,
        retailerId: appRecord.retailerId,
        retailerUid: appRecord.retailerUid,
        retailerName: appRecord.retailerName,
        type: 'credit',
        amount: appRecord.retailerCommission,
        balanceAfter: nextBal,
        reason: `Verified GroMo Commission (₹${appRecord.gromoCommission}) for ${appRecord.customerName} — ${appRecord.productTitle}`,
        relatedAppId: appRecord.applicationId,
        createdBy: `${settings.ownerName} (Admin)`,
        createdAt: nowIso,
      };

      setWalletTransactions((prev) => [newTxn, ...prev]);
      setRetailerProfiles((prev) =>
        prev.map((r) =>
          r.retailerId === appRecord.retailerId
            ? {
                ...r,
                walletBalance: nextBal,
                totalVerifiedEarnings: r.totalVerifiedEarnings + appRecord.retailerCommission,
                updatedAt: nowIso,
              }
            : r
        )
      );

      const newNotif: NotificationItem = {
        notificationId: `NOTIF-${Date.now()}`,
        targetUid: appRecord.retailerUid,
        targetRole: 'retailer',
        title: `₹${appRecord.retailerCommission} Credited — GroMo Verification`,
        message: `Application ${appRecord.applicationId} (${appRecord.customerName} · ${appRecord.productTitle}) verified. ₹${appRecord.retailerCommission} credited to your wallet & email notification dispatched.`,
        category: 'Verification',
        createdAt: nowIso,
      };
      setNotifications((prev) => [newNotif, ...prev]);

      // Automatically dispatch COMMISSION_CREDITED email using template
      await dispatchTemplatedEmail(
        'COMMISSION_CREDITED',
        targetRet,
        appRecord.retailerId,
        appRecord.retailerName,
        {
          creditedAmount: appRecord.retailerCommission.toLocaleString('en-IN'),
          gromoCommission: appRecord.gromoCommission.toLocaleString('en-IN'),
          newWalletBalance: nextBal.toLocaleString('en-IN'),
          applicationId: appRecord.applicationId,
          customerName: appRecord.customerName,
          productTitle: appRecord.productTitle,
          txnRef,
          verificationDate: appRecord.verificationDate || nowIso.slice(0, 10),
        }
      );
    }

    await appendAuditLog(
      'GROMO_APPLICATION_VERIFIED',
      `Application ${appRecord.applicationId} (${appRecord.customerName}) marked ${appRecord.status}. GroMo Commission: ₹${appRecord.gromoCommission}, Retailer (${appRecord.retailerId}): ₹${appRecord.retailerCommission}, Admin: ₹${appRecord.adminCommission}`
    );

    if (isAuthorizedAdmin) {
      try {
        await setDoc(doc(db, 'applications', appRecord.applicationId), appRecord);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `applications/${appRecord.applicationId}`);
      }
    }
  };

  const handleAssignUnmatchedApplication = async (
    applicationId: string,
    targetRetailerId: string,
    creditWalletNow: boolean
  ) => {
    const app = applications.find((a) => a.applicationId === applicationId);
    const ret = retailerProfiles.find((r) => r.retailerId === targetRetailerId);
    if (!app || !ret) return;

    const updatedApp: ApplicationRecord = {
      ...app,
      retailerId: ret.retailerId,
      retailerUid: ret.uid,
      retailerName: ret.name,
      isUnmatched: false,
      walletCredited: creditWalletNow,
      adminNotes: `${app.adminNotes} | Manually assigned by Admin to ${ret.retailerId}`,
      updatedAt: new Date().toISOString(),
    };

    await handleVerifyOrSaveApplication(updatedApp, creditWalletNow);
  };

  const handleManualWalletAdjustment = async (
    retailerId: string,
    type: 'credit' | 'debit',
    amount: number,
    reason: string
  ) => {
    const ret = retailerProfiles.find((r) => r.retailerId === retailerId);
    if (!ret) return;

    const nextBal =
      type === 'credit'
        ? ret.walletBalance + amount
        : Math.max(0, ret.walletBalance - amount);
    const nowIso = new Date().toISOString();
    const txnRef = `TXN-ADJ-${Date.now().toString().slice(-6)}`;

    const newTxn: WalletTransaction = {
      txnRef,
      retailerId: ret.retailerId,
      retailerUid: ret.uid,
      retailerName: ret.name,
      type,
      amount,
      balanceAfter: nextBal,
      reason,
      relatedAppId: 'MANUAL_ADMIN_ADJUSTMENT',
      createdBy: `${settings.ownerName} (Admin)`,
      createdAt: nowIso,
    };

    setWalletTransactions((prev) => [newTxn, ...prev]);
    setRetailerProfiles((prev) =>
      prev.map((r) =>
        r.retailerId === retailerId
          ? {
              ...r,
              walletBalance: nextBal,
              totalVerifiedEarnings:
                type === 'credit' ? r.totalVerifiedEarnings + amount : r.totalVerifiedEarnings,
              updatedAt: nowIso,
            }
          : r
      )
    );

    if (type === 'credit') {
      const creditNotif: NotificationItem = {
        notificationId: `NOTIF-${Date.now()}`,
        targetUid: ret.uid,
        targetRole: 'retailer',
        title: `₹${amount} Commission Credited to Wallet`,
        message: `Admin credited ₹${amount} (${reason}). Updated balance: ₹${nextBal}. Email notification sent to ${ret.email}.`,
        category: 'Wallet Credit',
        createdAt: nowIso,
      };
      setNotifications((prev) => [creditNotif, ...prev]);

      await dispatchTemplatedEmail(
        'COMMISSION_CREDITED',
        ret,
        ret.retailerId,
        ret.name,
        {
          creditedAmount: amount.toLocaleString('en-IN'),
          gromoCommission: amount.toLocaleString('en-IN'),
          newWalletBalance: nextBal.toLocaleString('en-IN'),
          applicationId: 'MANUAL_ADMIN_CREDIT',
          customerName: 'Direct Admin Credit',
          productTitle: reason,
          txnRef,
          verificationDate: nowIso.slice(0, 10),
        }
      );
    }

    await appendAuditLog(
      `WALLET_MANUAL_${type.toUpperCase()}`,
      `${type.toUpperCase()} ₹${amount} for Retailer ${retailerId} (${ret.name}). Reason: ${reason}. Ref: ${txnRef}`
    );
  };

  const handleProcessWithdrawal = async (
    withdrawalId: string,
    newStatus: 'Approved' | 'Completed' | 'Rejected',
    paymentRef: string,
    adminReason: string
  ) => {
    const targetWdr = withdrawals.find((w) => w.withdrawalId === withdrawalId);
    if (!targetWdr) return;

    const nowIso = new Date().toISOString();
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.withdrawalId === withdrawalId
          ? {
              ...w,
              status: newStatus,
              paymentRef,
              adminReason,
              updatedAt: nowIso,
            }
          : w
      )
    );

    const ret = retailerProfiles.find((r) => r.retailerId === targetWdr.retailerId);
    let updatedBalance = ret?.walletBalance || 0;

    // If rejected, refund the amount back to the retailer's wallet
    if (newStatus === 'Rejected' && ret) {
      updatedBalance = ret.walletBalance + targetWdr.amount;
      setRetailerProfiles((prev) =>
        prev.map((r) =>
          r.retailerId === ret.retailerId
            ? {
                ...r,
                walletBalance: updatedBalance,
                totalWithdrawn: Math.max(0, r.totalWithdrawn - targetWdr.amount),
                updatedAt: nowIso,
              }
            : r
        )
      );
      const refundTxn: WalletTransaction = {
        txnRef: `TXN-REFUND-${withdrawalId}`,
        retailerId: ret.retailerId,
        retailerUid: ret.uid,
        retailerName: ret.name,
        type: 'credit',
        amount: targetWdr.amount,
        balanceAfter: updatedBalance,
        reason: `Refund for Rejected Withdrawal ${withdrawalId}: ${adminReason}`,
        relatedAppId: withdrawalId,
        createdBy: `${settings.ownerName} (Admin)`,
        createdAt: nowIso,
      };
      setWalletTransactions((prev) => [refundTxn, ...prev]);
    }

    const wdrNotif: NotificationItem = {
      notificationId: `NOTIF-${Date.now()}`,
      targetUid: targetWdr.retailerUid,
      targetRole: 'retailer',
      title: `Withdrawal ${withdrawalId} Status: ${newStatus}`,
      message: `Your withdrawal request of ₹${targetWdr.amount} is now ${newStatus}. ${
        paymentRef ? `Ref: ${paymentRef}. ` : ''
      }An email notification has been sent to ${ret?.email || 'your registered email'}.`,
      category: 'Withdrawal',
      createdAt: nowIso,
    };
    setNotifications((prev) => [wdrNotif, ...prev]);

    // Automatically dispatch WITHDRAWAL_STATUS_UPDATED email using template
    await dispatchTemplatedEmail(
      'WITHDRAWAL_STATUS_UPDATED',
      ret,
      targetWdr.retailerId,
      targetWdr.retailerName,
      {
        withdrawalId: targetWdr.withdrawalId,
        amount: targetWdr.amount.toLocaleString('en-IN'),
        status: newStatus,
        paymentMethod: targetWdr.paymentMethod,
        paymentRef: paymentRef || 'Pending Bank/UPI Settlement',
        adminReason: adminReason || `Status updated to ${newStatus}`,
        newWalletBalance: updatedBalance.toLocaleString('en-IN'),
      }
    );

    await appendAuditLog(
      `WITHDRAWAL_${newStatus.toUpperCase()}`,
      `Withdrawal ${withdrawalId} (${targetWdr.retailerId}: ₹${targetWdr.amount}) marked ${newStatus}. Ref: ${paymentRef}`
    );
  };

  const handleSendNotification = async (
    title: string,
    message: string,
    category: string,
    targetRole: 'all' | 'retailer' | 'admin',
    targetUid: string
  ) => {
    const nowIso = new Date().toISOString();
    const notif: NotificationItem = {
      notificationId: `NOTIF-${Date.now()}`,
      targetUid,
      targetRole,
      title,
      message,
      category,
      createdAt: nowIso,
    };
    setNotifications((prev) => [notif, ...prev]);
    await appendAuditLog('NOTIFICATION_SENT', `Sent "${title}" to ${targetRole}`);
  };

  const activeRetailerProfile =
    retailerProfiles.find((r) => r.retailerId === activeRetailerId) || null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
        {/* Strict 3-Zone Top Bar Contract (Section 2 of frontend-design skill) */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setWorkspace('customer');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 font-display"
          >
            {settings.platformName}
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 overflow-x-auto">
            <a
              href="#customer-referral"
              onClick={(e) => {
                e.preventDefault();
                setWorkspace('customer');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                workspace === 'customer'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Referral Landing
            </a>
            <a
              href="#retailer-portal"
              onClick={(e) => {
                e.preventDefault();
                setWorkspace('retailer');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                workspace === 'retailer'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Retailer Portal
            </a>
            <a
              href="#admin-console"
              onClick={(e) => {
                e.preventDefault();
                setWorkspace('admin');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                workspace === 'admin'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : ''
              }`}
            >
              Admin Dashboard
            </a>
            <a
              href="#gromo-verification"
              onClick={(e) => {
                e.preventDefault();
                setWorkspace('admin');
              }}
              className="hidden md:inline-block hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              GroMo Verification
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            {currentUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSignInGoogle}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                Partner Sign In
              </button>
            )}
          </div>
        </header>

        {/* Active Workspace View */}
        <div className="flex-1">
          {workspace === 'customer' && (
            <CustomerReferralView
              settings={settings}
              products={products}
              retailersPublic={retailersPublic}
              referralLeads={referralLeads}
              activeRetailerCode={activeReferralCode}
              selectedProductId={selectedProductId}
              onSelectRetailerCode={setActiveReferralCode}
              onSelectProductId={setSelectedProductId}
              onSubmitReferralLead={handleSubmitReferralLead}
              onSwitchWorkspace={setWorkspace}
            />
          )}

          {workspace === 'retailer' && (
            <RetailerDashboardView
              settings={settings}
              products={products}
              currentUserUid={currentUser?.uid || null}
              currentUserEmail={currentUser?.email || null}
              activeRetailer={activeRetailerProfile}
              allRetailers={retailerProfiles}
              referralLeads={referralLeads}
              applications={applications}
              walletTransactions={walletTransactions}
              withdrawals={withdrawals}
              notifications={notifications}
              emailLogs={emailLogs}
              onSignInGoogle={handleSignInGoogle}
              onRegisterRetailer={handleRegisterRetailer}
              onUpdateProfile={handleUpdateRetailerProfile}
              onRequestWithdrawal={handleRequestWithdrawal}
              onSelectDemoRetailer={setActiveRetailerId}
              onSimulateShareClick={handleSimulateShareClick}
              onOpenReferralPreview={(retId, prodId) => {
                setActiveReferralCode(retId);
                setSelectedProductId(prodId);
                setWorkspace('customer');
              }}
            />
          )}

          {workspace === 'admin' && (
            <AdminDashboardView
              settings={settings}
              products={products}
              retailers={retailerProfiles}
              referralLeads={referralLeads}
              applications={applications}
              walletTransactions={walletTransactions}
              withdrawals={withdrawals}
              notifications={notifications}
              auditLogs={auditLogs}
              emailTemplates={emailTemplates}
              emailLogs={emailLogs}
              currentUserEmail={currentUser?.email || null}
              isAuthorizedAdmin={isAuthorizedAdmin}
              onSignInGoogle={handleSignInGoogle}
              onUpdateSettings={handleUpdateSettings}
              onToggleRetailerStatus={handleToggleRetailerStatus}
              onUpdateRetailerCustomCommission={handleUpdateRetailerCustomCommission}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onVerifyOrSaveApplication={handleVerifyOrSaveApplication}
              onAssignUnmatchedApplication={handleAssignUnmatchedApplication}
              onManualWalletAdjustment={handleManualWalletAdjustment}
              onProcessWithdrawal={handleProcessWithdrawal}
              onSendNotification={handleSendNotification}
              onUpdateEmailTemplate={handleUpdateEmailTemplate}
            />
          )}
        </div>

        {/* Clean Minimalist Footer */}
        <footer className="bg-white border-t border-slate-200 py-5 px-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              © 2026 {settings.platformName} ({settings.domain}) · Owner: {settings.ownerName}
            </div>
            <div className="flex items-center gap-4">
              <span>Independent Authorized GroMo Affiliate Partner</span>
              <span aria-hidden="true">·</span>
              <span>Manual Admin Verification & 80/20 Commission Split</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
