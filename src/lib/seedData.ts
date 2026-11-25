import {
  PlatformSettings,
  Product,
  RetailerProfile,
  RetailerPublic,
  ReferralLead,
  ApplicationRecord,
  WalletTransaction,
  WithdrawalRequest,
  NotificationItem,
  AuditLog,
} from '../types';

export const ZERO_POISA_LOGO = '/src/assets/images/zero_poisa_logo_1795587492543.jpg';
export const HERO_BANNER_IMAGE = '/src/assets/images/hero_fintech_banner_1795422032731.jpg';
export const IMG_PERSONAL_LOAN = '/src/assets/images/product_personal_loan_1795422031908.jpg';
export const IMG_CREDIT_CARD = '/src/assets/images/product_credit_card_1795422031942.jpg';
export const IMG_SAVINGS_ACCOUNT = '/src/assets/images/product_savings_account_1795422032474.jpg';
export const IMG_DEMAT_ACCOUNT = '/src/assets/images/product_demat_account_1795422032046.jpg';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  ownerName: 'SANJIT BADYAKAR',
  platformName: 'Zero Poisa',
  domain: 'earn.foodexpres.in',
  commonGromoUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
  gromoLinkActive: true,
  commissionType: 'percentage',
  retailerSharePercent: 80,
  adminSharePercent: 20,
  fixedRetailerAmount: 500,
  minWithdrawalAmount: 500,
  roundingRule: 'nearest',
  effectiveDate: '2026-11-01',
  nextRetailerSeq: 1004,
  updatedAt: '2026-11-24T22:18:00Z',
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    productId: 'PROD_SAV_KOTAK',
    title: 'Kotak 811 Digital Zero-Balance Account',
    category: 'Saving A/c',
    description:
      'Open a zero-balance 811 digital savings account in 4 minutes via instant video KYC. Earn up to 7% p.a. with free virtual debit card.',
    imageUrl: IMG_SAVINGS_ACCOUNT,
    bannerTag: 'Kotak 811 · Zero Balance',
    buttonText: 'Open Saving A/c',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 675,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_INV_JIRAAF',
    title: 'Jiraaf High-Yield Fixed Income Bonds',
    category: 'Investment',
    description:
      'Invest in curated corporate bonds and fixed-income opportunities offering 10% to 14% annual yields with short-term tenures.',
    imageUrl: IMG_DEMAT_ACCOUNT,
    bannerTag: 'Jiraaf · Fixed Income Bonds',
    buttonText: 'Invest Now',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 2250,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_CC_02',
    title: 'Axis & HDFC Lifetime Free Platinum Credit Card',
    category: 'Credit Card',
    description:
      'Zero joining fee and zero annual fee platinum credit card with 5% cashback on utility bills, dining, and complimentary domestic lounge access.',
    imageUrl: IMG_CREDIT_CARD,
    bannerTag: 'Platinum · Lifetime Free',
    buttonText: 'Apply for Card',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 1500,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_LOAN_01',
    title: 'Instant Personal Loan',
    category: 'Loan',
    description:
      'Digital paperless personal credit facility from ₹50,000 up to ₹15,00,000 with flexible 12 to 60 month tenure and instant disbursal.',
    imageUrl: IMG_PERSONAL_LOAN,
    bannerTag: 'Up to 4.20% Payout · Instant',
    buttonText: 'Apply Now',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 1000,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_SEC_CARD_05',
    title: 'FD-Backed Instant Secured Credit Card',
    category: 'Secured Card',
    description:
      'Guaranteed approval credit card backed by fixed deposit with 90% credit limit, no CIBIL check required, and fast credit score building.',
    imageUrl: IMG_CREDIT_CARD,
    bannerTag: 'No CIBIL Required · 100% Approval',
    buttonText: 'Get Secured Card',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 2700,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_DEMAT_04',
    title: 'Zero-AMC Pro Demat & Trading Account',
    category: 'Demat A/c',
    description:
      'Start investing in equities, mutual funds, and IPOs with ₹0 account opening charge and flat ₹20 intraday brokerage.',
    imageUrl: IMG_DEMAT_ACCOUNT,
    bannerTag: 'Zero AMC · Instant Activation',
    buttonText: 'Open Demat A/c',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 500,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_CLINE_06',
    title: 'Flexi Pay-Later Revolving Credit Line',
    category: 'Credit Line',
    description:
      'Instant revolving credit line up to ₹5,00,000. Pay interest only on the amount utilized with zero foreclosure charges.',
    imageUrl: IMG_PERSONAL_LOAN,
    bannerTag: 'Up to 3.6% Payout · Zero Foreclosure',
    buttonText: 'Activate Credit Line',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 1200,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_DEALS_07',
    title: 'UPI & FastTag Instant Cashback Deals',
    category: 'Instant Deals',
    description:
      'Quick-activation merchant QR, FastTag, and micro-insurance protection plans with same-week verified commission settlement.',
    imageUrl: IMG_SAVINGS_ACCOUNT,
    bannerTag: 'Quick Activation · High Conversion',
    buttonText: 'Claim Deal',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 900,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    productId: 'PROD_BIZ_LOAN_08',
    title: 'MSME & Shopkeeper Business Growth Loan',
    category: 'Business Loan',
    description:
      'Collateral-free business working capital loan up to ₹25,00,000 for retailers, shopkeepers, and GST-registered enterprises.',
    imageUrl: IMG_PERSONAL_LOAN,
    bannerTag: 'Up to 2.4% Payout · Collateral Free',
    buttonText: 'Apply Business Loan',
    gromoAffiliateUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    useCommonGromoUrl: true,
    subIdParamName: '',
    estimatedCommission: 2500,
    commissionType: 'default',
    retailerCommissionValue: 80,
    active: true,
    updatedAt: '2026-11-23T08:00:00Z',
  },
];

