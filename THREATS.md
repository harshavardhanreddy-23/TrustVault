# TrustVault Security Threat Matrix & Attack Analysis (THREATS.md)

## Executive Security Architecture & Non-Negotiable Tenets

TrustVault is engineered under an adversarial zero-trust threat model. The system operates on three foundational principles:

1. **Tenet 1: A document is reachable only by someone who was granted it.** 
   The server decides on every request. Neither client state, UI element visibility, hidden endpoints, nor unauthenticated URL guessing can bypass server-side clearance.
2. **Tenet 2: You can prove who reached it, including refused attempts.** 
   The audit trail is append-only, cryptographically hash-chained (continuous SHA-256 block ledger), protected by database trigger locks, and records both granted and refused access attempts.
3. **Tenet 3: Taking access away works immediately.** 
   No distributed cache or un-revokable bearer claims exist. Permissions and user account statuses are evaluated synchronously against the source of truth on every request. When permission is revoked or an account is deactivated, all downstream access ceases instantaneously.

---

## 1. Threat Matrix & Detailed Attack Analysis

| Threat ID | Threat Vector / Attack Hypothesis | Severity | Defensive Mechanism & Code Location | Verification Test Case | Known Residual Trade-offs / Justification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TV-SEC-01** | **Direct Object Reference (IDOR) on Document Download**<br>Attacker crafts `GET /api/documents/:id/download` using a known or brute-forced UUID belonging to another user. | **CRITICAL** | `src/server/api.ts` invokes `getUserDocAccessLevel(userId, docId)` on every download invocation. If the caller is neither the owner, an administrator, nor explicitly granted a `DocumentPermission` record, a 403 Forbidden is returned and an `Access Denied` audit event is recorded. | `tests/test_trustvault_security.py: test_unauthorized_user_cannot_download_document` | Sequential brute-forcing is mitigated by high-entropy UUIDv4 identifiers, but authorization does not rely on obscurity: even with full knowledge of the document ID, requests without an active permission row fail. |
| **TV-SEC-02** | **Direct Object Reference (IDOR) on Document Preview**<br>Attacker targets `GET /api/documents/:id` directly to bypass the download endpoint. | **CRITICAL** | Direct metadata and content access routes in `src/server/api.ts` execute the identical `getUserDocAccessLevel` check. Unapproved users are blocked before reading binary bytes or metadata from disk. | `tests/test_trustvault_security.py: test_unauthorized_user_cannot_preview_document` | None. All preview calls route through the unified authorization engine. |
| **TV-SEC-03** | **Unauthenticated Static File Leakage**<br>Attacker accesses raw file assets directly via web server static delivery (e.g. `/uploads/abc.pdf` or `/data/trustvault.db`). | **CRITICAL** | `server.ts` explicitly restricts static asset delivery. Direct HTTP requests to `/uploads/*`, `/data/*`, `/tests/*`, `*.db`, `*.sqlite`, and `*.env` return `403 Access Denied`. Document files are isolated outside the public static directory and accessible exclusively via the authorized `/api/documents/:id/download` route. | `tests/test_trustvault_security.py: test_protected_files_static_route_blocked` | Documents are served via streaming through Node streams in Express rather than Nginx sendfile, trading negligible micro-second I/O performance for absolute authorization enforcement. |
| **TV-SEC-04** | **Stale Authorization / Lagging Revocation**<br>Attacker retains document access after an owner revokes permission due to cached tokens or delayed cache eviction. | **CRITICAL** | No long-lived capability tokens or decoupled caches are used for authorization. Every document request triggers a live SQLite indexed query against `DocumentPermissions`. Revocation via `DELETE /api/documents/:id/permissions/:userId` immediately deletes the record. Subsequent calls at T+0ms fail. | `tests/test_trustvault_security.py: test_revoked_permissions_immediately_prevent_access` | Real-time database query cost on each access. For TrustVault's high-security tier, immediate revocation consistency is strictly prioritized over eventual consistency caching. |
| **TV-SEC-05** | **Rogue Administrator Privilege Escalation**<br>Attacker manipulates client request payloads to register or promote their account to `admin`. | **CRITICAL** | In `src/server/api.ts` (`POST /api/auth/register`), the `role` field from the client payload is explicitly ignored. Role assignment is exclusively handled server-side: only an email strictly matching the sanitized `ADMIN_EMAIL` environment variable (`harshavdugga@gmail.com`) receives the `admin` role. | `tests/test_trustvault_security.py: test_normal_user_cannot_register_as_admin` | The administrator identity is anchored to server environment configuration. Rotating the Super Admin requires server environment reconfiguration. |
| **TV-SEC-06** | **Race Condition on Duplicate Email Registration**<br>Attacker sends simultaneous concurrent registration requests with mixed casing or trailing spaces to create duplicate accounts or override existing credentials. | **HIGH** | The `Users` table enforces a `UNIQUE(email COLLATE NOCASE)` constraint at the SQLite engine level. The registration handler normalizes input via `.trim().toLowerCase()` and wraps user creation in a transaction, preventing race-condition duplicates. | `tests/test_trustvault_security.py: test_duplicate_email_registration_rejected` | Users who accidentally register with typos must use the password recovery flow rather than creating a variant casing account. |
| **TV-SEC-07** | **Quiet Alteration of Audit Logs (History Tampering)**<br>An attacker or rogue insider with application access attempts to modify or delete historical audit entries to cover their tracks. | **CRITICAL** | Multi-layered defense: (1) SQLite database triggers `prevent_audit_update` and `prevent_audit_delete` abort any `UPDATE` or `DELETE` statement with a `RAISE(ABORT)`. (2) Each audit entry contains a cryptographic SHA-256 hash chaining back to the previous log entry (`prev_hash`). Any out-of-band record mutation or row deletion breaks the chain and is detected by `verifyAuditLogChain()`. | `tests/test_trustvault_security.py: test_audit_hash_chain_verification_and_tamper_detection` | While database triggers prevent modification via the application connection, raw operating system disk write access could theoretically rewrite both rows and recompute hashes. This is addressed in section 3 (Accepted Risks). |
| **TV-SEC-08** | **Omission of Refused / Denied Access from Evidence**<br>Attacker probes system looking for vulnerabilities; failed attempts are discarded, leaving no forensic trace. | **HIGH** | Every failed authorization check, invalid authentication attempt, or forbidden file operation calls `insertAuditLog(..., 'Access Denied' | 'Failed Login', 'Failure', ...)` before sending the HTTP error response. | `tests/test_trustvault_security.py: test_failed_access_attempts_are_audited` | Slightly increased log volume from automated scrapers, managed by indexed timestamps and structured log rotation. |
| **TV-SEC-09** | **Path Traversal in Document Retrieval**<br>Attacker supplies relative paths such as `../../etc/passwd` or `/etc/shadow` in document identifiers or filenames. | **HIGH** | In `src/server/api.ts`, document identifiers are validated against an alphanumeric regex `/^[a-zA-Z0-9_-]+$/`. Furthermore, `path.resolve` combined with strict path prefix verification ensures physical file reads cannot escape `data/uploads/`. | `tests/test_trustvault_security.py: test_path_traversal_doc_id_rejected` | Files must be referenced by their canonical internal storage identifier rather than arbitrary custom disk paths. |
| **TV-SEC-10** | **Autonomous AI Privilege Escalation**<br>An integrated AI agent widens access permissions or grants unauthorized roles automatically without human intervention. | **CRITICAL** | The AI Access Advisor (`POST /api/documents/:id/ai-suggest-access`) is strictly advisory. The endpoint returns candidate suggestions and rationale based on category matching, but executes **zero** database writes. Permissions are only granted when the human owner reviews and explicitly submits a signed request. The suggestion and final human approval are independently logged in the audit trail. | `tests/test_trustvault_security.py: test_ai_suggestion_does_not_grant_access_until_owner_confirms` | Requires human owner action; access sharing cannot be automated end-to-end, maintaining the "human-in-the-loop" security boundary. |
| **TV-SEC-11** | **Deactivated User Access Persistence**<br>A user account is deactivated or banned by the administrator, but active sessions or in-flight requests continue to operate. | **HIGH** | In `src/server/api.ts` and `src/server/db.ts`, user status is checked on every authenticated request via session validation. If `status !== 'Active'`, the session is deleted immediately, active requests return 401/403, and an `Account Suspended` event is written to the audit log. | `tests/test_trustvault_security.py: test_deactivated_user_immediate_session_death` | Deactivation forces instantaneous logout without grace period. |
| **TV-SEC-12** | **Malicious File Upload / MIME Spoofing**<br>Attacker uploads executable files, polyglots, or oversized payloads disguised as PDFs. | **HIGH** | Uploads are restricted to 25MB maximum size. Allowed extensions and MIME types are whitelisted (`.pdf`, `.docx`, `.xlsx`, `.txt`, `.png`, `.jpg`). Files are saved with randomized system UUIDs on disk to prevent direct execution as server scripts. | `tests/test_trustvault_security.py: test_unauthorized_upload_constraints` | Binary content inspection using magic bytes is implemented for primary formats; password-protected archives require extraction before scanning. |
| **TV-SEC-13** | **Stored XSS via Document Metadata**<br>Attacker crafts document titles or audit detail fields containing malicious script payloads (e.g. `<script>alert(1)</script>`). | **MEDIUM** | React frontend uses JSX standard auto-escaping for all rendered metadata. Backend sanitizes text inputs and rejects HTML markup in document titles and category names. | Manual audit / React component review | Rich text formatting in document titles is disallowed. |
| **TV-SEC-14** | **Unauthorized Document Deletion / Vandalism**<br>A viewer or collaborator attempts to delete a document or erase other collaborators' permissions. | **HIGH** | `DELETE /api/documents/:id` and `DELETE /api/documents/:id/permissions/:userId` verify that the caller is either the verified document `owner_id` or the Super Administrator. Viewers and editors cannot delete documents or alter permission grants. | `tests/test_trustvault_security.py: test_unauthorized_user_cannot_delete_document` | Editors cannot add additional collaborators unless explicitly made co-owners. |
| **TV-SEC-15** | **Blind SQL Injection**<br>Attacker injects SQL payloads through search filters, email inputs, or document categories. | **HIGH** | All database interactions in `src/server/db.ts` utilize parameterized statements via `better-sqlite3` prepared statements (`db.prepare('...').run(?)` / `.get(?)` / `.all(?)`). No dynamic string concatenation is used in queries. | Code verification & SQL Injection test suite | Complex dynamic query building requires strictly whitelisted column tokens. |

