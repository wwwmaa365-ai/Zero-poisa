export interface PlatformSettings {
  ownerName: string;
  platformName: string;
  domain: string;
  commonGromoUrl: string;
  gromoLinkActive: boolean;
  commissionType: 'percentage' | 'fixed';
  retailerSharePercent: number;
  adminSharePercent: number;
  fixedRetailerAmount: number;
  minWithdrawalAmount: number;
  roundingRule: 'nearest' | 'floor' | 'ceil';
  effectiveDate: string;
  nextRetailerSeq: number;
  updatedAt: string;
}

export interface RetailerPublic {
  retailerId: string;
  uid: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface RetailerProfile {
  uid: string;
  retailerId: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  upiId: string;
  status: 'active' | 'inactive';
  customCommissionPercent: number; // -1 uses global/product default
  walletBalance: number;
  pendingEarnings: number;
  totalVerifiedEarnings: number;
  totalWithdrawn: number;
  totalClicks: number;
  totalReferrals: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  productId: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  bannerTag: string;
  buttonText: string;
  gromoAffiliateUrl: string;
  useCommonGromoUrl: boolean;
  subIdParamName: string; // Optional GroMo-approved sub-ID parameter name; empty if unsupported
  estimatedCommission: number;
  commissionType: 'default' | 'percentage' | 'fixed';
  retailerCommissionValue: number;
  active: boolean;
  updatedAt: string;
}

export type ApplicationStatus =
  | 'Clicked'
  | 'Lead Generated'
  | 'Applied'
  | 'Pending'
  | 'Successful'
  | 'Rejected'
  | 'Cancelled';

export interface ReferralLead {
  referralRef: string;
  retailerId: string;
  retailerUid: string;
  retailerName: string;
  productId: string;
  productTitle: string;
  customerName: string;
  customerMobile: string;
  otpStatus: 'Verified' | 'Not Verified';
  otpVerifiedAt: string;
  consentGiven: boolean;
  consentTimestamp: string;
  sessionHash: string;
  status: ApplicationStatus;
  targetGromoUrl: string;
  createdAt: string;
}

export interface ApplicationRecord {
  applicationId: string;
  referralRef: string;
  customerName: string;
  customerMobile: string;
  productId: string;
  productTitle: string;
  retailerId: string;
  retailerUid: string;
  retailerName: string;
  status: ApplicationStatus;
  gromoCommission: number;
  retailerCommission: number;
  adminCommission: number;
  gromoTxnRef: string;
  verificationDate: string;
  adminNotes: string;
  isUnmatched: boolean;
  walletCredited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  txnRef: string;
  retailerId: string;
  retailerUid: string;
  retailerName: string;
  type: 'credit' | 'debit' | 'withdrawal';
  amount: number;
  balanceAfter: number;
  reason: string;
  relatedAppId: string;
  createdBy: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  withdrawalId: string;
  retailerId: string;
  retailerUid: string;
  retailerName: string;
  amount: number;
  paymentMethod: string;
  status: 'Pending' | 'Approved' | 'Completed' | 'Rejected';
  paymentRef: string;
  adminReason: string;
  requestedAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  notificationId: string;
  targetUid: string;
  targetRole: 'all' | 'admin' | 'retailer';
  title: string;
  message: string;
  category: string;
  createdAt: string;
}

export interface AuditLog {
  logId: string;
  actorUid: string;
  actorName: string;
  action: string;
  details: string;
  createdAt: string;
}

export type EmailTemplateId = 'COMMISSION_CREDITED' | 'WITHDRAWAL_STATUS_UPDATED';

export interface EmailTemplate {
  templateId: EmailTemplateId;
  name: string;
  triggerDescription: string;
  subjectTemplate: string;
  bodyTemplate: string;
  availableVariables: string[];
  updatedAt: string;
}

export interface EmailLogItem {
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

