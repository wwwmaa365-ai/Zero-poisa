# Security Specification — Affiliate Share & Earn (`earn.foodexpres.in`)

## 1. Data Invariants
1. **Default-Deny & Verified Auth**: All unauthenticated requests are rejected except for public product catalog reading (`/products/{productId}`), platform basic configuration (`/platform_settings/{settingId}`), public retailer attribution badge (`/retailers_public/{retailerId}`), and customer referral attribution creation (`/referral_leads/{referralRef}`) which requires explicit customer consent (`consentGiven == true`).
2. **PII Isolation (Split Collection Strategy)**:
   - `/retailers_public/{retailerId}` stores ONLY non-PII attribution metadata (`retailerId`, `uid`, `name`, `status`, `createdAt`) so referral landing pages (`/ref/FE1001`) can validate a retailer code without exposing phone numbers, emails, UPI IDs, or wallet balances.
   - `/retailer_profiles/{uid}` stores full PII (`mobile`, `email`, `upiId`) and financial wallet balances (`walletBalance`, `pendingEarnings`, `totalVerifiedEarnings`) and is strictly readable only by `request.auth.uid == uid` or `isAdmin()`.
3. **Wallet & Commission Integrity**:
   - Retailers can NEVER directly edit `walletBalance`, `pendingEarnings`, `totalVerifiedEarnings`, `totalWithdrawn`, or `customCommissionPercent` on `/retailer_profiles/{uid}`. Only `isAdmin()` can modify wallet balances or commission rates.
   - `/wallet_transactions/{txnRef}` and `/applications/{applicationId}` can only be created or mutated by `isAdmin()`. Retailers have read-only access to their own records (`resource.data.retailerUid == request.auth.uid`).
4. **Secure List Queries (Pillar 8)**:
   - Retailers listing `/referral_leads`, `/applications`, `/wallet_transactions`, or `/withdrawals` MUST filter by `resource.data.retailerUid == request.auth.uid`. Blanket `allow list: if isSignedIn()` is strictly prohibited on PII/financial collections.
5. **Strict Key & Size Enforcement (Pillar 2 & 3)**:
   - Every string field enforces `.size() <= maxLength` matching `firebase-blueprint.json`.
   - Every document ID is checked via `isValidId(id)`.
   - Every `create` and `update` invokes `isValid[Entity](incoming())` checking `keys().hasAll(...)` and `keys().hasOnly(...)`.

## 2. The "Dirty Dozen" Payloads
1. **Shadow Field Injection on Retailer Profile**: Retailer attempts to add `isAdmin: true` to `/retailer_profiles/{uid}`. Rejected by `hasOnly()`.
2. **Unauthorized Wallet Inflation**: Retailer attempts to update `walletBalance: 999999` on their own `/retailer_profiles/{uid}`. Rejected by tiered update action restricting retailer self-updates to `['name', 'mobile', 'city', 'upiId', 'updatedAt']` while requiring `walletBalance == existing().walletBalance`.
3. **Unverified Admin Email Spoof**: Attacker signs in with an unverified token matching `www.maa365@gmail.com` (`email_verified: false`). Rejected by `request.auth.token.email_verified == true`.
4. **Cross-Retailer PII Scrape**: Retailer A (`uid_A`) attempts `get` or `list` on Retailer B's `/retailer_profiles/uid_B` or `/referral_leads`. Rejected by `resource.data.retailerUid == request.auth.uid`.
5. **Unconsented Customer Referral Creation**: Customer submits `/referral_leads/{ref}` with `consentGiven: false`. Rejected by `data.consentGiven == true`.
6. **Oversized String DoS (Denial of Wallet)**: Attacker submits a 50KB `customerName` in `/referral_leads/{ref}`. Rejected by `data.customerName.size() <= 100`.
7. **ID Poisoning Attack**: Attacker creates a document with special path characters or >128 chars ID. Rejected by `isValidId()`.
8. **Fake Verified Application Injection**: Retailer attempts to create a `Successful` application in `/applications/{appId}`. Rejected because only `isAdmin()` can create or update `/applications`.
9. **Fake Wallet Credit Ledger Entry**: Retailer attempts to write a credit transaction into `/wallet_transactions/{txnRef}`. Rejected because only `isAdmin()` can write to `/wallet_transactions`.
10. **Withdrawal Status Self-Approval**: Retailer attempts to update their withdrawal status from `Pending` to `Completed` in `/withdrawals/{id}`. Rejected because only `isAdmin()` can update `/withdrawals`.
11. **Negative or Zero Withdrawal Request**: Retailer creates a withdrawal request with `amount: -500`. Rejected by `data.amount > 0`.
12. **Audit Log Tampering**: User or Admin attempts to `delete` or `update` an existing `/audit_logs/{logId}` entry. Rejected by `allow update, delete: if false;`.