export const INITIAL_RETAILERS_PUBLIC: RetailerPublic[] = [
  {
    retailerId: 'FE1001',
    uid: 'seed_retailer_fe1001',
    name: 'Sanjit Badyakar',
    status: 'active',
    createdAt: '2026-11-01T10:00:00Z',
  },
  {
    retailerId: 'FE1002',
    uid: 'seed_retailer_fe1002',
    name: 'Arindam Chatterjee',
    status: 'active',
    createdAt: '2026-11-05T11:30:00Z',
  },
  {
    retailerId: 'FE1003',
    uid: 'seed_retailer_fe1003',
    name: 'Moumita Das',
    status: 'active',
    createdAt: '2026-11-10T14:15:00Z',
  },
];

export const INITIAL_RETAILER_PROFILES: RetailerProfile[] = [
  {
    uid: 'seed_retailer_fe1001',
    retailerId: 'FE1001',
    name: 'Sanjit Badyakar',
    mobile: '9830112233',
    email: 'sanjit.fe1001@foodexpres.in',
    city: 'Kolkata, West Bengal',
    upiId: 'sanjit.fe1001@okaxis',
    status: 'active',
    customCommissionPercent: -1,
    walletBalance: 2000,
    pendingEarnings: 800,
    totalVerifiedEarnings: 2800,
    totalWithdrawn: 800,
    totalClicks: 42,
    totalReferrals: 8,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-23T08:00:00Z',
  },
  {
    uid: 'seed_retailer_fe1002',
    retailerId: 'FE1002',
    name: 'Arindam Chatterjee',
    mobile: '9831445566',
    email: 'arindam.fe1002@foodexpres.in',
    city: 'Durgapur, West Bengal',
    upiId: 'arindam9831@ybl',
    status: 'active',
    customCommissionPercent: -1,
    walletBalance: 1200,
    pendingEarnings: 360,
    totalVerifiedEarnings: 1200,
    totalWithdrawn: 0,
    totalClicks: 29,
    totalReferrals: 5,
    createdAt: '2026-11-05T11:30:00Z',
    updatedAt: '2026-11-22T15:00:00Z',
  },
  {
    uid: 'seed_retailer_fe1003',
    retailerId: 'FE1003',
    name: 'Moumita Das',
    mobile: '9874778899',
    email: 'moumita.fe1003@foodexpres.in',
    city: 'Siliguri, West Bengal',
    upiId: 'moumita.das@okicici',
    status: 'active',
    customCommissionPercent: 85,
    walletBalance: 680,
    pendingEarnings: 0,
    totalVerifiedEarnings: 680,
    totalWithdrawn: 0,
    totalClicks: 18,
    totalReferrals: 3,
    createdAt: '2026-11-10T14:15:00Z',
    updatedAt: '2026-11-21T16:40:00Z',
  },
];

