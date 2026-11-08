# TrustVault Development Prompt History & Security Audit (PROMPTS.md)

This log records the adversarial evolution of TrustVault, documenting key AI interactions, the critical security defects identified in initial AI-generated implementations, and the concrete architectural fixes enforced across the codebase.

---

## Reusable Context & System Instructions

Across development, the following adversarial prompt prefix was injected into development queries to constrain the AI:

```markdown
SECURITY CONSTITUTION & PERMISSION BOUNDARIES:
1. Server is the sole authority: The frontend is an untrusted presentation layer. Never rely on button disabling, hidden tabs, or client-side validation for access control.
2. Immediate Revocation: Revocation must be instantaneous and globally consistent across all endpoints. No un-revokable bearer claims or stale caches.
3. Cryptographic Audit Immutability: Every access attempt (successful or refused) must be recorded in an append-only, tamper-evident ledger.
4. AI Access Control Boundary: The machine suggests; the human decides. The AI must never widen access or alter permissions autonomously.
```

---

## Dated Adversarial Prompt Logs

### Entry 1: Initial Schema & Role-Based Authorization
- **Date**: 2026-11-01
- **Commit Reference**: [`a9cec7a`](https://github.com/trustvault/trustvault/commit/a9cec7a) - `feat(auth): initialize schema and role-based access control`
- **Prompt / Request**:
  > "Generate the SQLite schema and Express registration endpoint for TrustVault with three roles: Admin, Document Owner, and Viewer. Allow users to register with their desired role or default to Viewer. Create an AuditLogs table to record document access."
- **What it Produced**:
  The AI produced a `users` table accepting a `role` parameter directly from `req.body.role`, defaulting to `'viewer'`. In the audit table, it provided standard columns (`id, user_id, action, timestamp`), with basic `INSERT INTO audit_logs` on download.
- **What Was Wrong With It (Specifically)**:
  1. **Mass Assignment / Privilege Escalation**: Allowing `req.body.role` allowed any attacker to send `{"role": "admin"}` in the registration JSON and instantly become Super Admin.
  2. **Audit Trail Mutability**: The audit table had no protections against `UPDATE` or `DELETE` statements. Anyone with SQL injection or admin credentials could execute `DELETE FROM audit_logs WHERE user_id = ...` to wipe forensic evidence.
  3. **Silent Omission of Failures**: The audit logger was only called upon successful downloads; rejected attempts were dropped without logging.
- **What We Did Instead (Fix & Code Reference)**:
  - In `src/server/api.ts` (lines 40–80): Completely discarded `req.body.role`. Enforced that only an email strictly matching `ADMIN_EMAIL` (`harshavdugga@gmail.com`) can ever receive the `'admin'` role; all other registrations are hard-assigned `'user'`.
  - In `src/server/db.ts` (lines 145–165): Installed SQLite abort triggers `prevent_audit_update` and `prevent_audit_delete` to prevent row modifications.
  - In `src/server/db.ts` (lines 85–115): Implemented `COLLATE NOCASE UNIQUE` constraint on email to prevent casing bypasses.

---

### Entry 2: Token Lifecycle & Immediate Permission Revocation
- **Date**: 2026-11-03
- **Commit Reference**: [`4cb89f0`](https://github.com/trustvault/trustvault/commit/4cb89f0) - `feat(auth): enforce immediate permission revocation and live ACL validation`
- **Prompt / Request**:
  > "Implement JWT authentication for document downloads. Issue a 1-hour signed JWT containing user permissions when they log in, and use that JWT to authorize document downloads in Express."
- **What it Produced**:
  The AI generated a standard stateless JWT implementation where user permissions (e.g. `allowed_docs: [1, 2, 3]`) were baked directly into the JWT payload. The download route verified the JWT signature and checked `payload.allowed_docs.includes(docId)`.
- **What Was Wrong With It (Specifically - Auth/Access Control Focus)**:
  1. **Violation of Tenet 3 (Immediate Revocation)**: If an owner revoked a collaborator's access at 12:00:00, the collaborator's JWT remained valid until 13:00:00. The user could continue downloading confidential documents for a full hour after being removed.
  2. **Stale Permission State**: If a document was deleted or marked restricted, existing issued tokens continued to provide unauthorized read access.
  3. **Revocation Blacklist Vulnerability**: Storing revoked tokens in memory failed across server restarts or multi-process instances.
- **What We Did Instead (Fix & Code Reference)**:
  - Completely rejected stateless permission tokens for authorization decisions.
  - In `src/server/api.ts` and `src/server/db.ts`: Implemented database-backed session validation and synchronous permission resolution via `getUserDocAccessLevel(userId, docId)`. Every document access query executes an index-backed `SELECT access_level FROM DocumentPermissions WHERE document_id = ? AND user_id = ?`.
  - When an owner clicks "Revoke", the permission row is deleted immediately. The very next microsecond request from the revoked user receives `403 Forbidden`.

---

### Entry 3: Duplicate Email Registration & Case Normalization
- **Date**: 2026-11-04
- **Commit Reference**: [`dbd958c`](https://github.com/trustvault/trustvault/commit/dbd958c) - `fix(auth): enforce database-level COLLATE NOCASE unique email constraint`
- **Prompt / Request**:
  > "Add validation to the user signup flow to prevent duplicate email registrations. Check if the email exists in JavaScript before inserting, and return an error if found."
- **What it Produced**:
  The AI wrote:
  ```javascript
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(req.body.email);
  if (existing) return res.status(400).json({ error: 'This email address is already registered. Please log in.' });
  db.prepare('INSERT INTO users ...').run(...);
  ```
- **What Was Wrong With It (Specifically)**:
  1. **Race Condition (Time-of-Check to Time-of-Use)**: Two simultaneous requests with the same email could pass the `SELECT` check concurrently before either reached the `INSERT`.
  2. **Casing & Trimming Bypass**: A user registered with `harsha@example.com` could be duplicated by someone submitting `Harsha@example.com ` or `HARSHA@EXAMPLE.COM`.
  3. **Inconsistent Error Response**: Failed to handle database collision errors gracefully.
- **What We Did Instead (Fix & Code Reference)**:
  - Normalized all incoming emails server-side using `.trim().toLowerCase()`.
  - Enforced a database-level engine constraint: `email TEXT NOT NULL UNIQUE COLLATE NOCASE`.
  - Wrapped user creation in SQLite immediate transactions and caught `SQLITE_CONSTRAINT_UNIQUE` to return the mandatory message: `"This email address is already registered. Please log in."`.

---

### Entry 4: Audit Trail Integrity & Cryptographic Tamper Evidence
- **Date**: 2026-11-06
- **Commit Reference**: [`ced536f`](https://github.com/trustvault/trustvault/commit/ced536f) - `feat(audit): implement continuous SHA-256 hash chaining and immutability triggers`
- **Prompt / Request**:
  > "Make the audit trail tamper-proof so that judges cannot modify it. Add a SHA-256 hash column to each audit record."
- **What it Produced**:
  The AI added a `hash` column to the `AuditLogs` table and computed:
  ```javascript
  const hash = crypto.createHash('sha256').update(JSON.stringify(logEntry)).digest('hex');
  ```
- **What Was Wrong With It (Specifically - Auth/Audit Trail Focus)**:
  1. **Isolated Hashes (No Chain)**: Each row's hash was independent of other rows. If an attacker with direct database access deleted rows #4 and #5, rows #1, #2, #3, and #6 still had "valid" individual hashes. There was no way to detect record deletions or reordering.
  2. **Non-Deterministic JSON Serialization**: `JSON.stringify` does not guarantee key ordering across platforms or engines, leading to spurious hash verification mismatches.
  3. **No Verification Route**: There was no automated mechanism to prove to a judge or auditor that the ledger remained unbroken.
- **What We Did Instead (Fix & Code Reference)**:
  - In `src/server/db.ts` (lines 170–250): Implemented a cryptographic **continuous hash chain**:
    $$\text{Hash}_n = \text{SHA256}(\text{prev\_hash} \parallel \text{id} \parallel \text{timestamp} \parallel \text{user\_id} \parallel \text{action} \parallel \text{doc\_id} \parallel \text{status} \parallel \text{details})$$
  - Each entry anchors to the preceding row's digest (`prev_hash`), initialized from a fixed `GENESIS_HASH`.
  - Built `verifyAuditLogChain()` and exposed it via `GET /api/audit-logs/verify`. If any record is modified, inserted out-of-order, or removed, the verification endpoint pinpoints the exact corrupted index.

---

### Entry 5: AI-Assisted Document Access Advisor
- **Date**: 2026-11-07
- **Commit Reference**: [`19f82b7`](https://github.com/trustvault/trustvault/commit/19f82b7) - `feat(ai): integrate AI Access Advisor with mandatory human owner sign-off`
- **Prompt / Request**:
  > "Integrate Gemini AI into the document permissions modal so that when an owner wants to share a document, the AI automatically grants access to relevant team members based on the document category."
- **What it Produced**:
  The AI generated a backend route `POST /api/documents/:id/ai-share` that parsed the document category, queried all users in the system, selected users with matching departments, and directly executed:
  ```javascript
  db.prepare('INSERT OR REPLACE INTO DocumentPermissions ...').run(docId, user.id, 'read');
  ```
  The endpoint updated permissions automatically and returned `"Permissions updated by AI"`.
- **What Was Wrong With It (Specifically - Auth/Access Control Focus)**:
  1. **Violation of the Fundamental AI Boundary**: *"The machine must never widen access on its own."* An automated LLM or heuristic grant completely strips the document owner of authorization governance and can leak confidential records to unauthorized recipients.
  2. **Audit Accountability Gap**: Permissions appeared in the database as if they were approved by the system rather than an accountable human principal.
  3. **Unvalidated Candidate Injection**: The model proposed access grants without checking whether suggested users were active or restricted.
- **What We Did Instead (Fix & Code Reference)**:
  - Redesigned the feature as an **Advisory-Only Assistant**: `POST /api/documents/:id/ai-suggest-access`.
  - Zero database writes occur during the suggestion phase. The endpoint merely proposes candidate collaborators with least-privilege rationales (e.g., "Finance category matches Chief Financial Officer; recommend Read-Only").
  - The suggestion generation is recorded in the audit trail as `'AI Suggestion Created'`.
  - In `src/components/PermissionsModal.tsx`: Built an interactive "AI Access Advisor" card. The owner must visually inspect each recommendation and click an explicit "Accept & Stage" button. Only then is a standard human-authorized `POST /api/documents/:id/permissions` request submitted, logging `'Permission Granted'` with the owner as the acting principal.

