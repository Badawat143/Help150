# Security Specification: HELP150 Firestore Rules

## 1. Data Invariants

1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified by the authenticated owner whose UID matches `{userId}`, or by a verified administrator (`ashuk2968@gmail.com`).
2. **Role Privilege Escalation Invariant**: A regular user can never set or escalate their own `role` to `admin`, `compliance_officer`, or `finance_admin`.
3. **Wallet Integrity Invariant**: Wallets at `/wallets/{walletId}` belong strictly to `{userId}` where `walletId == userId`. Regular users cannot modify financial balance amounts arbitrarily; balance adjustments must only occur through verified transaction updates.
4. **Peer Help Invariant**: A `helpRequest` must have a valid creator `userId == request.auth.uid` on creation. Counterparty matching and proof updates cannot overwrite creator ownership or alter the fundamental amount.
5. **Ledger Immutability Invariant**: A transaction document at `/transactions/{transactionId}` once written is immutable (`allow update: if false;`). It can only be created with `userId == request.auth.uid` or by admin.
6. **KYC Privacy Invariant**: Personally Identifiable Information (Aadhaar, PAN, Bank Details) in `/kycRecords/{kycRecordId}` is readable ONLY by the record owner (`userId == request.auth.uid`) and verified administrators. No public or blanket reads.
7. **Withdrawal Invariant**: A withdrawal request can only be submitted by the owning authenticated user (`userId == request.auth.uid`) with valid status `pending`. Status progression to `processed` or `rejected` is restricted to admins.
8. **Settings Guard Invariant**: Application configurations in `/settings/{settingId}` are publicly readable for platform parameters, but writable ONLY by verified administrators.
9. **Audit Logs Invariant**: Audit records at `/auditLogs/{auditLogId}` are append-only by authenticated actors and readable only by admins.
10. **Notification Invariant**: Notifications are only readable by their recipient (`resource.data.userId == request.auth.uid || resource.data.userId == 'all'`).

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 (Identity Spoofing on User Create)**: Attacker attempts to create `/users/victim_uid` with `request.auth.uid = attacker_uid`.
   - *Result*: PERMISSION_DENIED.

2. **Payload 2 (Self-Assigned Admin Role)**: Attacker creates `/users/{attacker_uid}` specifying `"role": "admin"`.
   - *Result*: PERMISSION_DENIED.

3. **Payload 3 (Shadow Update / Ghost Field)**: Attacker sends an update to their user profile with extra field `{"isSuperUser": true}`.
   - *Result*: PERMISSION_DENIED (Strict key enforcement via `affectedKeys().hasOnly()`).

4. **Payload 4 (Direct Wallet Balance Poisoning)**: User sends an update to `/wallets/{user_id}` setting `"availableBalance": 9999999`.
   - *Result*: PERMISSION_DENIED.

5. **Payload 5 (KYC PII Blanket Snooping)**: Attacker performs `get` on `/kycRecords/victim_kyc` without owning the record.
   - *Result*: PERMISSION_DENIED.

6. **Payload 6 (Help Request Amount Tampering)**: Counterparty user updates `/helpRequests/{req_id}` changing `"amount": 50` or changing `"userId"`.
   - *Result*: PERMISSION_DENIED (Amount and creator immutable).

7. **Payload 7 (Transaction Forgery/Alteration)**: User attempts `update` or `delete` on an existing ledger transaction `/transactions/{tx_id}`.
   - *Result*: PERMISSION_DENIED (Transactions are immutable once created).

8. **Payload 8 (Withdrawal State Short-Circuit)**: User attempts to update their own withdrawal status from `"pending"` to `"completed"`.
   - *Result*: PERMISSION_DENIED (Only admins can mark processed/completed).

9. **Payload 9 (Settings Tampering)**: Regular user writes to `/settings/global` changing UPI ID to an attacker account.
   - *Result*: PERMISSION_DENIED (Only admin write permitted).

10. **Payload 10 (ID Poisoning / Huge ID Attack)**: Attacker attempts to create a document with a 2KB malicious ID string.
    - *Result*: PERMISSION_DENIED (`isValidId()` bounds string length <= 128 and strict regex).

11. **Payload 11 (Denial-of-Wallet String Bomb)**: User attempts to write 50KB string into `fullName` or `remarks`.
    - *Result*: PERMISSION_DENIED (Strict `.size()` limits on all string fields).

12. **Payload 12 (Email Spoofing Attack)**: Attacker sets Firebase email to `ashuk2968@gmail.com` with `email_verified == false`.
    - *Result*: PERMISSION_DENIED (`request.auth.token.email_verified == true` enforced).