export const INITIAL_REFERRAL_LEADS: ReferralLead[] = [
  {
    referralRef: 'REF-20261123-101',
    retailerId: 'FE1001',
    retailerUid: 'seed_retailer_fe1001',
    retailerName: 'Sanjit Badyakar',
    productId: 'PROD_LOAN_01',
    productTitle: 'Instant Personal Loan',
    customerName: 'Rani Barman',
    customerMobile: '9832109876',
    otpStatus: 'Verified',
    otpVerifiedAt: '2026-11-23T06:30:12Z',
    consentGiven: true,
    consentTimestamp: '2026-11-23T06:30:00Z',
    sessionHash: 'FE1001_PROD_LOAN_01_9832109876',
    status: 'Successful',
    targetGromoUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    createdAt: '2026-11-23T06:30:00Z',
  },
  {
    referralRef: 'REF-20261122-102',
    retailerId: 'FE1001',
    retailerUid: 'seed_retailer_fe1001',
    retailerName: 'Sanjit Badyakar',
    productId: 'PROD_CC_02',
    productTitle: 'Lifetime Free Platinum Credit Card',
    customerName: 'Subrata Mondal',
    customerMobile: '9830554433',
    otpStatus: 'Verified',
    otpVerifiedAt: '2026-11-22T12:15:18Z',
    consentGiven: true,
    consentTimestamp: '2026-11-22T12:15:00Z',
    sessionHash: 'FE1001_PROD_CC_02_9830554433',
    status: 'Pending',
    targetGromoUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    createdAt: '2026-11-22T12:15:00Z',
  },
  {
    referralRef: 'REF-20261121-103',
    retailerId: 'FE1002',
    retailerUid: 'seed_retailer_fe1002',
    retailerName: 'Arindam Chatterjee',
    productId: 'PROD_CC_02',
    productTitle: 'Lifetime Free Platinum Credit Card',
    customerName: 'Debashis Ghosh',
    customerMobile: '9831223344',
    otpStatus: 'Verified',
    otpVerifiedAt: '2026-11-21T09:40:25Z',
    consentGiven: true,
    consentTimestamp: '2026-11-21T09:40:00Z',
    sessionHash: 'FE1002_PROD_CC_02_9831223344',
    status: 'Successful',
    targetGromoUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    createdAt: '2026-11-21T09:40:00Z',
  },
  {
    referralRef: 'REF-20261120-104',
    retailerId: 'FE1003',
    retailerUid: 'seed_retailer_fe1003',
    retailerName: 'Moumita Das',
    productId: 'PROD_SAV_KOTAK',
    productTitle: 'Zero-Balance Digital Savings Account',
    customerName: 'Priyanka Sarkar',
    customerMobile: '9874112299',
    otpStatus: 'Not Verified',
    otpVerifiedAt: '',
    consentGiven: true,
    consentTimestamp: '2026-11-20T17:10:00Z',
    sessionHash: 'FE1003_PROD_SAV_03_9874112299',
    status: 'Lead Generated',
    targetGromoUrl: 'https://sales.gromo.in/ac/b2y6--aLD8',
    createdAt: '2026-11-20T17:10:00Z',
  },
];