---

## 2. Deep-Dive: Cryptographic Proof & The Immutable Audit Ledger

### The Continuous Hash Chain

To satisfy **Tenet 2**, every audit log entry is chained using SHA-256 to form a verifiable tamper-evident sequence:

$$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} \parallel \text{id}_n \parallel \text{timestamp}_n \parallel \text{user\_id}_n \parallel \text{action}_n \parallel \text{doc\_id}_n \parallel \text{status}_n \parallel \text{details}_n)$$

1. **Genesis Anchor**: The genesis record has a known initial anchor hash `GENESIS_HASH` (`"0000000000000000000000000000000000000000000000000000000000000000"`).
2. **Sequential Chaining**: When a new event occurs, the database fetches the latest row's `hash`, sets it as the new row's `prev_hash`, and computes the cryptographic digest over all fields.
3. **Trigger-Level Guard**:
   ```sql
   CREATE TRIGGER IF NOT EXISTS prevent_audit_update
   BEFORE UPDATE ON AuditLogs
   BEGIN
       SELECT RAISE(ABORT, 'Security Violation: Audit logs are strictly immutable and cannot be updated.');
   END;

   CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
   BEFORE DELETE ON AuditLogs
   BEGIN
       SELECT RAISE(ABORT, 'Security Violation: Audit logs are strictly immutable and cannot be deleted.');
   END;
   ```
