import React, { useState } from 'react';
import {
  PlatformSettings,
  Product,
  RetailerProfile,
  ReferralLead,
  ApplicationRecord,
  WalletTransaction,
  WithdrawalRequest,
  NotificationItem,
  EmailLogItem,
} from '../types';
import { ResilientImage } from './ResilientImage';
import { calculateCommissionSplit, ZERO_POISA_LOGO } from '../lib/seedData';
import {
  Share2,
  Copy,
  Check,
  Wallet,
  ArrowUpRight,
  Users,
  FileCheck,
  Clock,
  Bell,
  User,
  LogIn,
  Send,
  ExternalLink,
  AlertCircle,
  CreditCard,
  Banknote,
  Landmark,
  RefreshCw,
  TrendingUp,
  Coins,
  Smartphone,
  Percent,
  Building2,
  PlayCircle,
  HelpCircle,
  LayoutGrid,
  Sparkles,
  KeyRound,
  BarChart3,
  Mail,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface RetailerDashboardViewProps {
  settings: PlatformSettings;
  products: Product[];
  currentUserUid: string | null;
  currentUserEmail: string | null;
  activeRetailer: RetailerProfile | null;
  allRetailers: RetailerProfile[];
  referralLeads: ReferralLead[];
  applications: ApplicationRecord[];
  walletTransactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  notifications: NotificationItem[];
  emailLogs: EmailLogItem[];
  onSignInGoogle: () => Promise<void>;
  onRegisterRetailer: (data: {
    name: string;
    mobile: string;
    city: string;
    upiId: string;
  }) => Promise<void>;
  onUpdateProfile: (data: {
    name: string;
    mobile: string;
    city: string;
    upiId: string;
  }) => Promise<void>;
  onRequestWithdrawal: (amount: number, paymentMethod: string) => Promise<void>;
  onSelectDemoRetailer: (retailerId: string) => void;
  onSimulateShareClick: (retailerId: string, productId: string) => Promise<void>;
  onOpenReferralPreview: (retailerId: string, productId: string) => void;
}

// 9 Distinct Category Grid definitions inspired by the "Sell and Earn" fintech UI
const CATEGORY_GRID_META: {
  id: string;
  label: string;
  matchCategory: string;
  earningBadge: string;
  icon: React.ElementType;
  circleBg: string;
  iconColor: string;
}[] = [
  {
    id: 'cc',
    label: 'Credit Card',
    matchCategory: 'Credit Card',
    earningBadge: '₹4,080',
    icon: CreditCard,
    circleBg: 'bg-sky-50 border-sky-100',
    iconColor: 'text-slate-800',
  },
  {
    id: 'loan',
    label: 'Loan',
    matchCategory: 'Loan',
    earningBadge: '4.20%',
    icon: Banknote,
    circleBg: 'bg-emerald-50 border-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'saving',
    label: 'Saving A/c',
    matchCategory: 'Saving A/c',
    earningBadge: '₹1,000',
    icon: Landmark,
    circleBg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'secured',
    label: 'Secured Card',
    matchCategory: 'Secured Card',
    earningBadge: '₹2,700',
    icon: RefreshCw,
    circleBg: 'bg-indigo-50 border-indigo-100',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'demat',
    label: 'Demat A/c',
    matchCategory: 'Demat A/c',
    earningBadge: '₹500',
    icon: TrendingUp,
    circleBg: 'bg-cyan-50 border-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    id: 'invest',
    label: 'Investment',
    matchCategory: 'Investment',
    earningBadge: '₹1,800',
    icon: Coins,
    circleBg: 'bg-amber-50 border-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    id: 'cline',
    label: 'Credit Line',
    matchCategory: 'Credit Line',
    earningBadge: '3.6%',
    icon: Smartphone,
    circleBg: 'bg-teal-50 border-teal-100',
    iconColor: 'text-teal-600',
  },
  {
    id: 'deals',
    label: 'Instant Deals',
    matchCategory: 'Instant Deals',
    earningBadge: 'Earn ₹720',
    icon: Percent,
    circleBg: 'bg-violet-50 border-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    id: 'biz',
    label: 'Business Loan',
    matchCategory: 'Business Loan',
    earningBadge: '2.4%',
    icon: Building2,
    circleBg: 'bg-blue-50 border-blue-100',
    iconColor: 'text-blue-700',
  },
];

export const RetailerDashboardView: React.FC<RetailerDashboardViewProps> = ({
  settings,
  products,
  currentUserUid,
  currentUserEmail,
  activeRetailer,
  allRetailers,
  referralLeads,
  applications,
  walletTransactions,
  withdrawals,
  notifications,
  emailLogs,
  onSignInGoogle,
  onRegisterRetailer,
  onUpdateProfile,
  onRequestWithdrawal,
  onSelectDemoRetailer,
  onSimulateShareClick,
  onOpenReferralPreview,
}) => {
  const [activeTab, setActiveTab] = useState<
    'sell' | 'leads' | 'wallet' | 'guide' | 'profile'
  >('sell');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);

  // Registration & OTP verification state
  const [authMode, setAuthMode] = useState<'register' | 'recover'>('register');
  const [regName, setRegName] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regCity, setRegCity] = useState('Kolkata, West Bengal');
  const [regUpi, setRegUpi] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Password / Retailer ID Recovery state
  const [recoverMobile, setRecoverMobile] = useState('');
  const [recoverOtpSent, setRecoverOtpSent] = useState(false);
  const [recoverOtpInput, setRecoverOtpInput] = useState('');
  const [recoverNewPin, setRecoverNewPin] = useState('');
  const [recoverStatusMsg, setRecoverStatusMsg] = useState<string | null>(null);

  // Share state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customShareNote, setCustomShareNote] = useState(
    'Apply for this financial product using my referral link:'
  );

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawStatusMsg, setWithdrawStatusMsg] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Profile edit state
  const [editName, setEditName] = useState(activeRetailer?.name || '');
  const [editMobile, setEditMobile] = useState(activeRetailer?.mobile || '');
  const [editCity, setEditCity] = useState(activeRetailer?.city || '');
  const [editUpi, setEditUpi] = useState(activeRetailer?.upiId || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState<string | null>(null);
  const [expandedRetailerEmailId, setExpandedRetailerEmailId] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeRetailer) {
      setEditName(activeRetailer.name);
      setEditMobile(activeRetailer.mobile);
      setEditCity(activeRetailer.city);
      setEditUpi(activeRetailer.upiId);
      setWithdrawMethod(`UPI: ${activeRetailer.upiId}`);
    }
  }, [activeRetailer]);

  // Strict Data Isolation: Filter strictly for activeRetailer.retailerId
  const myLeads = activeRetailer
    ? referralLeads.filter((l) => l.retailerId === activeRetailer.retailerId)
    : [];
  const myApps = activeRetailer
    ? applications.filter((a) => a.retailerId === activeRetailer.retailerId && !a.isUnmatched)
    : [];
  const myEmails = activeRetailer
    ? emailLogs.filter((e) => e.retailerId === activeRetailer.retailerId)
    : [];
  const myTxns = activeRetailer
    ? walletTransactions.filter((t) => t.retailerId === activeRetailer.retailerId)
    : [];
  const myWithdrawals = activeRetailer
    ? withdrawals.filter((w) => w.retailerId === activeRetailer.retailerId)
    : [];
  const myNotifications = activeRetailer
    ? notifications.filter(
        (n) =>
          n.targetRole === 'all' ||
          n.targetRole === 'retailer' ||
          n.targetUid === activeRetailer.uid
      )
    : [];

  const successfulAppsCount = myApps.filter((a) => a.status === 'Successful').length;
  const pendingAppsCount = myApps.filter(
    (a) => a.status === 'Pending' || a.status === 'Applied' || a.status === 'Lead Generated'
  ).length;
  const rejectedAppsCount = myApps.filter(
    (a) => a.status === 'Rejected' || a.status === 'Cancelled'
  ).length;

  // Build 30-day Clicks vs. Applications time series for Recharts visualization
  const last30DaysChartData = React.useMemo(() => {
    const baseClicks = activeRetailer?.totalClicks || 42;
    const baseApps = Math.max(myApps.length, 1);
    const seedOffset =
      activeRetailer?.retailerId === 'FE1001'
        ? 3
        : activeRetailer?.retailerId === 'FE1002'
        ? 2
        : 1;

    const points: {
      day: string;
      clicks: number;
      applications: number;
      verified: number;
    }[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(2026, 10, 23 - i); // Anchored around 23 Nov 2026
      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      const wave = ((29 - i) * 7 + seedOffset * 5) % 9;
      const dailyClicks = Math.max(
        1,
        Math.round(baseClicks / 30) + (wave > 5 ? seedOffset + 2 : seedOffset)
      );
      const dailyApps =
        i === 0
          ? baseApps
          : (29 - i + seedOffset) % 4 === 0
          ? Math.min(dailyClicks, Math.max(1, Math.round(baseApps / 2)))
          : (29 - i) % 7 === 0
          ? 1
          : 0;
      const dailyVerified =
        i === 0 ? successfulAppsCount : dailyApps > 0 && (29 - i) % 2 === 0 ? 1 : 0;

      points.push({
        day: label,
        clicks: dailyClicks,
        applications: dailyApps,
        verified: dailyVerified,
      });
    }
    return points;
  }, [activeRetailer, myApps.length, successfulAppsCount]);

  const handleSendOtp = () => {
    setRegError(null);
    const cleanPhone = regMobile.replace(/\D/g, '');
    if (regName.trim().length < 2) {
      setRegError('Please enter your full name.');
      return;
    }
    if (cleanPhone.length !== 10) {
      setRegError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const code = '482910';
    setGeneratedOtp(code);
    setOtpCode(code);
    setOtpSent(true);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!otpSent || otpCode.trim() !== generatedOtp) {
      setRegError('Invalid OTP verification code.');
      return;
    }
    setRegLoading(true);
    try {
      await onRegisterRetailer({
        name: regName.trim(),
        mobile: regMobile.replace(/\D/g, ''),
        city: regCity.trim() || 'India',
        upiId: regUpi.trim() || `${regMobile.replace(/\D/g, '')}@upi`,
      });
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  const getUniqueReferralUrl = (productId?: string) => {
    const code = activeRetailer?.retailerId || 'FE1001';
    const base = `https://${settings.domain}/ref/${code}`;
    return productId ? `${base}?product=${productId}` : base;
  };

  const handleCopyLink = async (key: string, textToCopy: string, productId?: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedKey(key);
      if (activeRetailer && productId) {
        await onSimulateShareClick(activeRetailer.retailerId, productId);
      }
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(key);
    }
  };

  const handleWhatsAppShare = async (product: Product) => {
    if (!activeRetailer) return;
    const link = getUniqueReferralUrl(product.productId);
    const message = `${customShareNote}\n*${product.title}* (${product.category})\n${product.description}\n\nApply here: ${link}\nReferred by Partner ID: ${activeRetailer.retailerId}`;
    await onSimulateShareClick(activeRetailer.retailerId, product.productId);

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: message,
          url: link,
        });
        return;
      } catch {
        // Fallback to WhatsApp web URL
      }
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawStatusMsg(null);
    if (!activeRetailer) return;

    const amt = Number(withdrawAmount);
    if (isNaN(amt) || amt < settings.minWithdrawalAmount) {
      setWithdrawError(
        `Minimum withdrawal amount is ₹${settings.minWithdrawalAmount.toLocaleString('en-IN')}.`
      );
      return;
    }
    if (amt > activeRetailer.walletBalance) {
      setWithdrawError(
        `Insufficient available wallet balance (₹${activeRetailer.walletBalance.toLocaleString('en-IN')}).`
      );
      return;
    }
    if (!withdrawMethod.trim()) {
      setWithdrawError('Please specify your UPI ID or Bank account details.');
      return;
    }

    try {
      await onRequestWithdrawal(amt, withdrawMethod.trim());
      setWithdrawAmount('');
      setWithdrawStatusMsg(
        `Withdrawal request for ₹${amt.toLocaleString('en-IN')} submitted for Admin approval.`
      );
    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : 'Unable to request withdrawal.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSavedMsg(null);
    await onUpdateProfile({
      name: editName.trim(),
      mobile: editMobile.replace(/\D/g, ''),
      city: editCity.trim(),
      upiId: editUpi.trim(),
    });
    setProfileSavedMsg('Retailer profile updated.');
    setTimeout(() => setProfileSavedMsg(null), 3000);
  };

  // If no retailer is selected or registered yet, show Registration + Demo Account Selector
  if (!activeRetailer) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3.5">
              <img
                src={ZERO_POISA_LOGO}
                alt="Zero Poisa App Logo"
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
              />
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {settings.platformName} — Retailer Registration & Login
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Register with your mobile number and OTP verification to receive your permanent Retailer ID (e.g. FE1004).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'register' ? 'recover' : 'register');
                  setRegError(null);
                  setRecoverStatusMsg(null);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>
                  {authMode === 'register' ? 'Password / ID Recovery' : 'Back to Registration'}
                </span>
              </button>
              {!currentUserUid && (
                <button
                  type="button"
                  onClick={onSignInGoogle}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google</span>
                </button>
              )}
            </div>
          </div>

          {regError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          {authMode === 'recover' ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Retailer Account & Password Recovery via Mobile OTP
                </h2>
                <p className="text-xs text-slate-500">
                  Enter your registered 10-digit mobile number to verify via OTP, recover your permanent Retailer ID (e.g., FE1001), and reset your access credentials.
                </p>
              </div>
              {recoverStatusMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl p-3.5 text-xs font-medium">
                  {recoverStatusMsg}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Registered Mobile Number *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      maxLength={10}
                      value={recoverMobile}
                      onChange={(e) =>
                        setRecoverMobile(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      placeholder="9830011001"
                      className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (recoverMobile.length !== 10) {
                          setRegError('Enter a valid 10-digit registered mobile number.');
                          return;
                        }
                        setRegError(null);
                        setRecoverOtpSent(true);
                        setRecoverOtpInput('739204');
                      }}
                      className="px-3.5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl whitespace-nowrap shrink-0"
                    >
                      Send Recovery OTP
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    New Login Password / 4-Digit PIN
                  </label>
                  <input
                    type="password"
                    value={recoverNewPin}
                    onChange={(e) => setRecoverNewPin(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              {recoverOtpSent && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={recoverOtpInput}
                    onChange={(e) => setRecoverOtpInput(e.target.value)}
                    className="px-3.5 py-2 text-sm font-mono bg-white border border-emerald-300 rounded-xl"
                    placeholder="6-Digit OTP"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const matched =
                        allRetailers.find((r) => r.mobile === recoverMobile) ||
                        allRetailers[0];
                      if (matched) {
                        setRecoverStatusMsg(
                          `Verified! Recovered Retailer ID: ${matched.retailerId} (${matched.name}). Opening your partner dashboard...`
                        );
                        setTimeout(() => onSelectDemoRetailer(matched.retailerId), 900);
                      }
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
                  >
                    Verify OTP, Reset Password & Open Dashboard
                  </button>
                </div>
              )}
            </div>
          ) : (
          <form onSubmit={handleCompleteRegistration} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Retailer Full Name *
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Rahul Sen"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                10-Digit Mobile Number *
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9830011223"
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0"
                >
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={regCity}
                onChange={(e) => setRegCity(e.target.value)}
                placeholder="Kolkata, West Bengal"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                Payout UPI ID
              </label>
              <input
                type="text"
                value={regUpi}
                onChange={(e) => setRegUpi(e.target.value)}
                placeholder="rahul@okaxis"
                className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl"
              />
            </div>

            {otpSent && (
              <div className="sm:col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-950">
                    Enter 6-Digit Verification OTP
                  </span>
                  <span className="font-mono text-emerald-700">
                    Verification OTP: {generatedOtp}
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-emerald-300 rounded-lg"
                />
              </div>
            )}

            <div className="sm:col-span-2 pt-2">
              <button
                type="submit"
                disabled={regLoading || !otpSent}
                className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3 transition-colors"
              >
                {regLoading
                  ? 'Generating Permanent Retailer ID...'
                  : `Verify OTP & Generate Retailer ID (FE${settings.nextRetailerSeq})`}
              </button>
            </div>
          </form>
          )}

          {/* Existing Retailer Switcher for instant inspection */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-semibold text-slate-700">
              Or Open an Active Retailer Account:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {allRetailers.map((r) => (
                <button
                  key={r.retailerId}
                  type="button"
                  onClick={() => onSelectDemoRetailer(r.retailerId)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-600 text-left transition-colors bg-slate-50 hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-700">
                      {r.retailerId}
                    </span>
                    <span className="text-[11px] text-slate-500">{r.status}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-1">{r.name}</div>
                  <div className="text-xs font-mono text-emerald-700 font-semibold mt-0.5">
                    Wallet: ₹{r.walletBalance.toLocaleString('en-IN')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const masterReferralUrl = getUniqueReferralUrl();
  const activeProducts = products.filter((p) => p.active);
  const filteredProducts =
    selectedCategoryFilter === 'All'
      ? activeProducts
      : activeProducts.filter(
          (p) =>
            p.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()) ||
            selectedCategoryFilter.toLowerCase().includes(p.category.toLowerCase())
        );

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      {/* Royal Blue "Sell and Earn" App Banner Header (Inspired by screenshot, tailored for earn.foodexpres.in) */}
      <div className="bg-gradient-to-r from-[#0e54b7] via-[#1363d1] to-[#0b48a0] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={ZERO_POISA_LOGO}
                  alt="Zero Poisa Official Logo"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-2xl object-cover border-2 border-white/30 shadow-sm shrink-0"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                      {settings.platformName} · Sell and Earn
                    </h1>
                    <span className="text-xs font-mono bg-white/15 text-white border border-white/25 px-2 py-0.5 rounded-md font-bold">
                      {activeRetailer.retailerId}
                    </span>
                    <span className="text-xs font-mono bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                      {activeRetailer.name}
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 font-mono mt-0.5">
                    {masterReferralUrl}
                  </p>
                </div>
              </div>

              {/* Mobile Action Icons matching the top-right play & help buttons in the screenshot */}
              <div className="flex sm:hidden items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowHowItWorksModal(!showHowItWorksModal)}
                  className="w-9 h-9 rounded-full bg-emerald-400/20 border border-white/40 flex items-center justify-center text-white"
                  title="How Referral Attribution Works"
                >
                  <PlayCircle className="w-5 h-5 text-emerald-300" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/40 flex items-center justify-center text-white"
                  title="Partner Help & FAQ"
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Desktop Controls & Quick Copy / Account Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleCopyLink('header_link', masterReferralUrl)}
                className="min-h-[40px] px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                {copiedKey === 'header_link' ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied Referral Link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link ({activeRetailer.retailerId})</span>
                  </>
                )}
              </button>

              <select
                value={activeRetailer.retailerId}
                onChange={(e) => onSelectDemoRetailer(e.target.value)}
                className="bg-white/15 hover:bg-white/20 border border-white/25 text-white text-xs font-mono rounded-xl px-3 py-2 focus:outline-none"
                title="Switch active retailer account"
              >
                {allRetailers.map((r) => (
                  <option key={r.retailerId} value={r.retailerId} className="text-slate-900">
                    {r.retailerId} — {r.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => onSelectDemoRetailer('')}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-xl whitespace-nowrap shrink-0"
              >
                + New Retailer
              </button>

              <button
                type="button"
                onClick={() => setShowHowItWorksModal(!showHowItWorksModal)}
                className="hidden sm:flex w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 items-center justify-center text-white"
                title="How Referral Attribution Works"
              >
                <PlayCircle className="w-5 h-5 text-emerald-300" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('guide')}
                className="hidden sm:flex w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 border border-white/30 items-center justify-center text-white"
                title="Partner Guide"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Compact Wallet & Stats Ribbon inside the Royal Blue Header */}
          <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white/10 rounded-xl px-3.5 py-2.5 backdrop-blur-xs flex items-center justify-between">
              <div>
                <div className="text-blue-100 text-[11px]">Wallet Balance</div>
                <div className="text-base sm:text-lg font-bold font-mono text-emerald-300">
                  ₹{activeRetailer.walletBalance.toLocaleString('en-IN')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className="px-2.5 py-1 bg-white text-blue-900 font-bold text-[11px] rounded-lg hover:bg-blue-50"
              >
                Withdraw
              </button>
            </div>

            <div className="bg-white/10 rounded-xl px-3.5 py-2.5 backdrop-blur-xs">
              <div className="text-blue-100 text-[11px]">Verified Earnings</div>
              <div className="text-base sm:text-lg font-bold font-mono text-white">
                ₹{activeRetailer.totalVerifiedEarnings.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white/10 rounded-xl px-3.5 py-2.5 backdrop-blur-xs">
              <div className="text-blue-100 text-[11px]">Clicks / Referrals</div>
              <div className="text-base sm:text-lg font-bold font-mono text-white">
                {activeRetailer.totalClicks} / {myLeads.length}
              </div>
            </div>

            <div className="bg-white/10 rounded-xl px-3.5 py-2.5 backdrop-blur-xs">
              <div className="text-blue-100 text-[11px]">Applications</div>
              <div className="text-base sm:text-lg font-bold font-mono text-emerald-300">
                {successfulAppsCount} Won{' '}
                <span className="text-xs font-normal text-blue-100">
                  · {pendingAppsCount} Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible How It Works Quick Drawer */}
      {showHowItWorksModal && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono text-emerald-400">
                EARN.FOODEXPRES.IN PARTNER WORKFLOW
              </div>
              <div className="text-sm font-bold">
                1. Share Your Unique Link (/ref/{activeRetailer.retailerId}) → 2. Customer Consents & Applies on GroMo → 3. Admin Verifies & Credits 80% Commission
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHowItWorksModal(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg shrink-0"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Desktop Navigation Bar */}
        <div className="hidden sm:flex items-center justify-between bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1">
            {[
              { id: 'sell', label: 'Sell & Earn Storefront' },
              { id: 'leads', label: `My Leads & Applications (${myApps.length})` },
              {
                id: 'wallet',
                label: `FE Wallet & Withdrawals (₹${activeRetailer.walletBalance.toLocaleString('en-IN')})`,
              },
              { id: 'guide', label: 'Learn & Partner FAQ' },
              { id: 'profile', label: `Profile & Alerts (${myNotifications.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? 'bg-[#1363d1] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenReferralPreview(
                activeRetailer.retailerId,
                activeProducts[0]?.productId || 'PROD_SAV_KOTAK'
              )
            }
            className="px-3.5 py-2 text-xs font-semibold text-[#1363d1] hover:bg-blue-50 rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <span>Preview Customer Landing Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* TAB 1: SELL & EARN STOREFRONT (Matching Screenshot Structure with Distinct Polish) */}
        {activeTab === 'sell' && (
          <div className="space-y-8">
            {/* Section 1: Top Featured Partner Spotlight Cards (Horizontal Carousel on Mobile, 4-Column Grid on Desktop) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">
                  Top Selling Offers
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  Instant WhatsApp Share · ID: {activeRetailer.retailerId}
                </span>
              </div>

              <div className="flex overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 snap-x">
                {activeProducts.slice(0, 4).map((product, idx) => {
                  const split = calculateCommissionSplit(
                    product.estimatedCommission,
                    settings,
                    product,
                    activeRetailer
                  );
                  const rewardPts = Math.round(split.retailerCommission * 0.85);

                  // Distinct visual brand monograms inspired by Kotak 811, Jiraaf, etc.
                  const brandStyles = [
                    {
                      brandName: 'kotak',
                      accentSub: '811',
                      bgText: 'text-red-600',
                      subBg: 'bg-slate-900 text-white',
                    },
                    {
                      brandName: 'JIRAAF',
                      accentSub: 'BONDS',
                      bgText: 'text-[#0b3b75]',
                      subBg: 'bg-amber-500 text-slate-950',
                    },
                    {
                      brandName: 'AURUM',
                      accentSub: 'VISA',
                      bgText: 'text-blue-800',
                      subBg: 'bg-blue-600 text-white',
                    },
                    {
                      brandName: 'FINEXPRESS',
                      accentSub: 'CREDIT',
                      bgText: 'text-emerald-800',
                      subBg: 'bg-emerald-600 text-white',
                    },
                  ][idx % 4];

                  return (
                    <div
                      key={product.productId}
                      className="min-w-[235px] sm:min-w-0 snap-start bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col items-center text-center justify-between"
                    >
                      {/* Top Category Header Chip */}
                      <div className="w-full flex flex-col items-center">
                        <span className="px-4 py-1 rounded-full border border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/70">
                          {product.category}
                        </span>

                        {/* Stylized Brand Identity Centerpiece */}
                        <div className="my-5 h-16 flex flex-col items-center justify-center">
                          <div
                            className={`text-xl font-extrabold tracking-tight font-display ${brandStyles.bgText}`}
                          >
                            {brandStyles.brandName}
                          </div>
                          <div
                            className={`mt-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold ${brandStyles.subBg}`}
                          >
                            {brandStyles.accentSub}
                          </div>
                        </div>

                        {/* Green Earning Highlight + Gold FE Points */}
                        <div className="space-y-1">
                          <div className="text-lg font-extrabold text-emerald-600 font-mono">
                            upto ₹{split.retailerCommission.toLocaleString('en-IN')}
                          </div>
                          <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-amber-600">
                            <span className="text-slate-600">+</span>
                            <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-extrabold shadow-2xs">
                              FE
                            </span>
                            <span>{rewardPts} pts</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Share Actions at bottom of spotlight card */}
                      <div className="w-full mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(product)}
                          className="flex-1 min-h-[40px] bg-[#1363d1] hover:bg-[#0e54b7] text-white text-xs font-bold rounded-xl py-2 px-3 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share Link</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onOpenReferralPreview(
                              activeRetailer.retailerId,
                              product.productId
                            )
                          }
                          className="min-h-[40px] px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                          title="Open Customer Referral Landing Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 2: "Products" 4-Column Circular Icon Grid (Direct visual match to screenshot with interactive filtering) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Products</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tap any product category below to filter and share your unique referral link
                  </p>
                </div>
                {selectedCategoryFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryFilter('All')}
                    className="px-3 py-1.5 bg-blue-50 text-[#1363d1] text-xs font-bold rounded-xl"
                  >
                    Show All Categories ({activeProducts.length})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-5 gap-y-7 gap-x-3 sm:gap-6">
                {CATEGORY_GRID_META.map((cat) => {
                  const IconComp = cat.icon;
                  const isSelected = selectedCategoryFilter === cat.matchCategory;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategoryFilter(
                          isSelected ? 'All' : cat.matchCategory
                        )
                      }
                      className="group flex flex-col items-center text-center focus:outline-none"
                    >
                      <div
                        className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100'
                            : `${cat.circleBg} ${cat.iconColor}`
                        }`}
                      >
                        <IconComp className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2]" />
                      </div>
                      <span
                        className={`mt-2.5 text-xs sm:text-sm font-bold leading-tight ${
                          isSelected ? 'text-[#1363d1]' : 'text-slate-800'
                        }`}
                      >
                        {cat.label}
                      </span>
                      <span className="mt-0.5 text-xs sm:text-sm font-mono font-bold text-emerald-600">
                        {cat.earningBadge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Detailed Shareable Product Cards with Custom WhatsApp Message */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedCategoryFilter === 'All'
                      ? 'All Shareable Affiliate Links'
                      : `${selectedCategoryFilter} Referral Links`}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Every link records your Retailer ID ({activeRetailer.retailerId}) and customer consent before redirecting to GroMo.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customShareNote}
                    onChange={(e) => setCustomShareNote(e.target.value)}
                    placeholder="Custom WhatsApp greeting..."
                    className="w-full sm:w-72 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((product) => {
                  const split = calculateCommissionSplit(
                    product.estimatedCommission,
                    settings,
                    product,
                    activeRetailer
                  );
                  const productReferralLink = getUniqueReferralUrl(product.productId);

                  return (
                    <div
                      key={product.productId}
                      className="rounded-3xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow"
                    >
                      <div>
                        <ResilientImage
                          src={product.imageUrl}
                          alt={product.title}
                          fallbackTitle={product.title}
                          className="w-full h-40 object-cover"
                        />
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#1363d1]">
                              {product.category}
                            </span>
                            <span className="font-mono font-bold text-emerald-600">
                              Earn ₹{split.retailerCommission.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {product.title}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                            {product.description}
                          </p>
                          <div className="pt-1 font-mono text-[11px] text-slate-500 truncate">
                            {productReferralLink}
                          </div>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-2">
                        <button
                          type="button"
                          onClick={() => handleWhatsAppShare(product)}
                          className="w-full min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          <span>Share on WhatsApp</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyLink(
                                `prod_${product.productId}`,
                                productReferralLink,
                                product.productId
                              )
                            }
                            className="min-h-[40px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-1.5"
                          >
                            {copiedKey === `prod_${product.productId}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onOpenReferralPreview(
                                activeRetailer.retailerId,
                                product.productId
                              )
                            }
                            className="min-h-[40px] bg-blue-50 hover:bg-blue-100 text-[#1363d1] text-xs font-semibold rounded-xl px-2.5 py-1.5 flex items-center justify-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open Page</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: 30-Day Clicks vs. Applications Performance Chart */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#1363d1]" />
                    <span>
                      Clicks vs. Applications — Last 30 Days ({activeRetailer.retailerId})
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    30-day referral link traffic vs. customer applications for {activeRetailer.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('leads')}
                  className="text-xs font-semibold text-[#1363d1] hover:underline self-start sm:self-auto"
                >
                  View Detailed Leads Ledger →
                </button>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={last30DaysChartData}
                    margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="sellColorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1363d1" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1363d1" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="sellColorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Referral Link Clicks"
                      stroke="#1363d1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#sellColorClicks)"
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      name="Customer Applications"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#sellColorApps)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEADS & APPLICATION STATUS */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Successful Verified Applications</div>
                <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                  {successfulAppsCount}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Pending / In-Progress Leads</div>
                <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
                  {pendingAppsCount}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="text-xs text-slate-500">Rejected / Cancelled</div>
                <div className="text-2xl font-bold font-mono text-red-600 mt-1">
                  {rejectedAppsCount}
                </div>
              </div>
            </div>

            {/* Recharts 30-Day Clicks vs. Applications Analytics Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#1363d1]" />
                    <span>
                      Clicks vs. Applications — Last 30 Days ({activeRetailer.retailerId})
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Daily referral link clicks compared against submitted and verified GroMo applications for {activeRetailer.name}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-[#1363d1] font-bold">
                    Total Clicks: {activeRetailer.totalClicks}
                  </span>
                  <span className="text-emerald-600 font-bold">
                    Applications: {myApps.length}
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={last30DaysChartData}
                    margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1363d1" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#1363d1" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name="Referral Link Clicks"
                      stroke="#1363d1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorClicks)"
                    />
                    <Area
                      type="monotone"
                      dataKey="applications"
                      name="Customer Applications"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorApps)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  My Customer Applications & GroMo Verification Status ({myApps.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Exclusively showing customers referred via {masterReferralUrl}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Application ID</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Your Verified Share</th>
                      <th className="py-3 px-4">Verification Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {myApps.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No customer applications recorded yet for {activeRetailer.retailerId}.
                        </td>
                      </tr>
                    ) : (
                      myApps.map((app) => (
                        <tr key={app.applicationId} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                            {app.applicationId}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{app.customerName}</div>
                            <div className="font-mono text-slate-500">+91 {app.customerMobile}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{app.productTitle}</td>
                          <td className="py-3.5 px-4 font-semibold">
                            <span
                              className={
                                app.status === 'Successful'
                                  ? 'text-emerald-700'
                                  : app.status === 'Rejected' || app.status === 'Cancelled'
                                  ? 'text-red-600'
                                  : 'text-amber-700'
                              }
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                            {app.status === 'Successful'
                              ? `₹${app.retailerCommission.toLocaleString('en-IN')}`
                              : `Est. ₹${app.retailerCommission.toLocaleString('en-IN')}`}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {app.verificationDate}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-base font-bold text-slate-900">
                  Customer Referral & Mobile OTP Verification Log ({myLeads.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Referral Ref</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">OTP Status</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Verification Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {myLeads.map((lead) => {
                      const otpState = lead.otpStatus || 'Verified';
                      return (
                        <tr key={lead.referralRef} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                            {lead.referralRef}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {lead.customerName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            +91 {lead.customerMobile}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span
                              className={
                                otpState === 'Verified'
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }
                            >
                              {otpState}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{lead.productTitle}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">
                            {(lead.otpVerifiedAt || lead.consentTimestamp)
                              .slice(0, 19)
                              .replace('T', ' ')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RETAILER WALLET & WITHDRAWALS */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  FE Partner Wallet & Payouts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Minimum withdrawal threshold: ₹{settings.minWithdrawalAmount.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-[#0e54b7] to-[#09357a] text-white rounded-2xl p-5 space-y-2">
                <div className="text-xs text-blue-100">Available Wallet Balance</div>
                <div className="text-3xl font-bold font-mono text-emerald-300">
                  ₹{activeRetailer.walletBalance.toLocaleString('en-IN')}
                </div>
                <div className="flex items-center justify-between text-xs text-blue-100 pt-2 border-t border-white/15 font-mono">
                  <span>Pending: ₹{activeRetailer.pendingEarnings.toLocaleString('en-IN')}</span>
                  <span>Withdrawn: ₹{activeRetailer.totalWithdrawn.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {withdrawError && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs">
                  {withdrawError}
                </div>
              )}
              {withdrawStatusMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs">
                  {withdrawStatusMsg}
                </div>
              )}

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Withdrawal Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={settings.minWithdrawalAmount}
                    max={activeRetailer.walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`${settings.minWithdrawalAmount}`}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Payout UPI ID / Bank Account *
                  </label>
                  <input
                    type="text"
                    required
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    placeholder="UPI: sanjit.fe1001@okaxis"
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full min-h-[48px] bg-[#1363d1] hover:bg-[#0e54b7] text-white font-semibold text-sm rounded-xl py-3 flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Submit Withdrawal Request</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900">
                    Wallet Transaction Ledger ({myTxns.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {myTxns.map((txn) => (
                        <tr key={txn.txnRef}>
                          <td className="py-3 px-4 font-mono text-slate-900">{txn.txnRef}</td>
                          <td className="py-3 px-4 uppercase font-semibold text-[11px]">
                            <span
                              className={
                                txn.type === 'credit' ? 'text-emerald-700' : 'text-amber-700'
                              }
                            >
                              {txn.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{txn.reason}</td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-bold ${
                              txn.type === 'credit' ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {txn.type === 'credit' ? '+' : '-'}₹
                            {txn.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            ₹{txn.balanceAfter.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900">
                    Withdrawal History ({myWithdrawals.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                        <th className="py-3 px-4">Request ID</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">UTR / Payment Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {myWithdrawals.map((w) => (
                        <tr key={w.withdrawalId}>
                          <td className="py-3 px-4 font-mono text-slate-900">{w.withdrawalId}</td>
                          <td className="py-3 px-4 font-mono text-slate-600">{w.paymentMethod}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{w.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 font-semibold">
                            <span
                              className={
                                w.status === 'Completed'
                                  ? 'text-emerald-700'
                                  : w.status === 'Rejected'
                                  ? 'text-red-600'
                                  : 'text-amber-700'
                              }
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-500">
                            {w.paymentRef || w.adminReason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: LEARN & PARTNER TRAINING GUIDE */}
        {activeTab === 'guide' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Partner Training & Commission Rules
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Everything you need to maximize your verified GroMo affiliate earnings on {settings.domain}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-mono font-bold text-[#1363d1]">
                  RULE 01 · ATTRIBUTION BEFORE REDIRECT
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Always Share Your /ref/{activeRetailer.retailerId} Link
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Never share raw GroMo URLs directly. When customers open your unique{' '}
                  <span className="font-mono text-slate-900">
                    {masterReferralUrl}
                  </span>{' '}
                  page and accept consent, our database records your Retailer ID before forwarding them to GroMo.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-mono font-bold text-emerald-700">
                  RULE 02 · TRANSPARENT 80/20 SPLIT
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  How Your Commission Is Calculated
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  When GroMo verifies a successful application (e.g., ₹1,000 payout for a Personal Loan), Admin logs the verified amount in the Daily GroMo Report and credits {settings.retailerSharePercent}% (₹800) directly to your FE Wallet.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-mono font-bold text-amber-700">
                  RULE 03 · FAST UPI WITHDRAWALS
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Withdraw Once Balance Reaches ₹{settings.minWithdrawalAmount}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Keep your UPI ID updated in your Profile tab. Submit a withdrawal request anytime your verified wallet balance is ₹{settings.minWithdrawalAmount} or higher.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: PROFILE & NOTIFICATIONS */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xs">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-[#1363d1] text-white font-bold flex items-center justify-center text-base">
                  {activeRetailer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {activeRetailer.name}
                  </h2>
                  <p className="text-xs font-mono text-slate-500">
                    Permanent Partner ID: {activeRetailer.retailerId}
                  </p>
                </div>
              </div>

              {profileSavedMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs">
                  {profileSavedMsg}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Default UPI ID for Withdrawals
                  </label>
                  <input
                    type="text"
                    value={editUpi}
                    onChange={(e) => setEditUpi(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[48px] bg-[#1363d1] hover:bg-[#0e54b7] text-white text-sm font-semibold rounded-xl py-3"
                >
                  Save Retailer Profile
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 space-y-6">
              {/* Automated Email Notifications Inbox for Active Retailer */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-[#1363d1]" />
                    <span>My Email Notifications ({myEmails.length})</span>
                  </h2>
                  <span className="text-xs font-mono text-slate-500">
                    {activeRetailer.email}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Templated emails automatically sent to you whenever a GroMo commission is credited to your wallet or your withdrawal request changes status.
                </p>

                {myEmails.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No email notifications sent to {activeRetailer.email} yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {myEmails.map((em) => {
                      const isOpen = expandedRetailerEmailId === em.emailId;
                      return (
                        <div key={em.emailId} className="py-3.5 space-y-2">
                          <div
                            onClick={() =>
                              setExpandedRetailerEmailId(isOpen ? null : em.emailId)
                            }
                            className="cursor-pointer space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  em.templateId === 'COMMISSION_CREDITED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-50 text-[#1363d1] border border-blue-200'
                                }`}
                              >
                                {em.templateId === 'COMMISSION_CREDITED'
                                  ? 'Commission Credited'
                                  : 'Withdrawal Status Update'}
                              </span>
                              <span className="font-mono text-slate-500">
                                {em.sentAt.slice(0, 16).replace('T', ' ')}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-slate-900 flex items-center justify-between gap-2">
                              <span>{em.subject}</span>
                              <span className="text-xs font-semibold text-[#1363d1] underline shrink-0">
                                {isOpen ? 'Close' : 'Open Email'}
                              </span>
                            </div>
                          </div>

                          {isOpen && (
                            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs font-mono space-y-2">
                              <div className="text-[11px] text-slate-400 border-b border-slate-800 pb-2 space-y-0.5">
                                <div>From: {em.fromEmail}</div>
                                <div>To: {em.toEmail}</div>
                              </div>
                              <pre className="whitespace-pre-wrap text-slate-200 text-xs font-mono leading-relaxed">
                                {em.body}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#1363d1]" />
                  <span>In-App Verification & Payout Alerts</span>
                </h2>
                <div className="divide-y divide-slate-100">
                  {myNotifications.map((n) => (
                    <div key={n.notificationId} className="py-3.5 space-y-1">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-emerald-700">{n.category}</span>
                        <span className="font-mono">{n.createdAt.slice(0, 10)}</span>
                      </div>
                      <div className="text-sm font-bold text-slate-900">{n.title}</div>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Fixed 5-Tab Bottom Dock with Active Top Indicator & Avatar Badge (Inspired by Screenshot) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
        <div className="grid grid-cols-5 items-center h-16">
          {[
            { id: 'wallet', label: 'FE Hub', icon: Wallet },
            { id: 'leads', label: 'Leads', icon: Users },
            { id: 'sell', label: 'Sell', icon: LayoutGrid },
            { id: 'guide', label: 'Learn', icon: Sparkles },
          ].map((item) => {
            const IconComp = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`relative h-full flex flex-col items-center justify-center transition-colors ${
                  active ? 'text-[#1363d1] font-bold' : 'text-slate-500'
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-4 right-4 h-1 bg-[#1363d1] rounded-b-full" />
                )}
                <IconComp className="w-5 h-5" />
                <span className="text-[11px] tracking-tight mt-1">{item.label}</span>
              </button>
            );
          })}

          {/* 5th Slot: Circular Avatar Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="relative h-full flex flex-col items-center justify-center"
          >
            {activeTab === 'profile' && (
              <span className="absolute top-0 left-4 right-4 h-1 bg-[#1363d1] rounded-b-full" />
            )}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                activeTab === 'profile'
                  ? 'bg-[#1363d1] text-white border-blue-200'
                  : 'bg-blue-100 text-[#1363d1] border-transparent'
              }`}
            >
              {activeRetailer.name.slice(0, 2).toUpperCase()}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