export const INITIAL_APPLICATIONS: ApplicationRecord[] = [
  {
    applicationId: 'APP-20261123-001',
    referralRef: 'REF-20261123-101',
    customerName: 'Rani Barman',
    customerMobile: '9832109876',
    productId: 'PROD_LOAN_01',
    productTitle: 'Personal Loan',
    retailerId: 'FE1001',
    retailerUid: 'seed_retailer_fe1001',
    retailerName: 'Sanjit Badyakar',
    status: 'Successful',
    gromoCommission: 1000,
    retailerCommission: 800,
    adminCommission: 200,
    gromoTxnRef: 'GRM-20261123-8841',
    verificationDate: '2026-11-23',
    adminNotes: 'Verified against GroMo partner payout report on 23 November 2026.',
    isUnmatched: false,
    walletCredited: true,
    createdAt: '2026-11-23T06:30:00Z',
    updatedAt: '2026-11-23T08:15:00Z',
  },
  {
    applicationId: 'APP-20261122-002',
    referralRef: 'REF-20261122-102',
    customerName: 'Subrata Mondal',
    customerMobile: '9830554433',
    productId: 'PROD_CC_02',
    productTitle: 'Lifetime Free Platinum Credit Card',
    retailerId: 'FE1001',
    retailerUid: 'seed_retailer_fe1001',
    retailerName: 'Sanjit Badyakar',
    status: 'Pending',
    gromoCommission: 1000,
    retailerCommission: 800,
    adminCommission: 200,
    gromoTxnRef: 'GRM-20261122-7712',
    verificationDate: '2026-11-22',
    adminNotes: 'Card KYC submitted on GroMo; awaiting bank final approval.',
    isUnmatched: false,
    walletCredited: false,
    createdAt: '2026-11-22T12:15:00Z',
    updatedAt: '2026-11-22T14:00:00Z',
  },
  {
    applicationId: 'APP-20261121-003',
    referralRef: 'REF-20261121-103',
    customerName: 'Debashis Ghosh',
    customerMobile: '9831223344',
    productId: 'PROD_CC_02',
    productTitle: 'Lifetime Free Platinum Credit Card',
    retailerId: 'FE1002',
    retailerUid: 'seed_retailer_fe1002',
    retailerName: 'Arindam Chatterjee',
    status: 'Successful',
    gromoCommission: 1500,
    retailerCommission: 1200,
    adminCommission: 300,
    gromoTxnRef: 'GRM-20261121-6509',
    verificationDate: '2026-11-21',
    adminNotes: 'Verified card activation commission received from GroMo.',
    isUnmatched: false,
    walletCredited: true,
    createdAt: '2026-11-21T09:40:00Z',
    updatedAt: '2026-11-21T18:00:00Z',
  },
  {
    applicationId: 'APP-20261122-004',
    referralRef: 'UNMATCHED',
    customerName: 'Unidentified GroMo Lead #409',
    customerMobile: 'N/A',
    productId: 'PROD_SAV_03',
    productTitle: 'Zero-Balance Digital Savings Account',
    retailerId: 'UNASSIGNED',
    retailerUid: 'UNASSIGNED',
    retailerName: 'Unmatched GroMo Commission',
    status: 'Successful',
    gromoCommission: 450,
    retailerCommission: 360,
    adminCommission: 90,
    gromoTxnRef: 'GRM-20261122-9901',
    verificationDate: '2026-11-22',
    adminNotes: 'GroMo bulk payout entry without customer mobile identifier. Held in Unmatched queue for manual verification.',
    isUnmatched: true,
    walletCredited: false,
    createdAt: '2026-11-22T19:00:00Z',
    updatedAt: '2026-11-22T19:00:00Z',
  },
];

export const INITIAL_WALLET_TRANSACTIONS: WalletTransaction[] = [
  {
    txnRef: 'TXN-20261123-8841',
    retailerId: 'FE1001',
    retailerUid: 'seed_retailer_fe1001',
    retailerName: 'Sanjit Badyakar',
    type: 'credit',
    amount: 800,
    balanceAfter: 2000,
    reason: 'Verified GroMo Commission (80% of ₹1,000) for Rani Barman — Personal Loan',
    relatedAppId: 'APP-20261123-001',
    createdBy: 'Admin (SANJIT BADYAKAR)',
    createdAt: '2026-11-23T08:15:00Z',
  },
  {
    txnRef: 'TXN-20261121-6509',
    retailerId: 'FE1002',
    retailerUid: 'seed_retailer_fe1002',
    retailerName: 'Arindam Chatterjee',
    type: 'credit',
    amount: 1200,
    balanceAfter: 1200,
    reason: 'Verified GroMo Commission (80% of ₹1,500) for Debashis Ghosh — Credit Card',
    relatedAppId: 'APP-20261121-003',
    createdBy: 'Admin (SANJIT BADYAKAR)',
    createdAt: '2026-11-21T18:00:00Z',
  },
];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    withdrawalId: 'WDR-20261122-501',
    retailerId: 'FE1001',
    retailerUid: 'seed_retailer_fe1001',
    retailerName: 'Sanjit Badyakar',
    amount: 800,
    paymentMethod: 'UPI: sanjit.fe1001@okaxis',
    status: 'Completed',
    paymentRef: 'UTR632798114502',
    adminReason: 'Settled via IMPS/UPI payout',
    requestedAt: '2026-11-18T11:00:00Z',
    updatedAt: '2026-11-18T16:30:00Z',
  },
  {
    withdrawalId: 'WDR-20261123-502',
    retailerId: 'FE1002',
    retailerUid: 'seed_retailer_fe1002',
    retailerName: 'Arindam Chatterjee',
    amount: 700,
    paymentMethod: 'UPI: arindam9831@ybl',
    status: 'Pending',
    paymentRef: '',
    adminReason: 'Awaiting evening batch payout release',
    requestedAt: '2026-11-23T07:45:00Z',
    updatedAt: '2026-11-23T07:45:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    notificationId: 'NOTIF-20261123-01',
    targetUid: 'seed_retailer_fe1001',
    targetRole: 'all',
    title: 'GroMo Verification Completed — 23 Nov 2026',
    message:
      'Verified GroMo commission for Rani Barman (Personal Loan — ₹1,000) has been processed. ₹800 retailer share credited to FE1001 wallet.',
    category: 'Verification',
    createdAt: '2026-11-23T08:15:00Z',
  },
  {
    notificationId: 'NOTIF-20261122-02',
    targetUid: 'all',
    targetRole: 'all',
    title: 'Updated Payout Schedule & Minimum Withdrawal',
    message:
      'All verified GroMo commissions are credited after daily admin reconciliation. Minimum wallet withdrawal threshold is ₹500 via UPI/IMPS.',
    category: 'Announcement',
    createdAt: '2026-11-22T10:00:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    logId: 'LOG-20261123-01',
    actorUid: 'admin_sanjit',
    actorName: 'SANJIT BADYAKAR (Owner)',
    action: 'GROMO_COMMISSION_VERIFIED',
    details:
      'Verified APP-20261123-001 (Customer: Rani Barman, Product: Personal Loan, Retailer: FE1001). Total GroMo Commission: ₹1,000 -> Retailer Share: ₹800, Admin Share: ₹200.',
    createdAt: '2026-11-23T08:15:00Z',
  },
  {
    logId: 'LOG-20261122-02',
    actorUid: 'admin_sanjit',
    actorName: 'SANJIT BADYAKAR (Owner)',
    action: 'UNMATCHED_COMMISSION_LOGGED',
    details:
      'Recorded unmatched GroMo payout GRM-20261122-9901 (₹450) in Unmatched Commission queue without guessing retailer attribution.',
    createdAt: '2026-11-22T19:00:00Z',
  },
];

