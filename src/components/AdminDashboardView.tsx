import React, { useState } from 'react';
import {
  PlatformSettings,
  Product,
  RetailerProfile,
  ReferralLead,
  ApplicationRecord,
  ApplicationStatus,
  WalletTransaction,
  WithdrawalRequest,
  NotificationItem,
  AuditLog,
  EmailTemplate,
  EmailLogItem,
  EmailTemplateId,
} from '../types';
import { ResilientImage } from './ResilientImage';
import {
  calculateCommissionSplit,
  ZERO_POISA_LOGO,
  IMG_PERSONAL_LOAN,
  IMG_CREDIT_CARD,
  IMG_SAVINGS_ACCOUNT,
  IMG_DEMAT_ACCOUNT,
} from '../lib/seedData';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileCheck2,
  Package,
  Link2,
  Percent,
  Wallet,
  ArrowDownToLine,
  ClipboardCheck,
  Bell,
  BarChart3,
  Settings,
  UserCheck,
  ShieldAlert,
  Search,
  Download,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Database,
  Smartphone,
  Terminal,
  Mail,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export type AdminModuleId =
  | 'dashboard'
  | 'retailers'
  | 'referrals'
  | 'applications'
  | 'products'
  | 'affiliate_links'
  | 'commissions'
  | 'wallets'
  | 'withdrawals'
  | 'gromo_daily'
  | 'notifications'
  | 'reports'
  | 'settings'
  | 'profile'
  | 'audit_logs';

