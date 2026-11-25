/**
 * Payload-First Security TDD specification verifying that all 12 "Dirty Dozen"
 * adversarial payloads against Affiliate Share & Earn Firestore rules are denied.
 */

export interface DirtyPayloadTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authUid: string | null;
  emailVerified: boolean;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyPayloadTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on Retailer Profile',
    collection: 'retailer_profiles/user_1',
    operation: 'update',
    authUid: 'user_1',
    emailVerified: true,
    payload: { isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unauthorized Wallet Balance Inflation by Retailer',
    collection: 'retailer_profiles/user_1',
    operation: 'update',
    authUid: 'user_1',
    emailVerified: true,
    payload: { walletBalance: 500000 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Admin Email Spoof',
    collection: 'platform_settings/global',
    operation: 'update',
    authUid: 'spoof_admin',
    emailVerified: false,
    payload: { retailerSharePercent: 100 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-Retailer PII Scrape',
    collection: 'retailer_profiles/user_2',
    operation: 'get',
    authUid: 'user_1',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unconsented Customer Referral Creation',
    collection: 'referral_leads/REF_101',
    operation: 'create',
    authUid: null,
    emailVerified: false,
    payload: { consentGiven: false, customerName: 'Test', customerMobile: '9876543210' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Oversized String DoS on Referral Lead',
    collection: 'referral_leads/REF_102',
    operation: 'create',
    authUid: null,
    emailVerified: false,
    payload: { customerName: 'A'.repeat(500), consentGiven: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'ID Poisoning Attack',
    collection: 'products/' + 'X'.repeat(200),
    operation: 'create',
    authUid: 'admin_1',
    emailVerified: true,
    payload: {},
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Fake Verified Application Injection by Retailer',
    collection: 'applications/APP_999',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: true,
    payload: { status: 'Successful', gromoCommission: 5000 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Fake Wallet Credit Ledger Entry by Retailer',
    collection: 'wallet_transactions/TXN_999',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: true,
    payload: { type: 'credit', amount: 10000 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Withdrawal Status Self-Approval by Retailer',
    collection: 'withdrawals/WDR_100',
    operation: 'update',
    authUid: 'user_1',
    emailVerified: true,
    payload: { status: 'Completed' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Negative Withdrawal Amount Request',
    collection: 'withdrawals/WDR_101',
    operation: 'create',
    authUid: 'user_1',
    emailVerified: true,
    payload: { amount: -1000, status: 'Pending' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Audit Log Tampering / Deletion',
    collection: 'audit_logs/LOG_100',
    operation: 'delete',
    authUid: 'admin_1',
    emailVerified: true,
    expectedResult: 'PERMISSION_DENIED',
  },
];