export function calculateCommissionSplit(
  gromoCommission: number,
  settings: PlatformSettings,
  product?: Product | null,
  retailer?: RetailerProfile | null
): { retailerCommission: number; adminCommission: number; appliedRuleLabel: string } {
  if (gromoCommission <= 0) {
    return { retailerCommission: 0, adminCommission: 0, appliedRuleLabel: 'Zero Commission' };
  }

  let rawRetailer = 0;
  let appliedRuleLabel = `Global (${settings.retailerSharePercent}% Retailer / ${settings.adminSharePercent}% Admin)`;

  // 1. Retailer-specific custom commission override takes highest priority if set (>= 0)
  if (retailer && retailer.customCommissionPercent >= 0) {
    rawRetailer = (gromoCommission * retailer.customCommissionPercent) / 100;
    appliedRuleLabel = `Retailer Custom (${retailer.retailerId}: ${retailer.customCommissionPercent}%)`;
  } else if (product && product.commissionType !== 'default') {
    // 2. Product-specific commission rule
    if (product.commissionType === 'percentage') {
      rawRetailer = (gromoCommission * product.retailerCommissionValue) / 100;
      appliedRuleLabel = `Product Rule (${product.retailerCommissionValue}%)`;
    } else {
      rawRetailer = Math.min(gromoCommission, product.retailerCommissionValue);
      appliedRuleLabel = `Product Fixed (₹${product.retailerCommissionValue})`;
    }
  } else {
    // 3. Global default setting
    if (settings.commissionType === 'percentage') {
      rawRetailer = (gromoCommission * settings.retailerSharePercent) / 100;
      appliedRuleLabel = `Global Split (${settings.retailerSharePercent}% / ${settings.adminSharePercent}%)`;
    } else {
      rawRetailer = Math.min(gromoCommission, settings.fixedRetailerAmount);
      appliedRuleLabel = `Global Fixed (₹${settings.fixedRetailerAmount})`;
    }
  }

  let retailerCommission = rawRetailer;
  if (settings.roundingRule === 'floor') {
    retailerCommission = Math.floor(rawRetailer);
  } else if (settings.roundingRule === 'ceil') {
    retailerCommission = Math.ceil(rawRetailer);
  } else {
    retailerCommission = Math.round(rawRetailer);
  }

  retailerCommission = Math.max(0, Math.min(gromoCommission, retailerCommission));
  const adminCommission = Math.max(0, gromoCommission - retailerCommission);

  return { retailerCommission, adminCommission, appliedRuleLabel };
}