interface AdminDashboardViewProps {
  settings: PlatformSettings;
  products: Product[];
  retailers: RetailerProfile[];
  referralLeads: ReferralLead[];
  applications: ApplicationRecord[];
  walletTransactions: WalletTransaction[];
  withdrawals: WithdrawalRequest[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  emailTemplates: EmailTemplate[];
  emailLogs: EmailLogItem[];
  currentUserEmail: string | null;
  isAuthorizedAdmin: boolean;
  onSignInGoogle: () => Promise<void>;
  onUpdateSettings: (newSettings: PlatformSettings, actionNote: string) => Promise<void>;
  onToggleRetailerStatus: (retailerId: string) => Promise<void>;
  onUpdateRetailerCustomCommission: (retailerId: string, customPercent: number) => Promise<void>;
  onSaveProduct: (product: Product, isNew: boolean) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onVerifyOrSaveApplication: (
    appRecord: ApplicationRecord,
    creditWalletNow: boolean
  ) => Promise<void>;
  onAssignUnmatchedApplication: (
    applicationId: string,
    targetRetailerId: string,
    creditWalletNow: boolean
  ) => Promise<void>;
  onManualWalletAdjustment: (
    retailerId: string,
    type: 'credit' | 'debit',
    amount: number,
    reason: string
  ) => Promise<void>;
  onProcessWithdrawal: (
    withdrawalId: string,
    newStatus: 'Approved' | 'Completed' | 'Rejected',
    paymentRef: string,
    adminReason: string
  ) => Promise<void>;
  onSendNotification: (
    title: string,
    message: string,
    category: string,
    targetRole: 'all' | 'retailer' | 'admin',
    targetUid: string
  ) => Promise<void>;
  onUpdateEmailTemplate: (
    templateId: EmailTemplateId,
    subjectTemplate: string,
    bodyTemplate: string
  ) => Promise<void>;
}

const ADMIN_NAV_ITEMS: { id: AdminModuleId; num: string; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', num: '01', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'retailers', num: '02', label: 'Retailer Management', icon: Users },
  { id: 'referrals', num: '03', label: 'Customer Referrals', icon: UserPlus },
  { id: 'applications', num: '04', label: 'Application Tracking', icon: FileCheck2 },
  { id: 'products', num: '05', label: 'Product Management', icon: Package },
  { id: 'affiliate_links', num: '06', label: 'Affiliate Link Management', icon: Link2 },
  { id: 'commissions', num: '07', label: 'Commission Settings', icon: Percent },
  { id: 'wallets', num: '08', label: 'Wallet Management', icon: Wallet },
  { id: 'withdrawals', num: '09', label: 'Withdrawal Management', icon: ArrowDownToLine },
  { id: 'gromo_daily', num: '10', label: 'GroMo Daily Reports', icon: ClipboardCheck },
  { id: 'notifications', num: '11', label: 'Notifications & Email', icon: Bell },
  { id: 'reports', num: '12', label: 'Reports and Analytics', icon: BarChart3 },
  { id: 'settings', num: '13', label: 'Website/App Settings', icon: Settings },
  { id: 'profile', num: '14', label: 'Admin Profile', icon: UserCheck },
  { id: 'audit_logs', num: '15', label: 'Audit Logs', icon: ShieldAlert },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  settings,
  products,
  retailers,
  referralLeads,
  applications,
  walletTransactions,
  withdrawals,
  notifications,
  auditLogs,
  emailTemplates,
  emailLogs,
  currentUserEmail,
  isAuthorizedAdmin,
  onSignInGoogle,
  onUpdateSettings,
  onToggleRetailerStatus,
  onUpdateRetailerCustomCommission,
  onSaveProduct,
  onDeleteProduct,
  onVerifyOrSaveApplication,
  onAssignUnmatchedApplication,
  onManualWalletAdjustment,
  onProcessWithdrawal,
  onSendNotification,
  onUpdateEmailTemplate,
}) => {
  const [activeModule, setActiveModule] = useState<AdminModuleId>('dashboard');
  const [bannerFeedback, setBannerFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setBannerFeedback(msg);
    setTimeout(() => setBannerFeedback(null), 4000);
  };

  // Module 2: Retailer filters
  const [retailerSearch, setRetailerSearch] = useState('');

  // Module 3: Referral filters (Search by Mobile Number, Retailer ID, and OTP Status)
  const [referralSearch, setReferralSearch] = useState('');
  const [referralMobileFilter, setReferralMobileFilter] = useState('');
  const [referralRetailerFilter, setReferralRetailerFilter] = useState('All');
  const [referralOtpFilter, setReferralOtpFilter] = useState<'All' | 'Verified' | 'Not Verified'>(
    'All'
  );

  // Module 4: Application Tracking filters & form
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('All');
  const [appProductFilter, setAppProductFilter] = useState<string>('All');
  const [appDateFilter, setAppDateFilter] = useState<string>('');

  // Module 5: Product Form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodTitle, setProdTitle] = useState('');
  const [prodCategory, setProdCategory] = useState('Personal Loan');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState(IMG_PERSONAL_LOAN);
  const [prodBannerTag, setProdBannerTag] = useState('Fast Approval · Digital KYC');
  const [prodBtnText, setProdBtnText] = useState('Apply Now');
  const [prodGromoUrl, setProdGromoUrl] = useState(settings.commonGromoUrl);
  const [prodUseCommon, setProdUseCommon] = useState(true);
  const [prodSubIdParam, setProdSubIdParam] = useState('');
  const [prodEstComm, setProdEstComm] = useState('1000');
  const [prodCommType, setProdCommType] = useState<'default' | 'percentage' | 'fixed'>('default');
  const [prodCommVal, setProdCommVal] = useState('80');

  // Module 6: Common GroMo link form
  const [commonUrlInput, setCommonUrlInput] = useState(settings.commonGromoUrl);
  const [commonLinkActive, setCommonLinkActive] = useState(settings.gromoLinkActive);

  // Module 7: Commission Settings form
  const [commType, setCommType] = useState<'percentage' | 'fixed'>(settings.commissionType);
  const [retSharePct, setRetSharePct] = useState(String(settings.retailerSharePercent));
  const [fixedRetAmt, setFixedRetAmt] = useState(String(settings.fixedRetailerAmount));
  const [minWithdrawAmt, setMinWithdrawAmt] = useState(String(settings.minWithdrawalAmount));
  const [roundingRule, setRoundingRule] = useState<'nearest' | 'floor' | 'ceil'>(
    settings.roundingRule
  );
  const [effectiveDate, setEffectiveDate] = useState(settings.effectiveDate);
  const [previewSampleGromoAmt, setPreviewSampleGromoAmt] = useState('1000');

  // Module 8: Manual Wallet Adjustment form
  const [walletTargetRetailer, setWalletTargetRetailer] = useState(
    retailers[0]?.retailerId || 'FE1001'
  );
  const [walletAdjType, setWalletAdjType] = useState<'credit' | 'debit'>('credit');
  const [walletAdjAmount, setWalletAdjAmount] = useState('');
  const [walletAdjReason, setWalletAdjReason] = useState('');

  // Module 9: Withdrawal processing state
  const [wdrRefInput, setWdrRefInput] = useState<Record<string, string>>({});
  const [wdrReasonInput, setWdrReasonInput] = useState<Record<string, string>>({});

  // Module 10: Daily GroMo Verification Report form
  const [gromoDate, setGromoDate] = useState('2026-11-23');
  const [gromoMatchMode, setGromoMatchMode] = useState<'referral' | 'retailer' | 'unmatched'>(
    'referral'
  );
  const [selectedLeadRef, setSelectedLeadRef] = useState(
    referralLeads[0]?.referralRef || ''
  );
  const [gromoCustomerName, setGromoCustomerName] = useState('Rani Barman');
  const [gromoCustomerMobile, setGromoCustomerMobile] = useState('9832109876');
  const [gromoProductId, setGromoProductId] = useState(
    products[0]?.productId || 'PROD_LOAN_01'
  );
  const [gromoRetailerId, setGromoRetailerId] = useState('FE1001');
  const [gromoStatus, setGromoStatus] = useState<ApplicationStatus>('Successful');
  const [gromoVerifiedAmt, setGromoVerifiedAmt] = useState('1000');
  const [gromoTxnRef, setGromoTxnRef] = useState('GRM-20261123-9204');
  const [gromoNotes, setGromoNotes] = useState(
    'Verified from Daily GroMo Partner Dashboard report.'
  );
  const [unmatchedAssignTarget, setUnmatchedAssignTarget] = useState<Record<string, string>>({});

  // Module 11: Notification composer & Email Template Manager
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifCat, setNotifCat] = useState('Announcement');
  const [notifTargetRole, setNotifTargetRole] = useState<'all' | 'retailer' | 'admin'>('all');
  const [activeEmailTemplateId, setActiveEmailTemplateId] =
    useState<EmailTemplateId>('COMMISSION_CREDITED');
  const [emailSubjectDrafts, setEmailSubjectDrafts] = useState<Record<string, string>>({});
  const [emailBodyDrafts, setEmailBodyDrafts] = useState<Record<string, string>>({});
  const [expandedEmailLogId, setExpandedEmailLogId] = useState<string | null>(null);
  const [emailLogRetailerFilter, setEmailLogRetailerFilter] = useState<string>('All');

  // Module 13: Platform Settings
  const [platformNameInput, setPlatformNameInput] = useState(settings.platformName);
  const [domainInput, setDomainInput] = useState(settings.domain);
  const [ownerNameInput, setOwnerNameInput] = useState(settings.ownerName);

  // Executive Dashboard Metrics (All 13 Required Statistics)
  const totalRetailers = retailers.length;
  const activeRetailers = retailers.filter((r) => r.status === 'active').length;
  const totalCustomersReferred = referralLeads.length;
  const totalLinkClicks = retailers.reduce((acc, r) => acc + r.totalClicks, 0);
  const totalApplications = applications.length;
  const pendingApplications = applications.filter(
    (a) => a.status === 'Pending' || a.status === 'Applied' || a.status === 'Lead Generated'
  ).length;
  const successfulApplications = applications.filter((a) => a.status === 'Successful').length;
  const rejectedApplications = applications.filter(
    (a) => a.status === 'Rejected' || a.status === 'Cancelled'
  ).length;

  const verifiedSuccessfulApps = applications.filter((a) => a.status === 'Successful');
  const totalVerifiedGromoCommission = verifiedSuccessfulApps.reduce(
    (acc, a) => acc + a.gromoCommission,
    0
  );
  const retailerPayableCommission = verifiedSuccessfulApps.reduce(
    (acc, a) => acc + a.retailerCommission,
    0
  );
  const adminCommissionTotal = verifiedSuccessfulApps.reduce(
    (acc, a) => acc + a.adminCommission,
    0
  );
  const totalWalletBalance = retailers.reduce((acc, r) => acc + r.walletBalance, 0);
  const pendingWithdrawalsAmount = withdrawals
    .filter((w) => w.status === 'Pending' || w.status === 'Approved')
    .reduce((acc, w) => acc + w.amount, 0);

  // CSV Export Helper
  const handleExportCsv = (filename: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      ),
    ];
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename} (${rows.length} records).`);
  };

  // Load selected referral lead into GroMo verification form
  const handleSelectLeadForGromo = (refId: string) => {
    setSelectedLeadRef(refId);
    const found = referralLeads.find((l) => l.referralRef === refId);
    if (found) {
      setGromoCustomerName(found.customerName);
      setGromoCustomerMobile(found.customerMobile);
      setGromoProductId(found.productId);
      setGromoRetailerId(found.retailerId);
    }
  };

  // Submit Daily GroMo Verification entry
  const handleGromoVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const commNum = Number(gromoVerifiedAmt);
    if (isNaN(commNum) || commNum < 0) {
      showToast('Please enter a valid GroMo commission amount.');
      return;
    }

    // Duplicate GroMo Transaction Ref warning check
    if (
      gromoTxnRef.trim() &&
      applications.some(
        (a) => a.gromoTxnRef.toLowerCase() === gromoTxnRef.trim().toLowerCase()
      )
    ) {
      showToast(
        `Duplicate Prevention Warning: GroMo Transaction Ref ${gromoTxnRef} already exists!`
      );
      return;
    }

    const selectedProd =
      products.find((p) => p.productId === gromoProductId) || products[0];
    const isUnmatched = gromoMatchMode === 'unmatched';
    const selectedRet = isUnmatched
      ? null
      : retailers.find((r) => r.retailerId === gromoRetailerId) || retailers[0];

    const split = calculateCommissionSplit(
      commNum,
      settings,
      selectedProd,
      selectedRet
    );

    const nowIso = new Date().toISOString();
    const dateCompact = gromoDate.replace(/-/g, '');
    const appId = `APP-${dateCompact}-${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: ApplicationRecord = {
      applicationId: appId,
      referralRef:
        gromoMatchMode === 'referral' && selectedLeadRef
          ? selectedLeadRef
          : isUnmatched
          ? 'UNMATCHED'
          : 'DIRECT_SUB_ID',
      customerName: isUnmatched
        ? gromoCustomerName.trim() || 'Unidentified GroMo Entry'
        : gromoCustomerName.trim(),
      customerMobile: isUnmatched
        ? 'N/A'
        : gromoCustomerMobile.replace(/\D/g, ''),
      productId: selectedProd.productId,
      productTitle: selectedProd.title,
      retailerId: isUnmatched ? 'UNASSIGNED' : selectedRet?.retailerId || 'FE1001',
      retailerUid: isUnmatched ? 'UNASSIGNED' : selectedRet?.uid || 'seed_retailer_fe1001',
      retailerName: isUnmatched
        ? 'Unmatched GroMo Commission'
        : selectedRet?.name || 'Sanjit Badyakar',
      status: gromoStatus,
      gromoCommission: commNum,
      retailerCommission: split.retailerCommission,
      adminCommission: split.adminCommission,
      gromoTxnRef: gromoTxnRef.trim() || `GRM-${dateCompact}-${Math.floor(1000 + Math.random() * 9000)}`,
      verificationDate: gromoDate,
      adminNotes: gromoNotes.trim(),
      isUnmatched,
      walletCredited: !isUnmatched && gromoStatus === 'Successful' && commNum > 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await onVerifyOrSaveApplication(
      newRecord,
      !isUnmatched && gromoStatus === 'Successful' && commNum > 0
    );
    showToast(
      isUnmatched
        ? `Saved Unmatched GroMo Commission (₹${commNum}) for manual assignment.`
        : `Verified ${newRecord.customerName} (${newRecord.status}). Retailer ${newRecord.retailerId} credited ₹${split.retailerCommission}.`
    );
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-50">
      {/* Left Desktop Sidebar (15 Modules as specified in Section 4) */}
      <aside className="w-full lg:w-68 bg-slate-900 text-slate-300 border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src={ZERO_POISA_LOGO}
              alt="Zero Poisa Logo"
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0"
            />
            <div>
              <div className="text-xs font-bold text-white">
                {settings.platformName}
              </div>
              <div className="text-[11px] font-mono text-emerald-400">
                admin.{settings.domain}
              </div>
            </div>
          </div>
          {!isAuthorizedAdmin && (
            <button
              type="button"
              onClick={onSignInGoogle}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded-lg"
            >
              Admin Sign In
            </button>
          )}
        </div>

        {/* Horizontal scroll on mobile, vertical stack on desktop */}
        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-2 gap-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const IconComp = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveModule(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                <span className="font-mono text-[11px] opacity-75">{item.num}.</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
        {bannerFeedback && (
          <div className="bg-emerald-900 text-white px-4 py-3 rounded-xl text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{bannerFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerFeedback(null)}
              className="text-slate-300 hover:text-white ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* MODULE 1: EXECUTIVE DASHBOARD */}
        {activeModule === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="text-xs font-mono text-slate-500">
                  Admin Control Panel / 01. Executive Dashboard
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
                  Platform Performance & GroMo Verification Overview
                </h1>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveModule('gromo_daily')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap shrink-0"
                >
                  + Enter Daily GroMo Report
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExportCsv('affiliate_applications_report.csv', applications as unknown as Record<string, unknown>[])
                  }
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* All 13 Mandatory Admin Dashboard Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                {
                  label: '01. Total Retailers',
                  value: totalRetailers.toLocaleString('en-IN'),
                  sub: 'Permanent FE IDs issued',
                  tone: 'text-slate-900',
                },
                {
                  label: '02. Active Retailers',
                  value: activeRetailers.toLocaleString('en-IN'),
                  sub: `${totalRetailers - activeRetailers} inactive`,
                  tone: 'text-emerald-700',
                },
                {
                  label: '03. Total Customers Referred',
                  value: totalCustomersReferred.toLocaleString('en-IN'),
                  sub: 'With explicit privacy consent',
                  tone: 'text-slate-900',
                },
                {
                  label: '04. Total Link Clicks',
                  value: totalLinkClicks.toLocaleString('en-IN'),
                  sub: 'Across all /ref/FE* links',
                  tone: 'text-slate-900',
                },
                {
                  label: '05. Total Applications',
                  value: totalApplications.toLocaleString('en-IN'),
                  sub: 'Tracked in verification ledger',
                  tone: 'text-slate-900',
                },
                {
                  label: '06. Pending Applications',
                  value: pendingApplications.toLocaleString('en-IN'),
                  sub: 'Awaiting GroMo confirmation',
                  tone: 'text-amber-700',
                },
                {
                  label: '07. Successful Applications',
                  value: successfulApplications.toLocaleString('en-IN'),
                  sub: 'Manually verified by Admin',
                  tone: 'text-emerald-700',
                },
                {
                  label: '08. Rejected Applications',
                  value: rejectedApplications.toLocaleString('en-IN'),
                  sub: 'Rejected or Cancelled',
                  tone: 'text-red-600',
                },
                {
                  label: '09. Total Verified GroMo Commission',
                  value: `₹${totalVerifiedGromoCommission.toLocaleString('en-IN')}`,
                  sub: 'Actual GroMo payout verified',
                  tone: 'text-emerald-700',
                },
                {
                  label: '10. Retailer Payable Commission',
                  value: `₹${retailerPayableCommission.toLocaleString('en-IN')}`,
                  sub: `Default ${settings.retailerSharePercent}% retailer share`,
                  tone: 'text-emerald-700',
                },
                {
                  label: '11. Admin Commission Retained',
                  value: `₹${adminCommissionTotal.toLocaleString('en-IN')}`,
                  sub: `Default ${settings.adminSharePercent}% platform share`,
                  tone: 'text-slate-900',
                },
                {
                  label: '12. Total Retailer Wallet Balance',
                  value: `₹${totalWalletBalance.toLocaleString('en-IN')}`,
                  sub: `13. Pending Withdrawals: ₹${pendingWithdrawalsAmount.toLocaleString('en-IN')}`,
                  tone: 'text-slate-900',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5"
                >
                  <div className="text-xs text-slate-500">{stat.label}</div>
                  <div className={`text-2xl font-bold font-mono ${stat.tone}`}>
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent Verified Applications & Unmatched Queue Alert */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Application Verification Ledger
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manual GroMo verification records with 80/20 commission split attribution
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModule('applications')}
                  className="text-xs font-semibold text-slate-900 hover:underline"
                >
                  Open Full Application Tracker →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Retailer (ID)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">GroMo Comm.</th>
                      <th className="py-3 px-4 text-right">Retailer Share</th>
                      <th className="py-3 px-4 text-right">Admin Share</th>
                      <th className="py-3 px-4">Verification Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {applications.map((app) => (
                      <tr key={app.applicationId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {app.customerName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">{app.productTitle}</td>
                        <td className="py-3.5 px-4 font-mono">
                          {app.isUnmatched ? (
                            <span className="text-amber-700 font-semibold">
                              UNMATCHED QUEUE
                            </span>
                          ) : (
                            <span>
                              {app.retailerName} ({app.retailerId})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
                          <span
                            className={
                              app.status === 'Successful'
                                ? 'text-emerald-700'
                                : app.status === 'Rejected'
                                ? 'text-red-600'
                                : 'text-amber-700'
                            }
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{app.gromoCommission.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                          ₹{app.retailerCommission.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                          ₹{app.adminCommission.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {app.verificationDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 2: RETAILER MANAGEMENT */}
        {activeModule === 'retailers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  02. Retailer Management ({retailers.length})
                </h1>
                <p className="text-xs text-slate-500">
                  Activate/deactivate retailer accounts, inspect referral links, and set retailer-specific commission rates.
                </p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={retailerSearch}
                  onChange={(e) => setRetailerSearch(e.target.value)}
                  placeholder="Search ID (FE1001), name, mobile..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Retailer ID</th>
                      <th className="py-3 px-4">Name & Mobile</th>
                      <th className="py-3 px-4">Unique Referral Link</th>
                      <th className="py-3 px-4 text-right">Clicks / Referrals</th>
                      <th className="py-3 px-4 text-right">Wallet Balance</th>
                      <th className="py-3 px-4">Custom Comm. (%)</th>
                      <th className="py-3 px-4">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {retailers
                      .filter((r) => {
                        const q = retailerSearch.toLowerCase();
                        return (
                          !q ||
                          r.retailerId.toLowerCase().includes(q) ||
                          r.name.toLowerCase().includes(q) ||
                          r.mobile.includes(q)
                        );
                      })
                      .map((r) => (
                        <tr key={r.retailerId} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                            {r.retailerId}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{r.name}</div>
                            <div className="font-mono text-slate-500">
                              +91 {r.mobile} · {r.city}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            https://{settings.domain}/ref/{r.retailerId}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            {r.totalClicks} / {r.totalReferrals}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                            ₹{r.walletBalance.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={r.customCommissionPercent}
                              onChange={async (e) => {
                                const val = Number(e.target.value);
                                await onUpdateRetailerCustomCommission(r.retailerId, val);
                                showToast(
                                  `Updated ${r.retailerId} commission override to ${
                                    val === -1 ? 'Global Default' : `${val}%`
                                  }.`
                                );
                              }}
                              className="px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                            >
                              <option value={-1}>
                                Global Default ({settings.retailerSharePercent}%)
                              </option>
                              <option value={70}>70% Retailer Share</option>
                              <option value={75}>75% Retailer Share</option>
                              <option value={80}>80% Retailer Share</option>
                              <option value={85}>85% Retailer Share</option>
                              <option value={90}>90% Retailer Share</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={async () => {
                                await onToggleRetailerStatus(r.retailerId);
                                showToast(`Toggled status for ${r.retailerId}.`);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                r.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {r.status === 'active' ? 'Active (Click to Deactivate)' : 'Inactive (Click to Activate)'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 3: CUSTOMER REFERRALS & MOBILE OTP VERIFICATION LEDGER */}
        {activeModule === 'referrals' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  03. Customer Referral & Mobile OTP Verification Log ({referralLeads.length})
                </h1>
                <p className="text-xs text-slate-500">
                  Search verified leads by mobile number and Retailer ID. Note: OTP verification only confirms customer mobile consent—never mark a lead as a successful loan until verified against GroMo's official report.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleExportCsv(
                    'verified_otp_referral_leads.csv',
                    referralLeads as unknown as Record<string, unknown>[]
                  )
                }
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Leads (CSV)</span>
              </button>
            </div>

            {/* Dedicated Search & Filter Controls: Mobile Number, Retailer ID, OTP Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Search by 10-Digit Mobile Number
                </label>
                <input
                  type="text"
                  value={referralMobileFilter}
                  onChange={(e) =>
                    setReferralMobileFilter(e.target.value.replace(/\D/g, '').slice(0, 10))
                  }
                  placeholder="e.g. 9832109876"
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Filter by Retailer ID
                </label>
                <select
                  value={referralRetailerFilter}
                  onChange={(e) => setReferralRetailerFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl"
                >
                  <option value="All">All Retailers (FE1001..)</option>
                  {retailers.map((r) => (
                    <option key={r.retailerId} value={r.retailerId}>
                      {r.retailerId} — {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Filter by SMS OTP Status
                </label>
                <select
                  value={referralOtpFilter}
                  onChange={(e) =>
                    setReferralOtpFilter(
                      e.target.value as 'All' | 'Verified' | 'Not Verified'
                    )
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                >
                  <option value="All">All OTP Statuses</option>
                  <option value="Verified">OTP Status: Verified</option>
                  <option value="Not Verified">OTP Status: Not Verified</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Search Customer Name / Referral ID
                </label>
                <input
                  type="text"
                  value={referralSearch}
                  onChange={(e) => setReferralSearch(e.target.value)}
                  placeholder="Rani Barman, REF-2026..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Referral ID</th>
                      <th className="py-3 px-4">Customer & Mobile</th>
                      <th className="py-3 px-4">OTP Status</th>
                      <th className="py-3 px-4">Retailer ID</th>
                      <th className="py-3 px-4">Product ID & Title</th>
                      <th className="py-3 px-4">Lead / Loan Status</th>
                      <th className="py-3 px-4">Verification Timestamp</th>
                      <th className="py-3 px-4">GroMo Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {referralLeads
                      .filter((l) => {
                        const q = referralSearch.toLowerCase();
                        const matchesQuery =
                          !q ||
                          l.customerName.toLowerCase().includes(q) ||
                          l.customerMobile.includes(q) ||
                          l.retailerId.toLowerCase().includes(q) ||
                          l.referralRef.toLowerCase().includes(q);
                        const matchesMobile =
                          !referralMobileFilter ||
                          l.customerMobile.includes(referralMobileFilter);
                        const matchesRetailer =
                          referralRetailerFilter === 'All' ||
                          l.retailerId === referralRetailerFilter;
                        const leadOtpStatus = l.otpStatus || 'Verified';
                        const matchesOtp =
                          referralOtpFilter === 'All' ||
                          leadOtpStatus === referralOtpFilter;
                        return (
                          matchesQuery &&
                          matchesMobile &&
                          matchesRetailer &&
                          matchesOtp
                        );
                      })
                      .map((l) => {
                        const otpState = l.otpStatus || 'Verified';
                        return (
                          <tr key={l.referralRef} className="hover:bg-slate-50">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              {l.referralRef}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">
                                {l.customerName}
                              </div>
                              <div className="font-mono text-slate-600">
                                +91 {l.customerMobile}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2.5 py-1 rounded-md ${
                                  otpState === 'Verified'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {otpState === 'Verified' ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                )}
                                <span>{otpState}</span>
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-emerald-700">
                                {l.retailerId}
                              </div>
                              <div className="text-slate-600">{l.retailerName}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">
                                {l.productTitle}
                              </div>
                              <div className="font-mono text-[11px] text-slate-500">
                                {l.productId}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-semibold">
                              <span
                                className={
                                  l.status === 'Successful'
                                    ? 'text-emerald-700'
                                    : l.status === 'Rejected' || l.status === 'Cancelled'
                                    ? 'text-red-600'
                                    : 'text-slate-700'
                                }
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-500">
                              {(l.otpVerifiedAt || l.consentTimestamp)
                                .slice(0, 19)
                                .replace('T', ' ')}
                            </td>
                            <td className="py-3.5 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectLeadForGromo(l.referralRef);
                                  setActiveModule('gromo_daily');
                                }}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                              >
                                Confirm in GroMo Report →
                              </button>
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

        {/* MODULE 4: APPLICATION TRACKING */}
        {activeModule === 'applications' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  04. Application Success Tracking
                </h1>
                <p className="text-xs text-slate-500">
                  Search by customer, retailer name, Retailer ID, mobile number, date, product, or application status.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule('gromo_daily')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl whitespace-nowrap shrink-0"
              >
                + Add / Verify GroMo Application
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <input
                type="text"
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                placeholder="Search customer, FE1001, mobile, GroMo ref..."
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option value="All">All Statuses</option>
                {[
                  'Clicked',
                  'Lead Generated',
                  'Applied',
                  'Pending',
                  'Successful',
                  'Rejected',
                  'Cancelled',
                ].map((s) => (
                  <option key={s} value={s}>
                    Status: {s}
                  </option>
                ))}
              </select>
              <select
                value={appProductFilter}
                onChange={(e) => setAppProductFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
              >
                <option value="All">All Products</option>
                {products.map((p) => (
                  <option key={p.productId} value={p.productId}>
                    {p.title}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={appDateFilter}
                onChange={(e) => setAppDateFilter(e.target.value)}
                className="px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">App ID & GroMo Ref</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Retailer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">GroMo Comm.</th>
                      <th className="py-3 px-4 text-right">Retailer / Admin</th>
                      <th className="py-3 px-4">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {applications
                      .filter((a) => {
                        const q = appSearch.toLowerCase();
                        const matchQuery =
                          !q ||
                          a.customerName.toLowerCase().includes(q) ||
                          a.customerMobile.includes(q) ||
                          a.retailerName.toLowerCase().includes(q) ||
                          a.retailerId.toLowerCase().includes(q) ||
                          a.gromoTxnRef.toLowerCase().includes(q);
                        const matchStatus =
                          appStatusFilter === 'All' || a.status === appStatusFilter;
                        const matchProd =
                          appProductFilter === 'All' || a.productId === appProductFilter;
                        const matchDate =
                          !appDateFilter || a.verificationDate === appDateFilter;
                        return matchQuery && matchStatus && matchProd && matchDate;
                      })
                      .map((app) => (
                        <tr key={app.applicationId} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-slate-900">{app.applicationId}</div>
                            <div className="text-slate-500">{app.gromoTxnRef}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{app.customerName}</div>
                            <div className="font-mono text-slate-500">{app.customerMobile}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{app.productTitle}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{app.retailerName}</div>
                            <div className="font-mono text-emerald-700">{app.retailerId}</div>
                          </td>
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
                            {app.walletCredited && (
                              <div className="text-[10px] font-mono text-emerald-600">
                                Wallet Credited
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">
                            ₹{app.gromoCommission.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            <span className="text-emerald-700 font-bold">
                              ₹{app.retailerCommission}
                            </span>{' '}
                            / <span className="text-slate-500">₹{app.adminCommission}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={app.status}
                              onChange={async (e) => {
                                const nextStatus = e.target.value as ApplicationStatus;
                                const shouldCredit =
                                  nextStatus === 'Successful' &&
                                  !app.walletCredited &&
                                  !app.isUnmatched;
                                await onVerifyOrSaveApplication(
                                  {
                                    ...app,
                                    status: nextStatus,
                                    walletCredited: app.walletCredited || shouldCredit,
                                    updatedAt: new Date().toISOString(),
                                  },
                                  shouldCredit
                                );
                                showToast(
                                  `Updated ${app.applicationId} status to ${nextStatus}${
                                    shouldCredit
                                      ? ` & credited ₹${app.retailerCommission} to ${app.retailerId}`
                                      : ''
                                  }.`
                                );
                              }}
                              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                            >
                              {[
                                'Clicked',
                                'Lead Generated',
                                'Applied',
                                'Pending',
                                'Successful',
                                'Rejected',
                                'Cancelled',
                              ].map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 5: PRODUCT MANAGEMENT */}
        {activeModule === 'products' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                05. Dynamic Product Management
              </h1>
              <p className="text-xs text-slate-500">
                Add unlimited financial products, update images, titles, descriptions, categories, and button text. Updates sync instantly to the retailer app without requiring a new APK.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Product Editor Form */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  {editingProduct ? `Edit Product: ${editingProduct.title}` : 'Add New Affiliate Product'}
                </h2>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const id =
                      editingProduct?.productId ||
                      `PROD_${Date.now().toString().slice(-5)}`;
                    const newProd: Product = {
                      productId: id,
                      title: prodTitle.trim(),
                      category: prodCategory.trim(),
                      description: prodDesc.trim(),
                      imageUrl: prodImage.trim() || IMG_PERSONAL_LOAN,
                      bannerTag: prodBannerTag.trim(),
                      buttonText: prodBtnText.trim() || 'Apply Now',
                      gromoAffiliateUrl: prodGromoUrl.trim() || settings.commonGromoUrl,
                      useCommonGromoUrl: prodUseCommon,
                      subIdParamName: prodSubIdParam.trim(),
                      estimatedCommission: Number(prodEstComm) || 0,
                      commissionType: prodCommType,
                      retailerCommissionValue: Number(prodCommVal) || 80,
                      active: true,
                      updatedAt: new Date().toISOString(),
                    };
                    await onSaveProduct(newProd, !editingProduct);
                    setEditingProduct(null);
                    setProdTitle('');
                    setProdDesc('');
                    showToast(`Published product "${newProd.title}" to Retailer App & Landing Page.`);
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodTitle}
                      onChange={(e) => setProdTitle(e.target.value)}
                      placeholder="e.g. Axis Business Credit Line"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Category *
                      </label>
                      <input
                        type="text"
                        required
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        placeholder="Personal Loan"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        CTA Button Text *
                      </label>
                      <input
                        type="text"
                        required
                        value={prodBtnText}
                        onChange={(e) => setProdBtnText(e.target.value)}
                        placeholder="Apply Now"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Banner Highlight Tag
                    </label>
                    <input
                      type="text"
                      value={prodBannerTag}
                      onChange={(e) => setProdBannerTag(e.target.value)}
                      placeholder="Zero Joining Fee · Instant Disbursal"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Product Visual Preset or Image URL
                    </label>
                    <select
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white mb-1.5"
                    >
                      <option value={IMG_PERSONAL_LOAN}>Personal Loan Studio Visual</option>
                      <option value={IMG_CREDIT_CARD}>Platinum Credit Card Visual</option>
                      <option value={IMG_SAVINGS_ACCOUNT}>Digital Savings Account Visual</option>
                      <option value={IMG_DEMAT_ACCOUNT}>Demat & Trading Visual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Product Description *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      placeholder="Describe eligibility, interest rates, and benefits..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Est. GroMo Payout (₹)
                      </label>
                      <input
                        type="number"
                        value={prodEstComm}
                        onChange={(e) => setProdEstComm(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Product Commission Rule
                      </label>
                      <select
                        value={prodCommType}
                        onChange={(e) =>
                          setProdCommType(e.target.value as 'default' | 'percentage' | 'fixed')
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="default">Use Global Split ({settings.retailerSharePercent}%)</option>
                        <option value="percentage">Custom Percentage (%)</option>
                        <option value="fixed">Fixed Retailer Amount (₹)</option>
                      </select>
                    </div>
                  </div>

                  {prodCommType !== 'default' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        {prodCommType === 'percentage'
                          ? 'Retailer Percentage (%)'
                          : 'Fixed Retailer Commission (₹)'}
                      </label>
                      <input
                        type="number"
                        value={prodCommVal}
                        onChange={(e) => setProdCommVal(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl py-2.5 px-4 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{editingProduct ? 'Publish Product Update' : 'Publish New Product'}</span>
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setProdTitle('');
                          setProdDesc('');
                        }}
                        className="px-3 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Active Product Cards List */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((p) => (
                  <div
                    key={p.productId}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <ResilientImage
                        src={p.imageUrl}
                        alt={p.title}
                        fallbackTitle={p.title}
                        className="w-full h-36 object-cover"
                      />
                      <div className="p-4 space-y-1.5">
                        <div className="text-xs text-slate-500">
                          {p.category} · Est. GroMo Payout: ₹{p.estimatedCommission}
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{p.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2">{p.description}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setProdTitle(p.title);
                          setProdCategory(p.category);
                          setProdDesc(p.description);
                          setProdImage(p.imageUrl);
                          setProdBannerTag(p.bannerTag);
                          setProdBtnText(p.buttonText);
                          setProdGromoUrl(p.gromoAffiliateUrl);
                          setProdUseCommon(p.useCommonGromoUrl);
                          setProdSubIdParam(p.subIdParamName);
                          setProdEstComm(String(p.estimatedCommission));
                          setProdCommType(p.commissionType);
                          setProdCommVal(String(p.retailerCommissionValue));
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-semibold rounded-lg"
                      >
                        Edit Product
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onSaveProduct({ ...p, active: !p.active }, false);
                          showToast(
                            `${p.title} is now ${!p.active ? 'Active' : 'Deactivated'}.`
                          );
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                          p.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {p.active ? 'Active' : 'Paused'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 6: GRO MO AFFILIATE LINK MANAGEMENT */}
        {activeModule === 'affiliate_links' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                06. GroMo Affiliate Link Management
              </h1>
              <p className="text-xs text-slate-500">
                Configure one common GroMo affiliate link shared across all retailers or assign product-specific links. We never modify GroMo URLs with unsupported parameters.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-900">
                Common Authorized GroMo Affiliate URL
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Master GroMo Redirect Link *
                  </label>
                  <input
                    type="url"
                    value={commonUrlInput}
                    onChange={(e) => setCommonUrlInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl"
                  />
                </div>

                <label className="flex items-center gap-3 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={commonLinkActive}
                    onChange={(e) => setCommonLinkActive(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300"
                  />
                  <span>
                    Common GroMo Affiliate Link Active (Uncheck to pause external redirects)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateSettings(
                      {
                        ...settings,
                        commonGromoUrl: commonUrlInput.trim(),
                        gromoLinkActive: commonLinkActive,
                        updatedAt: new Date().toISOString(),
                      },
                      `Updated Common GroMo Affiliate URL to ${commonUrlInput.trim()}`
                    );
                    showToast('Common GroMo affiliate link updated across all retailer links.');
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                >
                  Save Common GroMo Affiliate Link
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Product-Level Link & Approved Sub-ID Routing
              </h3>
              <div className="divide-y divide-slate-100">
                {products.map((p) => (
                  <div
                    key={p.productId}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.title}</div>
                      <div className="font-mono text-slate-500">
                        Target:{' '}
                        {p.useCommonGromoUrl ? settings.commonGromoUrl : p.gromoAffiliateUrl}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">
                        Sub-ID Param: {p.subIdParamName || 'None (Clean URL)'}
                      </span>
                      <a
                        href={
                          p.useCommonGromoUrl ? settings.commonGromoUrl : p.gromoAffiliateUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold rounded-lg flex items-center gap-1"
                      >
                        <span>Test Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 7: COMMISSION SETTINGS */}
        {activeModule === 'commissions' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                07. Commission Split & Payout Rules
              </h1>
              <p className="text-xs text-slate-500">
                Configure global percentage (Default 80% Retailer / 20% Admin) or fixed amount rules, rounding modes, effective dates, and minimum withdrawal thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Global Commission Type
                    </label>
                    <select
                      value={commType}
                      onChange={(e) =>
                        setCommType(e.target.value as 'percentage' | 'fixed')
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="percentage">Percentage Split (%)</option>
                      <option value="fixed">Fixed Amount (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                {commType === 'percentage' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Retailer Share (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={retSharePct}
                        onChange={(e) => setRetSharePct(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Admin Share (%)
                      </label>
                      <input
                        type="number"
                        disabled
                        value={Math.max(0, 100 - Number(retSharePct || 0))}
                        className="w-full px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Fixed Retailer Payout per Successful Application (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={fixedRetAmt}
                      onChange={(e) => setFixedRetAmt(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Rounding Rule
                    </label>
                    <select
                      value={roundingRule}
                      onChange={(e) =>
                        setRoundingRule(e.target.value as 'nearest' | 'floor' | 'ceil')
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="nearest">Nearest Rupee (Math.round)</option>
                      <option value="floor">Round Down (Math.floor)</option>
                      <option value="ceil">Round Up (Math.ceil)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Min. Withdrawal Amount (₹)
                    </label>
                    <input
                      type="number"
                      min={100}
                      value={minWithdrawAmt}
                      onChange={(e) => setMinWithdrawAmt(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    const rPct = Math.min(100, Math.max(0, Number(retSharePct) || 80));
                    const nextSettings: PlatformSettings = {
                      ...settings,
                      commissionType: commType,
                      retailerSharePercent: rPct,
                      adminSharePercent: 100 - rPct,
                      fixedRetailerAmount: Number(fixedRetAmt) || 500,
                      minWithdrawalAmount: Number(minWithdrawAmt) || 500,
                      roundingRule,
                      effectiveDate,
                      updatedAt: new Date().toISOString(),
                    };
                    await onUpdateSettings(
                      nextSettings,
                      `Updated Commission Rules: ${commType} (${rPct}% Retailer / ${100 - rPct}% Admin)`
                    );
                    showToast('Commission settings saved to database.');
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl py-3"
                >
                  Save Global Commission Rules
                </button>
              </div>

              {/* Interactive Commission Split Calculator Preview */}
              <div className="md:col-span-5 bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  Live Commission Split Preview
                </h3>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Verified GroMo Commission Received (₹)
                  </label>
                  <input
                    type="number"
                    value={previewSampleGromoAmt}
                    onChange={(e) => setPreviewSampleGromoAmt(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-800 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                {(() => {
                  const sampleAmt = Number(previewSampleGromoAmt) || 0;
                  const rPct = Math.min(100, Math.max(0, Number(retSharePct) || 80));
                  const previewSplit = calculateCommissionSplit(sampleAmt, {
                    ...settings,
                    commissionType: commType,
                    retailerSharePercent: rPct,
                    adminSharePercent: 100 - rPct,
                    fixedRetailerAmount: Number(fixedRetAmt) || 500,
                    roundingRule,
                  });
                  return (
                    <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Verified GroMo Payout:</span>
                        <span className="font-bold">₹{sampleAmt.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 text-sm">
                        <span>Retailer Commission:</span>
                        <span className="font-bold">
                          ₹{previewSplit.retailerCommission.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Admin Commission:</span>
                        <span className="font-bold">
                          ₹{previewSplit.adminCommission.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* MODULE 8: WALLET MANAGEMENT */}
        {activeModule === 'wallets' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                08. Retailer Wallet Management & Audit Ledger
              </h1>
              <p className="text-xs text-slate-500">
                Manually credit verified earnings or debit with mandatory reason and immutable reference number.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Authorized Wallet Credit / Debit Adjustment
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const amt = Number(walletAdjAmount);
                    if (isNaN(amt) || amt <= 0) {
                      showToast('Enter a valid positive adjustment amount.');
                      return;
                    }
                    if (!walletAdjReason.trim()) {
                      showToast('An audit reason is mandatory for wallet adjustments.');
                      return;
                    }
                    await onManualWalletAdjustment(
                      walletTargetRetailer,
                      walletAdjType,
                      amt,
                      walletAdjReason.trim()
                    );
                    setWalletAdjAmount('');
                    setWalletAdjReason('');
                    showToast(
                      `Processed ₹${amt} ${walletAdjType} for Retailer ${walletTargetRetailer}.`
                    );
                  }}
                  className="space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Select Retailer *
                    </label>
                    <select
                      value={walletTargetRetailer}
                      onChange={(e) => setWalletTargetRetailer(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl bg-white"
                    >
                      {retailers.map((r) => (
                        <option key={r.retailerId} value={r.retailerId}>
                          {r.retailerId} — {r.name} (Balance: ₹{r.walletBalance})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Adjustment Type *
                      </label>
                      <select
                        value={walletAdjType}
                        onChange={(e) =>
                          setWalletAdjType(e.target.value as 'credit' | 'debit')
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="credit">Credit (+₹ Verified Earning)</option>
                        <option value="debit">Debit (-₹ Reversal / Clawback)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={walletAdjAmount}
                        onChange={(e) => setWalletAdjAmount(e.target.value)}
                        placeholder="800"
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Audit Reason & GroMo Reference *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={walletAdjReason}
                      onChange={(e) => setWalletAdjReason(e.target.value)}
                      placeholder="e.g. Manual GroMo payout credit for Personal Loan GRM-20261123-8841"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl py-2.5"
                  >
                    Execute Wallet Adjustment & Log Audit Reference
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900">
                    Complete Wallet Transaction History ({walletTransactions.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                        <th className="py-3 px-4">Txn Reference</th>
                        <th className="py-3 px-4">Retailer</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Audit Reason</th>
                        <th className="py-3 px-4 text-right">Amount</th>
                        <th className="py-3 px-4 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {walletTransactions.map((t) => (
                        <tr key={t.txnRef}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {t.txnRef}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold">{t.retailerName}</span>{' '}
                            <span className="font-mono text-emerald-700">({t.retailerId})</span>
                          </td>
                          <td className="py-3 px-4 uppercase font-mono text-[11px] font-semibold">
                            <span
                              className={
                                t.type === 'credit' ? 'text-emerald-700' : 'text-amber-700'
                              }
                            >
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{t.reason}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold">
                            {t.type === 'credit' ? '+' : '-'}₹
                            {t.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            ₹{t.balanceAfter.toLocaleString('en-IN')}
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

        {/* MODULE 9: WITHDRAWAL MANAGEMENT */}
        {activeModule === 'withdrawals' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                09. Retailer Withdrawal Management
              </h1>
              <p className="text-xs text-slate-500">
                Approve requests, mark payouts as completed with UTR payment reference, or reject with reason (auto-refunds retailer wallet).
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Withdrawal ID</th>
                      <th className="py-3 px-4">Retailer</th>
                      <th className="py-3 px-4">Payout Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">UTR / Payment Reference & Notes</th>
                      <th className="py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {withdrawals.map((w) => (
                      <tr key={w.withdrawalId} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {w.withdrawalId}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{w.retailerName}</div>
                          <div className="font-mono text-emerald-700">{w.retailerId}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-700">
                          {w.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{w.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold">
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
                        <td className="py-3.5 px-4 space-y-1">
                          <input
                            type="text"
                            placeholder="UTR / Payment Ref"
                            value={wdrRefInput[w.withdrawalId] ?? w.paymentRef}
                            onChange={(e) =>
                              setWdrRefInput({
                                ...wdrRefInput,
                                [w.withdrawalId]: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1 text-xs font-mono border border-slate-300 rounded"
                          />
                          <input
                            type="text"
                            placeholder="Admin Reason / Note"
                            value={wdrReasonInput[w.withdrawalId] ?? w.adminReason}
                            onChange={(e) =>
                              setWdrReasonInput({
                                ...wdrReasonInput,
                                [w.withdrawalId]: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded"
                          />
                        </td>
                        <td className="py-3.5 px-4 space-y-1">
                          {w.status !== 'Completed' && w.status !== 'Rejected' && (
                            <div className="flex flex-wrap gap-1.5">
                              {w.status === 'Pending' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onProcessWithdrawal(
                                      w.withdrawalId,
                                      'Approved',
                                      wdrRefInput[w.withdrawalId] || 'APPROVED-FOR-IMPS',
                                      wdrReasonInput[w.withdrawalId] ||
                                        'Approved by Admin Desk — Queued for bank settlement'
                                    );
                                    showToast(
                                      `Approved withdrawal ${w.withdrawalId} & sent status email to ${w.retailerName}.`
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={async () => {
                                  await onProcessWithdrawal(
                                    w.withdrawalId,
                                    'Completed',
                                    wdrRefInput[w.withdrawalId] || 'UTR994810231',
                                    wdrReasonInput[w.withdrawalId] || 'Paid via UPI/IMPS'
                                  );
                                  showToast(
                                    `Marked withdrawal ${w.withdrawalId} Completed & sent email notification.`
                                  );
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded"
                              >
                                Mark Completed
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await onProcessWithdrawal(
                                    w.withdrawalId,
                                    'Rejected',
                                    '',
                                    wdrReasonInput[w.withdrawalId] || 'Invalid UPI ID — Refunded'
                                  );
                                  showToast(
                                    `Rejected withdrawal ${w.withdrawalId}, refunded wallet & sent email notification.`
                                  );
                                }}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          <div className="text-[10px] text-slate-500 flex items-center gap-1 pt-0.5">
                            <Mail className="w-3 h-3 text-emerald-700" />
                            <span>Auto-sends templated email on status change</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 10: DAILY ADMIN GRO MO VERIFICATION REPORT */}
        {activeModule === 'gromo_daily' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  10. Daily GroMo Verification Report
                </h1>
                <p className="text-xs text-slate-500">
                  Log into GroMo separately, verify actual successful applications & payouts, match with internal referral records, and credit retailer wallets.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleExportCsv(
                    `gromo_daily_report_${gromoDate}.csv`,
                    applications as unknown as Record<string, unknown>[]
                  )
                }
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Report to Excel (CSV)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Step-by-Step Verification Entry Card */}
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Enter Verified GroMo Application / Commission
                </h2>

                <form onSubmit={handleGromoVerificationSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Verification Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={gromoDate}
                        onChange={(e) => setGromoDate(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        GroMo Matching Mode *
                      </label>
                      <select
                        value={gromoMatchMode}
                        onChange={(e) =>
                          setGromoMatchMode(
                            e.target.value as 'referral' | 'retailer' | 'unmatched'
                          )
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="referral">
                          1. Match Customer Referral Record
                        </option>
                        <option value="retailer">
                          2. Match Retailer ID / Sub-ID
                        </option>
                        <option value="unmatched">
                          3. Bulk / No Customer ID (Unmatched Queue)
                        </option>
                      </select>
                    </div>
                  </div>

                  {gromoMatchMode === 'referral' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Select Internal Customer Referral Record
                      </label>
                      <select
                        value={selectedLeadRef}
                        onChange={(e) => handleSelectLeadForGromo(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl bg-white"
                      >
                        {referralLeads.map((l) => (
                          <option key={l.referralRef} value={l.referralRef}>
                            {l.referralRef} · {l.customerName} (+91 {l.customerMobile}) →{' '}
                            {l.retailerId} ({l.productTitle})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {gromoMatchMode !== 'unmatched' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Customer Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={gromoCustomerName}
                          onChange={(e) => setGromoCustomerName(e.target.value)}
                          placeholder="Rani Barman"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Customer Mobile
                        </label>
                        <input
                          type="text"
                          value={gromoCustomerMobile}
                          onChange={(e) => setGromoCustomerMobile(e.target.value)}
                          placeholder="9832109876"
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Product *
                      </label>
                      <select
                        value={gromoProductId}
                        onChange={(e) => setGromoProductId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        {products.map((p) => (
                          <option key={p.productId} value={p.productId}>
                            {p.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {gromoMatchMode !== 'unmatched' ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Attributed Retailer *
                        </label>
                        <select
                          value={gromoRetailerId}
                          onChange={(e) => setGromoRetailerId(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl bg-white"
                        >
                          {retailers.map((r) => (
                            <option key={r.retailerId} value={r.retailerId}>
                              {r.retailerId} — {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900">
                        No retailer guessed. Record will be placed in Unmatched Commission queue.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Application Status
                      </label>
                      <select
                        value={gromoStatus}
                        onChange={(e) =>
                          setGromoStatus(e.target.value as ApplicationStatus)
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                      >
                        <option value="Successful">Successful</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        GroMo Commission (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={gromoVerifiedAmt}
                        onChange={(e) => setGromoVerifiedAmt(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        GroMo Txn Reference *
                      </label>
                      <input
                        type="text"
                        required
                        value={gromoTxnRef}
                        onChange={(e) => setGromoTxnRef(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Live Split Review Box */}
                  {(() => {
                    const amt = Number(gromoVerifiedAmt) || 0;
                    const prod = products.find((p) => p.productId === gromoProductId);
                    const ret = retailers.find((r) => r.retailerId === gromoRetailerId);
                    const split = calculateCommissionSplit(amt, settings, prod, ret);
                    return (
                      <div className="bg-slate-900 text-white rounded-xl p-4 text-xs font-mono space-y-1">
                        <div className="text-slate-400">
                          Rule Applied: {split.appliedRuleLabel}
                        </div>
                        <div className="flex justify-between pt-1">
                          <span>Verified GroMo Commission:</span>
                          <span className="font-bold">₹{amt.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>Retailer Wallet Credit ({gromoRetailerId}):</span>
                          <span className="font-bold">
                            ₹{split.retailerCommission.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Admin Commission Retained:</span>
                          <span className="font-bold">
                            ₹{split.adminCommission.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl py-3"
                  >
                    Confirm GroMo Verification & Credit Retailer Wallet
                  </button>
                </form>
              </div>

              {/* Unmatched Commission Section (Mandatory when GroMo only supplies total commission without identity) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h2 className="text-base font-bold text-slate-900">
                      Unmatched GroMo Commission Queue (
                      {applications.filter((a) => a.isUnmatched).length})
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600">
                    When GroMo provides bulk commission without customer identity, records are held here without guessing attribution until manually assigned by Admin.
                  </p>

                  <div className="divide-y divide-slate-100">
                    {applications.filter((a) => a.isUnmatched).length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500">
                        All GroMo commissions are currently matched.
                      </div>
                    ) : (
                      applications
                        .filter((a) => a.isUnmatched)
                        .map((unmatchedApp) => (
                          <div
                            key={unmatchedApp.applicationId}
                            className="py-4 space-y-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900">
                                {unmatchedApp.gromoTxnRef} ({unmatchedApp.verificationDate})
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                GroMo Payout: ₹{unmatchedApp.gromoCommission} (Retailer Share: ₹
                                {unmatchedApp.retailerCommission})
                              </span>
                            </div>
                            <div className="text-slate-600">
                              {unmatchedApp.productTitle} — {unmatchedApp.adminNotes}
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <select
                                value={
                                  unmatchedAssignTarget[unmatchedApp.applicationId] ||
                                  retailers[0]?.retailerId ||
                                  'FE1001'
                                }
                                onChange={(e) =>
                                  setUnmatchedAssignTarget({
                                    ...unmatchedAssignTarget,
                                    [unmatchedApp.applicationId]: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg bg-white"
                              >
                                {retailers.map((r) => (
                                  <option key={r.retailerId} value={r.retailerId}>
                                    Assign to {r.retailerId} — {r.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={async () => {
                                  const targetId =
                                    unmatchedAssignTarget[unmatchedApp.applicationId] ||
                                    retailers[0]?.retailerId ||
                                    'FE1001';
                                  await onAssignUnmatchedApplication(
                                    unmatchedApp.applicationId,
                                    targetId,
                                    true
                                  );
                                  showToast(
                                    `Matched ${unmatchedApp.gromoTxnRef} to Retailer ${targetId} & credited ₹${unmatchedApp.retailerCommission}.`
                                  );
                                }}
                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
                              >
                                Assign & Credit Wallet
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 11: NOTIFICATIONS & AUTOMATED EMAIL TEMPLATES */}
        {activeModule === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                11. Templated Email Notification System & Broadcasts
              </h1>
              <p className="text-xs text-slate-500">
                Configure automated email templates triggered whenever a retailer&apos;s commission is credited or a withdrawal request changes status, and inspect the Sent Email Outbox.
              </p>
            </div>

            {/* Automated Email Template Editor & Live Preview */}
            {(() => {
              const currentTpl =
                emailTemplates.find((t) => t.templateId === activeEmailTemplateId) ||
                emailTemplates[0];
              if (!currentTpl) return null;

              const currentSubject =
                emailSubjectDrafts[currentTpl.templateId] ?? currentTpl.subjectTemplate;
              const currentBody =
                emailBodyDrafts[currentTpl.templateId] ?? currentTpl.bodyTemplate;

              const samplePreviewVars: Record<string, string> =
                currentTpl.templateId === 'COMMISSION_CREDITED'
                  ? {
                      retailerName: 'Sanjit Badyakar',
                      retailerId: 'FE1001',
                      retailerEmail: 'sanjit.fe1001@foodexpres.in',
                      creditedAmount: '800',
                      gromoCommission: '1,000',
                      newWalletBalance: '3,000',
                      applicationId: 'APP-20261123-501',
                      customerName: 'Rani Barman',
                      productTitle: 'Instant Personal Loan',
                      txnRef: 'TXN-GRM-20261123-8841',
                      verificationDate: '23 November 2026',
                      platformName: settings.platformName,
                      domain: settings.domain,
                    }
                  : {
                      retailerName: 'Arindam Ghosh',
                      retailerId: 'FE1002',
                      retailerEmail: 'arindam.fe1002@foodexpres.in',
                      withdrawalId: 'WDR-20261123-02',
                      amount: '640',
                      status: 'Approved',
                      paymentMethod: 'UPI: arindamghosh@ybl',
                      paymentRef: 'UTR994810231',
                      adminReason: 'Approved by Admin Desk — IMPS payout initiated',
                      newWalletBalance: '640',
                      platformName: settings.platformName,
                      domain: settings.domain,
                    };

              const renderPreview = (tplStr: string) =>
                tplStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key: string) =>
                  samplePreviewVars[key] || `{{${key}}}`
                );

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Template Selector & Editor */}
                  <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-emerald-700" />
                        <h2 className="text-base font-bold text-slate-900">
                          Email Notification Template Editor
                        </h2>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveEmailTemplateId('COMMISSION_CREDITED')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            activeEmailTemplateId === 'COMMISSION_CREDITED'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          1. Commission Credited
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveEmailTemplateId('WITHDRAWAL_STATUS_UPDATED')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            activeEmailTemplateId === 'WITHDRAWAL_STATUS_UPDATED'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          2. Withdrawal Status
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-900">
                        Template ID:{' '}
                        <span className="font-mono text-emerald-700">
                          {currentTpl.templateId}
                        </span>
                      </div>
                      <div>{currentTpl.triggerDescription}</div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Available Template Variables (Click to insert into body)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {currentTpl.availableVariables.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() =>
                              setEmailBodyDrafts({
                                ...emailBodyDrafts,
                                [currentTpl.templateId]: `${currentBody} {{${v}}}`,
                              })
                            }
                            className="px-2 py-0.5 text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                          >
                            {`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Email Subject Template *
                      </label>
                      <input
                        type="text"
                        value={currentSubject}
                        onChange={(e) =>
                          setEmailSubjectDrafts({
                            ...emailSubjectDrafts,
                            [currentTpl.templateId]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-800 mb-1">
                        Email Body Template *
                      </label>
                      <textarea
                        rows={10}
                        value={currentBody}
                        onChange={(e) =>
                          setEmailBodyDrafts({
                            ...emailBodyDrafts,
                            [currentTpl.templateId]: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl leading-relaxed"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Last updated: {currentTpl.updatedAt.slice(0, 16).replace('T', ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateEmailTemplate(
                            currentTpl.templateId,
                            currentSubject,
                            currentBody
                          );
                          showToast(
                            `Saved ${currentTpl.name} template (${currentTpl.templateId}).`
                          );
                        }}
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                      >
                        Save Email Template
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Live Rendered Email Preview */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900">
                          Live Rendered Email Preview
                        </h3>
                        <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                          Sample Retailer Data
                        </span>
                      </div>

                      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3 text-xs font-mono">
                        <div className="space-y-1 border-b border-slate-800 pb-2.5">
                          <div className="text-slate-400">
                            From:{' '}
                            <span className="text-white">
                              notifications@{settings.domain}
                            </span>
                          </div>
                          <div className="text-slate-400">
                            To:{' '}
                            <span className="text-emerald-400">
                              {samplePreviewVars.retailerEmail}
                            </span>
                          </div>
                          <div className="text-slate-400">
                            Subject:{' '}
                            <span className="text-white font-bold">
                              {renderPreview(currentSubject)}
                            </span>
                          </div>
                        </div>
                        <pre className="whitespace-pre-wrap text-[11px] text-slate-200 font-mono leading-relaxed max-h-72 overflow-y-auto">
                          {renderPreview(currentBody)}
                        </pre>
                      </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-[11px] text-emerald-950 space-y-1">
                      <div className="font-bold">Automated Trigger Points Active:</div>
                      <div>
                        • <strong>Commission Credited:</strong> Fires automatically in Module 04 / Module 10 (GroMo Application Verification) & Module 08 (Manual Wallet Credit).
                      </div>
                      <div>
                        • <strong>Withdrawal Status Updated:</strong> Fires automatically in Module 09 whenever a withdrawal is marked Approved, Completed, or Rejected.
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Dispatched Email Outbox Log */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Dispatched Email Notification Log ({emailLogs.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Every templated email sent to retailers on commission credit or withdrawal status change. Click any row to inspect the full rendered email.
                  </p>
                </div>
                <select
                  value={emailLogRetailerFilter}
                  onChange={(e) => setEmailLogRetailerFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-xl bg-white"
                >
                  <option value="All">All Retailers ({emailLogs.length})</option>
                  {retailers.map((r) => (
                    <option key={r.retailerId} value={r.retailerId}>
                      {r.retailerId} — {r.name} ({r.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-slate-100">
                {emailLogs
                  .filter(
                    (item) =>
                      emailLogRetailerFilter === 'All' ||
                      item.retailerId === emailLogRetailerFilter
                  )
                  .map((item) => {
                    const isExpanded = expandedEmailLogId === item.emailId;
                    return (
                      <div key={item.emailId} className="p-4 hover:bg-slate-50 transition-colors">
                        <div
                          onClick={() =>
                            setExpandedEmailLogId(isExpanded ? null : item.emailId)
                          }
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono font-bold text-slate-900">
                                {item.emailId}
                              </span>
                              <span
                                className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  item.templateId === 'COMMISSION_CREDITED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {item.templateId}
                              </span>
                              <span className="text-slate-600 font-medium">
                                To: <strong className="font-mono">{item.toEmail}</strong> (
                                {item.retailerName} · {item.retailerId})
                              </span>
                            </div>
                            <div className="text-xs font-bold text-slate-900">
                              {item.subject}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-right shrink-0">
                            <div className="text-[11px] font-mono text-slate-500">
                              <div>{item.sentAt.slice(0, 16).replace('T', ' ')}</div>
                              <div className="text-emerald-700 font-semibold">
                                {item.status}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 underline">
                              {isExpanded ? 'Hide Email' : 'View Email'}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 bg-slate-900 text-slate-100 rounded-xl p-4 text-xs font-mono space-y-2">
                            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                              <span>From: {item.fromEmail}</span>
                              <span>To: {item.toEmail}</span>
                              <span>Gateway: {item.provider}</span>
                            </div>
                            <pre className="whitespace-pre-wrap text-slate-200 text-xs font-mono leading-relaxed">
                              {item.body}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* In-App Broadcast Announcement Composer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-900">
                  Send In-App Broadcast Announcement
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!notifTitle.trim() || !notifMsg.trim()) return;
                    await onSendNotification(
                      notifTitle.trim(),
                      notifMsg.trim(),
                      notifCat,
                      notifTargetRole,
                      'all'
                    );
                    setNotifTitle('');
                    setNotifMsg('');
                    showToast('Notification dispatched to retailers.');
                  }}
                  className="space-y-3.5"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="Notification Headline *"
                      className="px-3 py-2 text-xs border border-slate-300 rounded-xl"
                    />
                    <select
                      value={notifCat}
                      onChange={(e) => setNotifCat(e.target.value)}
                      className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="Announcement">Admin Announcement</option>
                      <option value="Verification">GroMo Verification Update</option>
                      <option value="Commission">Commission Rate Alert</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={notifMsg}
                    onChange={(e) => setNotifMsg(e.target.value)}
                    placeholder="Enter message for retailers..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl"
                  >
                    Send Notification
                  </button>
                </form>
              </div>

              <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  In-App Feed History ({notifications.length})
                </h3>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.notificationId} className="py-3 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500 font-mono">
                        <span>{n.category}</span>
                        <span>{n.createdAt.slice(0, 16).replace('T', ' ')}</span>
                      </div>
                      <div className="font-bold text-slate-900">{n.title}</div>
                      <div className="text-slate-600">{n.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 12: REPORTS & ANALYTICS */}
        {activeModule === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  12. Financial & Attribution Reports (Daily / Monthly)
                </h1>
                <p className="text-xs text-slate-500">
                  Interactive visual charts, retailer conversion matrix, and exportable Excel (CSV) reports.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleExportCsv(
                      'retailer_performance_summary.csv',
                      retailers as unknown as Record<string, unknown>[]
                    )
                  }
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Retailer Ledger (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleExportCsv(
                      'verified_gromo_commissions_monthly.csv',
                      applications as unknown as Record<string, unknown>[]
                    )
                  }
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Monthly GroMo Report (CSV)</span>
                </button>
              </div>
            </div>

            {/* Visual Charts Row: Clicks vs Referrals & Commission Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Retailer Clicks vs. Referrals vs. Verified Applications
                  </h2>
                  <p className="text-xs text-slate-500">
                    Funnel comparison across active Retailer IDs ({retailers.map((r) => r.retailerId).join(', ')})
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={retailers.map((r) => ({
                        retailer: `${r.retailerId} (${r.name.split(' ')[0]})`,
                        clicks: r.totalClicks,
                        referrals: r.totalReferrals,
                        verifiedApps: applications.filter(
                          (a) => a.retailerId === r.retailerId && a.status === 'Successful'
                        ).length,
                      }))}
                      margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="retailer" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} allowDecimals={false} />
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
                      <Bar dataKey="clicks" name="Link Clicks" fill="#1363d1" radius={[6, 6, 0, 0]} />
                      <Bar
                        dataKey="referrals"
                        name="Consented Referrals"
                        fill="#0284c7"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="verifiedApps"
                        name="Verified Wins"
                        fill="#059669"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Verified Commission Split (Retailer 80% vs. Admin 20%)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Financial payout distribution across verified GroMo applications (₹)
                  </p>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={retailers.map((r) => {
                        const rApps = applications.filter(
                          (a) =>
                            a.retailerId === r.retailerId &&
                            a.status === 'Successful' &&
                            !a.isUnmatched
                        );
                        const gromoTotal = rApps.reduce((acc, a) => acc + a.gromoCommission, 0);
                        const retailerTotal = rApps.reduce(
                          (acc, a) => acc + a.retailerCommission,
                          0
                        );
                        const adminTotal = rApps.reduce((acc, a) => acc + a.adminCommission, 0);
                        return {
                          retailer: `${r.retailerId}`,
                          gromoTotal,
                          retailerTotal,
                          adminTotal,
                        };
                      })}
                      margin={{ top: 10, right: 16, left: -4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="retailer" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
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
                      <Bar
                        dataKey="gromoTotal"
                        name="Verified GroMo Payout (₹)"
                        fill="#0f172a"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="retailerTotal"
                        name="Retailer Share (₹)"
                        fill="#059669"
                        radius={[6, 6, 0, 0]}
                      />
                      <Bar
                        dataKey="adminTotal"
                        name="Admin Retained (₹)"
                        fill="#d97706"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Retailer Conversion & Commission Attribution Matrix
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Retailer ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4 text-right">Clicks</th>
                      <th className="py-3 px-4 text-right">Referrals</th>
                      <th className="py-3 px-4 text-right">Verified Earnings</th>
                      <th className="py-3 px-4 text-right">Withdrawn</th>
                      <th className="py-3 px-4 text-right">Current Wallet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono">
                    {retailers.map((r) => (
                      <tr key={r.retailerId}>
                        <td className="py-3 px-4 font-bold text-emerald-700">{r.retailerId}</td>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                          {r.name}
                        </td>
                        <td className="py-3 px-4 text-right">{r.totalClicks}</td>
                        <td className="py-3 px-4 text-right">{r.totalReferrals}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-700">
                          ₹{r.totalVerifiedEarnings.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          ₹{r.totalWithdrawn.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          ₹{r.walletBalance.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 13: WEBSITE / APP SETTINGS, DATABASE BACKUP, SCHEMA & APK BUILD INSTRUCTIONS */}
        {activeModule === 'settings' && (
          <div className="space-y-6 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  13. Website, Domain, Database Schema & Mobile APK Build Guide
                </h1>
                <p className="text-xs text-slate-500">
                  Manage domain routing, export full JSON database backups, and inspect production setup & Android/iOS APK packaging instructions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const backupPayload = {
                    backupTimestamp: new Date().toISOString(),
                    owner: settings.ownerName,
                    domain: settings.domain,
                    collections: {
                      platform_settings: settings,
                      retailers,
                      products,
                      referral_leads: referralLeads,
                      applications,
                      wallet_transactions: walletTransactions,
                      withdrawals,
                      notifications,
                      audit_logs: auditLogs,
                    },
                  };
                  const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `earn_foodexpres_db_backup_${new Date()
                    .toISOString()
                    .slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  showToast('Complete encrypted JSON database backup downloaded.');
                }}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Database className="w-4 h-4" />
                <span>Download Full Database Backup (JSON)</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">
                Domain Architecture & Platform Branding
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Owner Full Name
                  </label>
                  <input
                    type="text"
                    value={ownerNameInput}
                    onChange={(e) => setOwnerNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={platformNameInput}
                    onChange={(e) => setPlatformNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Primary Domain
                  </label>
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await onUpdateSettings(
                    {
                      ...settings,
                      ownerName: ownerNameInput.trim(),
                      platformName: platformNameInput.trim(),
                      domain: domainInput.trim(),
                      updatedAt: new Date().toISOString(),
                    },
                    'Updated platform branding and domain configuration'
                  );
                  showToast('Platform domain and branding settings updated.');
                }}
                className="px-5 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Save Platform Configuration
              </button>
            </div>

            {/* Deliverable 1: Subdomain & URL Routing Architecture */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Production Domain & Subdomain Architecture ({settings.domain})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-slate-200">
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="text-slate-400 text-[11px]">1. Main Website & Customer Landing</div>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    https://{settings.domain}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="text-slate-400 text-[11px]">2. Admin Control Dashboard</div>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    https://admin.{settings.domain}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="text-slate-400 text-[11px]">3. Backend API & Firestore Sync</div>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    https://api.{settings.domain}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700">
                  <div className="text-slate-400 text-[11px]">
                    4. Retailer Web Portal & Referral Attribution
                  </div>
                  <div className="text-emerald-400 font-bold mt-0.5">
                    https://{settings.domain}/retailer · /ref/FE1001
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverable 2: Production Database Schema (10 Collections) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-900" />
                <h3 className="text-base font-bold text-slate-900">
                  Production Database Schema & Security Blueprint (10 Collections)
                </h3>
              </div>
              <p className="text-xs text-slate-600">
                Enforced via deployed <code className="font-mono">firestore.rules</code> with strict Retailer data isolation (Retailer FE1001 can never read FE1002 or Admin data).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                {[
                  {
                    col: '1. platform_settings/{docId}',
                    fields:
                      'ownerName, platformName, domain, commonGromoUrl, gromoLinkActive, commissionType, retailerSharePercent (80), adminSharePercent (20), minWithdrawalAmount, roundingRule',
                  },
                  {
                    col: '2. retailers_public/{retailerId}',
                    fields:
                      'retailerId (FE1001..), name, status (Active/Inactive) — Publicly readable for /ref/FE1001 landing page validation without exposing PII',
                  },
                  {
                    col: '3. retailer_profiles/{uid}',
                    fields:
                      'uid, retailerId, name, mobile, city, upiId, status, customCommissionPercent, walletBalance, totalVerifiedEarnings, pendingEarnings, totalWithdrawn',
                  },
                  {
                    col: '4. products/{productId}',
                    fields:
                      'productId, title, category (9 categories), description, imageUrl, gromoAffiliateUrl, useCommonGromoUrl, subIdParamName, estimatedCommission, active',
                  },
                  {
                    col: '5. referral_leads/{referralRef}',
                    fields:
                      'referralRef (REF-YYYYMMDD-XXX), retailerId, retailerName, productId, customerName, customerMobile (10 digits), consentAccepted (true), sessionKey',
                  },
                  {
                    col: '6. applications/{applicationId}',
                    fields:
                      'applicationId, referralRef, customerName, productId, retailerId, status (Lead Generated/Applied/Pending/Successful/Rejected/Cancelled), gromoCommission, retailerCommission, adminCommission, verificationDate, gromoTxnRef, isUnmatched',
                  },
                  {
                    col: '7. wallet_transactions/{txnRef}',
                    fields:
                      'txnRef, retailerId, retailerUid, type (credit/debit), amount, balanceAfter, reason, applicationId, createdByAdmin',
                  },
                  {
                    col: '8. withdrawals/{withdrawalId}',
                    fields:
                      'withdrawalId, retailerId, retailerUid, amount, paymentMethod (UPI/Bank), status (Pending/Approved/Completed/Rejected), paymentRef (UTR), adminReason',
                  },
                  {
                    col: '9. notifications/{notificationId}',
                    fields:
                      'notificationId, targetRole (all/retailer/admin), targetUid, title, message, category, createdAt',
                  },
                  {
                    col: '10. audit_logs/{logId}',
                    fields:
                      'logId, actorEmail, actorName, action, details, createdAt — Admin-only immutable operational ledger',
                  },
                ].map((item) => (
                  <div
                    key={item.col}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                  >
                    <div className="font-bold text-slate-900">{item.col}</div>
                    <div className="text-[11px] text-slate-600 leading-relaxed">{item.fields}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverable 3: GitHub Actions Automated Cloud APK Builder for Zero Poisa */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={ZERO_POISA_LOGO}
                    alt="Zero Poisa APK Launcher Icon"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <h3 className="text-base font-bold text-slate-900">
                        Zero Poisa — Automated Android APK Build via GitHub Actions
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      App Name: <strong className="text-slate-900">Zero Poisa</strong> · Package ID:{' '}
                      <code className="font-mono text-emerald-700">in.foodexpres.zeropoisa</code> · Launcher Icon:{' '}
                      <code className="font-mono text-slate-700">zero_poisa_logo_1795587492543.jpg</code>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const yamlContent = `name: Build Zero Poisa Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:
    inputs:
      build_type:
        description: 'APK Build Variant (debug installs directly without keystore)'
        required: true
        default: 'debug'
        type: choice
        options:
          - debug
          - release

jobs:
  build-apk:
    name: Compile Zero Poisa Android APK (earn.foodexpres.in)
    runs-on: ubuntu-latest

    steps:
      - name: 1. Checkout Repository
        uses: actions/checkout@v4

      - name: 2. Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: 3. Setup Java JDK 21 (Required for Android Gradle Plugin)
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: 4. Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: 5. Install Web Dependencies & Build Production Bundle
        run: |
          npm install
          npm run build

      - name: 6. Install Capacitor Android & Sync Web Assets
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android --no-save
          if [ ! -d "android" ]; then
            npx cap add android
          fi
          npx cap sync android

      - name: 7. Apply Zero Poisa App Icon & App Name to Android Resources
        run: |
          LOGO_SRC="src/assets/images/zero_poisa_logo_1795587492543.jpg"
          RES_DIR="android/app/src/main/res"
          if [ -f "$LOGO_SRC" ] && [ -d "$RES_DIR" ]; then
            rm -rf "$RES_DIR/mipmap-anydpi-v26"
            for folder_size in "mipmap-mdpi:48" "mipmap-hdpi:72" "mipmap-xhdpi:96" "mipmap-xxhdpi:144" "mipmap-xxxhdpi:192"; do
              folder="\${folder_size%%:*}"
              size="\${folder_size##*:}"
              mkdir -p "$RES_DIR/$folder"
              convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher.png"
              convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher_round.png"
              convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher_foreground.png"
            done
          fi
          if [ -f "$RES_DIR/values/strings.xml" ]; then
            sed -i 's/<string name="app_name">.*<\\/string>/<string name="app_name">Zero Poisa<\\/string>/g' "$RES_DIR/values/strings.xml"
            sed -i 's/<string name="title_activity_main">.*<\\/string>/<string name="title_activity_main">Zero Poisa<\\/string>/g' "$RES_DIR/values/strings.xml"
          fi

      - name: 8. Make Gradle Wrapper Executable
        run: chmod +x ./android/gradlew

      - name: 9. Build Ready-to-Install Zero Poisa Debug APK
        run: |
          cd android
          ./gradlew assembleDebug
          cp app/build/outputs/apk/debug/app-debug.apk ../Zero-Poisa-Retailer-debug.apk

      - name: 10. Upload Zero Poisa Android APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Zero-Poisa-Android-APK
          path: Zero-Poisa-Retailer-debug.apk
          if-no-files-found: warn
          retention-days: 30`;
                      await navigator.clipboard.writeText(yamlContent);
                      showToast('Copied Zero Poisa .github/workflows/build-android-apk.yml to clipboard.');
                    }}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                  >
                    Copy GitHub Action YAML
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const yamlContent = `name: Build Zero Poisa Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Compile Zero Poisa Android APK (earn.foodexpres.in)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
      - uses: android-actions/setup-android@v3
      - run: |
          npm install
          npm run build
          npm install @capacitor/core @capacitor/cli @capacitor/android --no-save
          if [ ! -d "android" ]; then npx cap add android; fi
          npx cap sync android
          LOGO_SRC="src/assets/images/zero_poisa_logo_1795587492543.jpg"
          RES_DIR="android/app/src/main/res"
          if [ -f "$LOGO_SRC" ] && [ -d "$RES_DIR" ]; then
            rm -rf "$RES_DIR/mipmap-anydpi-v26"
            for folder_size in "mipmap-mdpi:48" "mipmap-hdpi:72" "mipmap-xhdpi:96" "mipmap-xxhdpi:144" "mipmap-xxxhdpi:192"; do
              folder="\${folder_size%%:*}"
              size="\${folder_size##*:}"
              mkdir -p "$RES_DIR/$folder"
              convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher.png"
              convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher_round.png"
              convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher_foreground.png"
            done
          fi
          chmod +x ./android/gradlew
          cd android && ./gradlew assembleDebug
          cp app/build/outputs/apk/debug/app-debug.apk ../Zero-Poisa-Retailer-debug.apk
      - uses: actions/upload-artifact@v4
        with:
          name: Zero-Poisa-Android-APK
          path: Zero-Poisa-Retailer-debug.apk`;
                      const blob = new Blob([yamlContent], { type: 'text/yaml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'build-android-apk.yml';
                      a.click();
                      URL.revokeObjectURL(url);
                      showToast('Downloaded Zero Poisa build-android-apk.yml workflow file.');
                    }}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Workflow (.yml)</span>
                  </button>
                </div>
              </div>

              {/* 3-Step Guide to Building Zero Poisa APK on GitHub */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-mono font-bold text-emerald-700">STEP 01 · PUSH TO GITHUB</div>
                  <div className="font-bold text-slate-900">Zero Poisa Icon & Config Included</div>
                  <p className="text-slate-600 leading-relaxed">
                    This repository includes <code className="font-mono">capacitor.config.json</code> (<code className="font-mono">appName: &quot;Zero Poisa&quot;</code>, <code className="font-mono">in.foodexpres.zeropoisa</code>) and the custom <code className="font-mono">zero_poisa_logo</code> asset.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-mono font-bold text-emerald-700">STEP 02 · RUN WORKFLOW</div>
                  <div className="font-bold text-slate-900">Auto-Generates Android Launcher Icons</div>
                  <p className="text-slate-600 leading-relaxed">
                    Open the <strong>Actions</strong> tab on GitHub and run <strong>Build Zero Poisa Android APK</strong>. Step 7 automatically resizes the Zero Poisa logo into all Android <code className="font-mono">mipmap-*</code> launcher icons.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-mono font-bold text-emerald-700">STEP 03 · DOWNLOAD APK</div>
                  <div className="font-bold text-slate-900">Install Zero Poisa on Android</div>
                  <p className="text-slate-600 leading-relaxed">
                    Download the <strong>Zero-Poisa-Android-APK</strong> artifact (<code className="font-mono">Zero-Poisa-Retailer-debug.apk</code>) from the completed workflow run and install it directly on your Android phone.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-900">
                  Included GitHub Action Workflow (<code className="font-mono">.github/workflows/build-android-apk.yml</code>):
                </div>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
{`name: Build Zero Poisa Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    name: Compile Zero Poisa Android APK (earn.foodexpres.in)
    runs-on: ubuntu-latest
    steps:
      - name: 1. Checkout Repository
        uses: actions/checkout@v4
      - name: 2. Setup Node.js 22 & Java JDK 21
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
      - name: 3. Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: 4. Build Web Bundle & Sync Capacitor Android
        run: |
          npm install
          npm run build
          npm install @capacitor/core @capacitor/cli @capacitor/android --no-save
          if [ ! -d "android" ]; then npx cap add android; fi
          npx cap sync android
      - name: 5. Apply Zero Poisa App Icon & App Name to Android Resources
        run: |
          LOGO_SRC="src/assets/images/zero_poisa_logo_1795587492543.jpg"
          RES_DIR="android/app/src/main/res"
          rm -rf "$RES_DIR/mipmap-anydpi-v26"
          for folder_size in "mipmap-mdpi:48" "mipmap-hdpi:72" "mipmap-xhdpi:96" "mipmap-xxhdpi:144" "mipmap-xxxhdpi:192"; do
            folder="\${folder_size%%:*}"
            size="\${folder_size##*:}"
            mkdir -p "$RES_DIR/$folder"
            convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher.png"
            convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher_round.png"
            convert "$LOGO_SRC" -resize "\${size}x\${size}!" "$RES_DIR/$folder/ic_launcher_foreground.png"
          done
      - name: 6. Compile Ready-to-Install Zero Poisa APK via Gradle
        run: |
          chmod +x ./android/gradlew
          cd android && ./gradlew assembleDebug
          cp app/build/outputs/apk/debug/app-debug.apk ../Zero-Poisa-Retailer-debug.apk
      - name: 7. Upload APK to GitHub Actions Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: Zero-Poisa-Android-APK
          path: Zero-Poisa-Retailer-debug.apk`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 14: ADMIN PROFILE */}
        {activeModule === 'profile' && (
          <div className="space-y-6 max-w-2xl">
            <h1 className="text-2xl font-bold text-slate-900">14. Owner & Admin Profile</h1>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Platform Owner:</span>
                <span className="font-bold text-slate-900">{settings.ownerName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Platform Name:</span>
                <span className="font-bold text-slate-900">{settings.platformName}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Primary Domain:</span>
                <span className="font-mono font-bold text-slate-900">{settings.domain}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Affiliate Provider:</span>
                <span className="font-semibold text-slate-900">
                  GroMo (Third-Party Authorized Partner Links)
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Authenticated Admin Email:</span>
                <span className="font-mono text-emerald-700">
                  {currentUserEmail || 'www.maa365@gmail.com (Owner Mode)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* MODULE 15: AUDIT LOGS */}
        {activeModule === 'audit_logs' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                15. Immutable Security & Operational Audit Logs ({auditLogs.length})
              </h1>
              <p className="text-xs text-slate-500">
                Every commission verification, wallet adjustment, withdrawal settlement, and link update is permanently recorded.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 bg-slate-50">
                      <th className="py-3 px-4">Log ID</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Verification Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.logId}>
                        <td className="py-3 px-4 font-mono text-slate-900">{log.logId}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {log.createdAt.slice(0, 19).replace('T', ' ')}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {log.actorName}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
