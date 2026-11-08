# TrustVault – Secure Document Sharing with a Real Audit Trail

TrustVault is an enterprise document security and access governance platform built on three non-negotiable security tenets:

1. **A document is reachable only by someone who was granted it.** The server decides on every request. Client-side state, UI visibility, and direct URL tampering cannot bypass authorization.
2. **You can prove who reached it.** The audit trail is immutable, tamper-evident, continuously hash-chained (SHA-256), protected by database abort triggers, and forensically records both authorized events and refused attempts.
3. **Taking access away works immediately.** Revoking a collaborator's access or deactivating a user account terminates downstream capability synchronously at $T+0\text{ms}$.

---

## 1. Live Deployment & Evaluation Credentials

### Live URLs
- **Production URL**: [https://ais-pre-7ejtweganhgwwqq2lza534-454544380174.asia-southeast1.run.app](https://ais-pre-7ejtweganhgwwqq2lza534-454544380174.asia-southeast1.run.app)
- **Development URL**: [https://ais-dev-7ejtweganhgwwqq2lza534-454544380174.asia-southeast1.run.app](https://ais-dev-7ejtweganhgwwqq2lza534-454544380174.asia-southeast1.run.app)

### Demo Accounts for Evaluation (One for Each Role)

| Role | Email Address | Password | Permissions & System Scope |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `harshavdugga@gmail.com` | `Harsha@1122` | **Central Oversight**: Full administrative dashboard, user management (activate/deactivate), global document inventory metadata, and cryptographic audit log chain verification. Cannot silently delete or modify audit history. |
| **Document Owner** | `owner@trustvault.internal` | `Owner@TrustVault2026!` | **Data Governance**: Uploads documents, manages explicit collaborator permissions ("Access Only My Choice"), triggers AI Access Advisor suggestions, deletes own documents. Cannot access unshared files owned by others. |
| **Viewer** | `viewer@trustvault.internal` | `Viewer@TrustVault2026!` | **Least Privilege**: Can only view and download documents explicitly shared with them. Cannot upload, cannot delete, cannot edit, and cannot widen permissions. |

*Note: You can also register a new account on the Sign-Up page. The application enforces duplicate-email protection (`UNIQUE COLLATE NOCASE`) and automatically redirects registered users to Sign In.*

---

## 2. Core Architecture & Permission Model

### The Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Backend**: Node.js & Express, running integrated API controllers with strict authorization guards.
- **Database**: SQLite with WAL (Write-Ahead Logging) mode, foreign key enforcement, database engine triggers, and continuous SHA-256 hash chaining.
- **Automated Test Runner**: Python `unittest` suite (`tests/test_trustvault_security.py`) mapped to every threat vector in `THREATS.md`.

### The Permission Model in Plain Words
TrustVault utilizes a **synchronous per-document Access Control List (ACL)** model enforced exclusively by the backend:
1. Every document has a primary `owner_id`.
2. Collaborators are stored in `DocumentPermissions` rows indexed by `(document_id, user_id)` with explicit levels (`read`, `write`, `full`).
3. **No Stateless Token Permission Caches**: We deliberately rejected encoding permissions into stateless JWT payloads. A stateless JWT allows revoked users to continue accessing files until token expiration. Instead, TrustVault uses database-backed sessions; every preview, download, and modification request executes a synchronous indexed database lookup against `DocumentPermissions`.
4. When an owner revokes access or an administrator deactivates a user, the permission or session row is deleted immediately. Future access attempts fail in real time.
5. Direct static file access (`/data/*`, `/tests/*`, `*.db`, `*.sqlite`, `*.env`, and `/uploads/*`) is hard-blocked at the web server route level. Files are accessible solely through authorized API streaming endpoints.

---

## 3. API Documentation & Authorization Matrix

All API endpoints strictly enforce server-side authentication and role-based permissions:

| Endpoint | Method | Required Authentication | Authorized Principal | Description | Refused Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Anyone | Registers user. Normalizes email (`trim` + lowercase), rejects duplicates, and forces non-admin roles unless email strictly matches `ADMIN_EMAIL`. | `400 Bad Request` with duplicate warning |
| `/api/auth/login` | `POST` | Public | Anyone | Authenticates credentials with PBKDF2/SHA-512, verifies active status, and returns session bearer token. | `401 Unauthorized` |
| `/api/auth/logout` | `POST` | Bearer Token | Authenticated User | Invalidates and purges the server-side session token. | `401 Unauthorized` |
| `/api/auth/me` | `GET` | Bearer Token | Authenticated User | Retrieves caller profile and role clearance. | `401 Unauthorized` |
| `/api/documents` | `GET` | Bearer Token | Authenticated User | Retrieves authorized documents. Administrators see global metadata; normal users see only documents they own or were explicitly granted. | Scoped server query returns only authorized items |
| `/api/documents/:id` | `GET` | Bearer Token | Owner, Grantee, or Admin | Inspects document metadata and preview. Validates `getUserDocAccessLevel(docId, userId)`. | `403 Forbidden` + `Access Denied` audit log |
| `/api/documents/upload` | `POST` | Bearer Token | Owner or Admin | Uploads document with MIME/extension whitelist and initial collaborator permissions. | `403 Forbidden` for Viewers |
| `/api/documents/:id/download` | `GET` | Bearer Token | Owner, Grantee, or Admin | Streams file content with authorization check, view count increment, and audit recording. | `403 Forbidden` + `Access Denied` audit log |
| `/api/documents/:id` | `DELETE` | Bearer Token | Document Owner or Admin | Permanently purges document and cascades permission rows. | `403 Forbidden` for collaborators or strangers |
| `/api/documents/:id/permissions` | `POST` | Bearer Token | Document Owner or Admin | Updates collaborator access list. Revoked users lose access instantaneously. | `403 Forbidden` for non-owners |
| `/api/documents/:id/ai-suggest-access`| `POST` | Bearer Token | Document Owner only | **AI Access Advisor**: Proposes candidate collaborators based on category least-privilege. **Zero database writes.** Human confirmation required. | `403 Forbidden` for non-owners |
| `/api/audit-logs` | `GET` | Bearer Token | Authenticated User | Returns audit records. Super Admin views all events; normal users view only actions relating to their own documents or accounts. | Filtered server-side |
| `/api/audit-logs/verify` | `GET` | Bearer Token | Authenticated User | Cryptographically traverses the continuous SHA-256 hash chain from Genesis to Head to verify ledger integrity. | Returns validation result & corrupted index if broken |
| `/api/admin/users` | `GET` | Bearer Token | Super Admin Only | Returns centralized user roster, activity metrics, and status flags. | `403 Forbidden` for normal users |
| `/api/admin/users/:id/toggle-status` | `POST` | Bearer Token | Super Admin Only | Toggles user status between Active and Deactivated. Deactivating immediately revokes all active sessions. | `403 Forbidden` for normal users |
| `/api/categories` | `GET` | Public / Auth | Anyone | Returns document categories for filtering. | `500` on database failure |

---

## 4. Cryptographic Proof & The Immutable Audit Trail

### How Immutability is Enforced
TrustVault protects the audit ledger across two distinct security layers:

1. **Database Engine Abort Triggers**:
   ```sql
   CREATE TRIGGER prevent_audit_update
   BEFORE UPDATE ON AuditLogs
   BEGIN
       SELECT RAISE(ABORT, 'Audit log records are immutable and cannot be updated');
   END;

   CREATE TRIGGER prevent_audit_delete
   BEFORE DELETE ON AuditLogs
   BEGIN
       SELECT RAISE(ABORT, 'Audit log records are immutable and cannot be deleted');
   END;
   ```
2. **Continuous SHA-256 Hash Chaining**:
   Every audit record incorporates the cryptographic hash of the previous record:
   $$\text{Hash}_n = \text{SHA256}(\text{prev\_hash} \parallel \text{id} \parallel \text{timestamp} \parallel \text{user\_id} \parallel \text{action} \parallel \text{doc\_id} \parallel \text{status} \parallel \text{details})$$
   If an adversary with root disk access bypasses triggers and edits a historical row offline, `GET /api/audit-logs/verify` detects the cryptographic break and pinpoints the corrupted record.
3. **Refused Attempt Logging**:
   Every failed authentication, path traversal probe, or unauthorized document download creates an `'Access Denied'` audit event with the actor's IP address and context before returning HTTP 403.

---

## 5. Where AI Fits & Where It Must Not Decide

### The AI Access Advisor
- In `src/components/PermissionsModal.tsx` and `POST /api/documents/:id/ai-suggest-access`, document owners can request candidate suggestions for collaboration.
- **The Non-Negotiable Boundary**: *The machine must never widen access on its own.*
- The AI endpoint performs zero database mutations. It returns proposed collaborators with least-privilege rationales (e.g., "Candidate is in Financial Auditing; recommended for fiscal compliance under least-privilege READ clearance").
- The owner must visually review the candidate, click **"Accept & Stage"**, and click **"Save Changes"**.
- Both the suggestion generation (`'AI Suggestion Created'`) and the human owner's final grant (`'Permissions Changed'`) are recorded in the audit trail.

---

## 6. Project Setup, Seeding & Clean Clone Instructions

### Prerequisites
- Node.js $\ge 18$
- Python 3 (for test execution)

### 1. Clone & Install
```bash
git clone <repository_url>
cd trustvault
npm install
```

### 2. Run the Automated Security Tests
```bash
python3 tests/test_trustvault_security.py
```
*Output: `Ran 13 tests in 0.3s OK`.*

### 3. Build & Run Application
```bash
# Production Build & Start
npm run build
npm start

# Or Development Mode
npm run dev
```
The application will launch on `http://localhost:3000`. The database and seed records are provisioned automatically on initial server launch.

---

## 7. Short Write-Up

### What We Built
- Full-stack document vault with server-authoritative authorization on every route.
- Three distinct user roles (Super Administrator, Document Owner, Viewer) with role-based UI redirection and server-side capability scoping.
- Instant permission revocation with real-time database checks.
- Tamper-evident audit ledger with continuous SHA-256 hash chaining and SQLite abort triggers.
- AI Access Advisor providing least-privilege collaboration recommendations strictly requiring human owner approval.
- Search and filtering across document title, owner name, category, and date—scoped strictly to documents the caller is authorized to discover.

### What We Deliberately Chose Not to Build (And Why)
1. **Stateless JWT Permission Claims**: We deliberately did not encode document IDs or permissions into JWTs. While stateless JWTs reduce database queries, they make immediate revocation impossible without maintaining a distributed revocation blacklist (which negates the stateless benefit).
2. **Client-Side File Hiding as Security**: We deliberately did not rely on React components hiding buttons or routes. All authorization decisions are calculated server-side; if a user manually submits raw HTTP requests using curl or Postman, the server rejects them with HTTP 403.
3. **Autonomous AI Permission Granting**: We refused to allow an AI model to write directly to `DocumentPermissions`. Automated permission granting introduces catastrophic prompt injection and access leakage risks.

### How We Used AI and Where It Was Wrong
As documented in detail in `PROMPTS.md`:
1. **Privilege Escalation**: AI initially permitted `req.body.role` in the registration endpoint, allowing any user to register as Super Admin. We replaced this with strict environment variable anchoring (`ADMIN_EMAIL`).
2. **Stale JWT Revocation**: AI initially proposed 1-hour JWTs for document downloads. We replaced this with database-backed sessions and synchronous ACL checks.
3. **Race Condition on Signup**: AI initially checked email uniqueness via JavaScript `SELECT` queries without database-level constraints. We enforced `UNIQUE COLLATE NOCASE` at the database engine level.
4. **Isolated Audit Hashes**: AI generated disconnected hashes per row. We replaced this with continuous cryptographic hash chaining where each row commits to the hash of the previous row.
5. **AI Self-Granting Access**: AI initially created an endpoint that directly updated database permissions without human interaction. We refactored it into an advisory-only recommendation engine requiring owner confirmation.

### Unfinished Work & Known Boundaries
- **Storage Encryption at Rest**: Files are currently isolated in private server directories (`data/uploads/`) with random UUID filenames. Full envelope encryption (per-document AES-256 keys wrapped with KMS or user keypairs) should be added in production to protect against direct host root filesystem exfiltration.
- **External WORM Storage**: While SQLite triggers and hash chaining protect against application-level tampering, an attacker with operating system root access could rewrite the raw database file. In an enterprise cloud deployment, audit events would be concurrently mirrored to an external WORM (Write-Once-Read-Many) bucket (e.g. AWS S3 Object Lock or GCP Cloud Audit Logs).

---

## 8. Five-Minute Demo Video Walkthrough Outline

| Time | Segment | What is Demonstrated |
| :--- | :--- | :--- |
| **0:00 - 0:45** | **Super Administrator Overview** | Log in as `harshavdugga@gmail.com`. Tour administrative dashboard, user management table, global document inventory, and run the cryptographic hash chain verification tool (`/api/audit-logs/verify`). |
| **0:45 - 1:45** | **Document Owner & Private Isolation** | Log in as `owner@trustvault.internal`. View My Documents. Upload a new document (`Q4_Earnings.pdf`) under the Financial category. Show that only the owner sees this file; other users cannot see or search for it. |
| **1:45 - 2:30** | **Adversarial Attempt by Viewer** | Log in as `viewer@trustvault.internal`. Attempt to access `Q4_Earnings.pdf` via direct URL and API call. Show that the server returns HTTP 403 and records an `Access Denied` event in the audit log. |
| **2:30 - 3:30** | **AI Access Advisor with Human Confirmation** | Switch back to Owner. Open "Manage Permissions". Click "Consult AI". The AI analyzes the document category and suggests Sneha Reddy under least-privilege READ access. The Owner reviews the suggestion, stages the grant, and confirms the save. |
| **3:30 - 4:15** | **Authorized Access & Instant Revocation** | Switch back to Viewer. The document now appears in "Shared With Me". Viewer downloads the document. Switch back to Owner and click "Revoke". Viewer refreshes and attempts another download: access is immediately blocked at $T+0\text{ms}$. |
| **4:15 - 5:00** | **Audit Trail Immutability & Test Suite** | Show the unbroken audit trail recording the upload, refused attempt, AI suggestion, human confirmation, authorized download, and instant revocation. Run `python3 tests/test_trustvault_security.py` showing all 13 security tests passing. |