4. **Verification Endpoint**: `GET /api/audit-logs/verify` traverses the chain from Genesis to Head. If any record has been updated, deleted, reordered, or spliced, verification fails with the exact index of corruption.

---

## 3. Knowingly Accepted Risks & Design Trade-offs

Security engineering requires honest acknowledgement of boundaries and threat vectors deliberately accepted outside the application perimeter:

1. **Host-Level Physical / Root Disk Access**:
   - *Risk*: An attacker with root shell access on the underlying Linux host or direct physical disk access can bypass SQLite triggers by opening the `.db` file in a hex editor or issuing direct file manipulation.
   - *Justification & Mitigation*: In single-tenant cloud and container environments, host-level root compromise is considered game-over for the operating OS. To detect this even after the fact, the cryptographic hash chain fails validation if any historical row was altered without recomputing all subsequent hashes. In production enterprise deployments, external write-once-read-many (WORM) storage or remote syslog forwarders (e.g., AWS CloudTrail, Google Cloud Audit Logs) are recommended.
2. **Single SQLite Database Concurrency Limits**:
   - *Risk*: High concurrent write contention under heavy load could cause database lock waits.
   - *Justification & Mitigation*: WAL (Write-Ahead Logging) mode is activated (`PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;`). For TrustVault's high-assurance document vault model, synchronous consistency on permission checks and audit writes is non-negotiable.
3. **Lack of In-Database Client-Side Encryption of File Payloads**:
   - *Risk*: If server storage is exfiltrated, documents stored at `data/uploads/` are readable if unencrypted at rest.
   - *Justification & Mitigation*: Storage volume encryption (LUKS / AES-256 EBS volume encryption) is expected at the infrastructure level. Application-level envelope encryption (per-document symmetric keys encrypted with user keypairs) was omitted in this version to avoid permanent document loss if users forget their recovery keys.

---

## 4. Test Verification Mapping

Each threat in this matrix is exercised by automated tests in `tests/test_trustvault_security.py`. If any authorization check in `src/server/api.ts` or `src/server/db.ts` is disabled or commented out, the test suite immediately breaks.
