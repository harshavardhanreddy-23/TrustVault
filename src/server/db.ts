import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'trustvault.db');
export const db = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Configured Super Administrator Email
export const getAdminEmail = (): string => {
  return (process.env.ADMIN_EMAIL || 'harshavdugga@gmail.com').toLowerCase().trim();
};

export const isAdminEmail = (email: string): boolean => {
  const norm = email.trim().toLowerCase();
  const configured = getAdminEmail();
  return (
    norm === configured ||
    norm === 'harshavdugga@gmail.com' ||
    norm === 'harshavdugga' ||
    norm === 'admin@trustvault.internal'
  );
};

// Password hashing utility with PBKDF2 and cryptographically secure random salt
export const hashPassword = (password: string, existingSalt?: string): { hash: string; salt: string } => {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
};

export const verifyPassword = (password: string, hash: string, salt: string): boolean => {
  const check = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return check === hash;
};

// Initialize schema
export const initDatabase = () => {
  db.exec(`
    -- 1. Users table with UNIQUE email constraint
    CREATE TABLE IF NOT EXISTS Users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'owner', 'viewer')),
      department TEXT NOT NULL,
      title TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    -- 2. Categories table
    CREATE TABLE IF NOT EXISTS Categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    );

    -- 3. Documents table
    CREATE TABLE IF NOT EXISTS Documents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      category TEXT NOT NULL,
      owner_id TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      owner_name TEXT NOT NULL,
      hash TEXT NOT NULL,
      file_summary TEXT,
      downloads_count INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 4. DocumentPermissions table (Granular ACLs)
    CREATE TABLE IF NOT EXISTS DocumentPermissions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES Documents(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      user_email TEXT NOT NULL COLLATE NOCASE,
      user_name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('read', 'write', 'full')),
      granted_at TEXT NOT NULL,
      granted_by TEXT NOT NULL,
      UNIQUE(document_id, user_id)
    );

    -- 5. AuditLogs table (Immutable write-once ledger)
    CREATE TABLE IF NOT EXISTS AuditLogs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      document_id TEXT,
      document_name TEXT,
      ip_address TEXT,
      details TEXT,
      status TEXT NOT NULL CHECK(status IN ('success', 'blocked', 'warning')),
      signature_hash TEXT NOT NULL,
      prev_hash TEXT DEFAULT 'GENESIS_HASH_000000000000000000000000'
    );

    -- 6. Active Auth Sessions table
    CREATE TABLE IF NOT EXISTS Sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    -- Appropriate Database Indexes for high performance querying
    CREATE INDEX IF NOT EXISTS idx_users_email ON Users(email);
    CREATE INDEX IF NOT EXISTS idx_docs_owner ON Documents(owner_id);
    CREATE INDEX IF NOT EXISTS idx_docs_category ON Documents(category);
    CREATE INDEX IF NOT EXISTS idx_perms_doc ON DocumentPermissions(document_id);
    CREATE INDEX IF NOT EXISTS idx_perms_user ON DocumentPermissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON AuditLogs(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_doc ON AuditLogs(document_id);
  `);

  // Immutability triggers on AuditLogs: block updates and deletes at the database level
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS prevent_audit_update
    BEFORE UPDATE ON AuditLogs
    BEGIN
      SELECT RAISE(ABORT, 'Audit log records are immutable and cannot be modified');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_audit_delete
    BEFORE DELETE ON AuditLogs
    BEGIN
      SELECT RAISE(ABORT, 'Audit log records are immutable and cannot be deleted');
    END;
  `);

  // Ensure prev_hash column exists in pre-existing database tables
  try {
    const tableInfo = db.prepare("PRAGMA table_info(AuditLogs)").all() as any[];
    const hasPrevHash = tableInfo.some(col => col.name === 'prev_hash');
    if (!hasPrevHash) {
      db.prepare("ALTER TABLE AuditLogs ADD COLUMN prev_hash TEXT DEFAULT 'GENESIS_HASH_000000000000000000000000'").run();
    }
  } catch (e) {
    console.error('Audit table migration notice:', e);
  }

  // Seed standard categories if empty
  const catCount = db.prepare('SELECT COUNT(*) as count FROM Categories').get() as { count: number };
  if (catCount.count === 0) {
    const insertCat = db.prepare('INSERT INTO Categories (id, name, description) VALUES (?, ?, ?)');
    const defaultCategories = [
      ['cat_1', 'Reports', 'Operational, fiscal, and engineering reports'],
      ['cat_2', 'Financial', 'Budget plans, projections, and audits'],
      ['cat_3', 'Legal', 'Agreements, policy standards, and contracts'],
      ['cat_4', 'Engineering', 'Architecture blueprints, specifications, and code'],
      ['cat_5', 'HR', 'Organizational directories and employee policies'],
      ['cat_6', 'Compliance', 'Security audits, ISO/SOC-2 documentation, and certifications']
    ];
    for (const [id, name, desc] of defaultCategories) {
      insertCat.run(id, name, desc);
    }
  }

  // Ensure primary Super Administrator account exists for harshavdugga@gmail.com
  const { hash: harshaHash, salt: harshaSalt } = hashPassword('Harsha@1122');
  const now = new Date().toISOString();
  const existingHarsha = db.prepare('SELECT id FROM Users WHERE email = ?').get('harshavdugga@gmail.com') as any;

  if (!existingHarsha) {
    db.prepare(`
      INSERT INTO Users (id, email, name, password_hash, salt, role, department, title, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 'admin', 'Executive & Governance', 'Super Administrator', 1, ?)
    `).run('user_harshavdugga', 'harshavdugga@gmail.com', 'Harsha Vardhan Reddy', harshaHash, harshaSalt, now);

    insertAuditLog({
      userId: 'user_harshavdugga',
      userName: 'Harsha Vardhan Reddy',
      action: 'System Initialized',
      documentId: 'system_core',
      documentName: 'TrustVault Core',
      ipAddress: '127.0.0.1',
      details: 'Super Administrator account provisioned for harshavdugga@gmail.com',
      status: 'success'
    });
  } else {
    // Keep password and admin role synchronized
    db.prepare(`
      UPDATE Users 
      SET password_hash = ?, salt = ?, role = 'admin', is_active = 1, title = 'Super Administrator'
      WHERE email = ?
    `).run(harshaHash, harshaSalt, 'harshavdugga@gmail.com');
  }

  // Also maintain backup internal admin account
  const existingAdmin = db.prepare('SELECT * FROM Users WHERE email = ?').get('admin@trustvault.internal') as any;
  if (!existingAdmin) {
    const { hash, salt } = hashPassword('Admin@TrustVault2026!');
    db.prepare(`
      INSERT INTO Users (id, email, name, password_hash, salt, role, department, title, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 'admin', 'Cybersecurity & Governance', 'Super Administrator', 1, ?)
    `).run('user_superadmin', 'admin@trustvault.internal', 'Super Administrator', hash, salt, now);
  }

  // Ensure default demo Owner and Viewer exist for seamless evaluation
  const existingOwner = db.prepare('SELECT id FROM Users WHERE email = ?').get('owner@trustvault.internal') as any;
  if (!existingOwner) {
    const { hash, salt } = hashPassword('Owner@TrustVault2026!');
    db.prepare(`
      INSERT INTO Users (id, email, name, password_hash, salt, role, department, title, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 'owner', 'Product Operations', 'Document Lead', 1, ?)
    `).run('user_owner', 'owner@trustvault.internal', 'Harsha Vardhan Reddy', hash, salt, new Date().toISOString());
  }

  const existingViewer = db.prepare('SELECT id FROM Users WHERE email = ?').get('viewer@trustvault.internal') as any;
  if (!existingViewer) {
    const { hash, salt } = hashPassword('Viewer@TrustVault2026!');
    db.prepare(`
      INSERT INTO Users (id, email, name, password_hash, salt, role, department, title, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 'viewer', 'Financial Auditing', 'Compliance Auditor', 1, ?)
    `).run('user_viewer', 'viewer@trustvault.internal', 'Sneha Reddy', hash, salt, new Date().toISOString());
  }

  // Seed sample documents if table is empty
  const docCount = db.prepare('SELECT COUNT(*) as count FROM Documents').get() as { count: number };
  if (docCount.count === 0) {
    const insertDoc = db.prepare(`
      INSERT INTO Documents (id, name, type, size, size_bytes, category, owner_id, owner_name, hash, file_summary, downloads_count, views_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertDoc.run(
      'doc_1',
      'Project_Report.pdf',
      'pdf',
      '2.4 MB',
      2516582,
      'Reports',
      'user_owner',
      'Harsha Vardhan Reddy',
      '9a8f7b6c5d4e3f2a1b0c',
      'Quarterly engineering milestone audit and cryptographic compliance deliverable.',
      42,
      75,
      'Oct 26, 2026',
      'Oct 26, 2026'
    );

    insertDoc.run(
      'doc_2',
      'Company_Policy.docx',
      'docx',
      '1.8 MB',
      1887436,
      'Compliance',
      'user_superadmin',
      'Super Administrator',
      '4e5f6a7b8c9d0e1f2a3b',
      'Standard enterprise security guidelines, zero-trust protocol, and data classification.',
      19,
      48,
      'Oct 24, 2026',
      'Oct 24, 2026'
    );

    insertDoc.run(
      'doc_3',
      'Budget_2026.xlsx',
      'xlsx',
      '3.2 MB',
      3355443,
      'Financial',
      'user_owner',
      'Harsha Vardhan Reddy',
      '1b2c3d4e5f6a7b8c9d0e',
      'FY2026 hardware procurement budget, encryption key lifecycle projections.',
      12,
      31,
      'Oct 22, 2026',
      'Oct 22, 2026'
    );

    // Seed permissions
    const insertPerm = db.prepare(`
      INSERT OR REPLACE INTO DocumentPermissions (id, document_id, user_id, user_email, user_name, level, granted_at, granted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // doc_1 permissions
    insertPerm.run('perm_1_owner', 'doc_1', 'user_owner', 'owner@trustvault.internal', 'Harsha Vardhan Reddy', 'full', 'Oct 26, 2026', 'System');
    insertPerm.run('perm_1_viewer', 'doc_1', 'user_viewer', 'viewer@trustvault.internal', 'Sneha Reddy', 'read', 'Oct 26, 2026', 'Harsha Vardhan Reddy');

    // doc_2 permissions
    insertPerm.run('perm_2_admin', 'doc_2', 'user_harshavdugga', 'harshavdugga@gmail.com', 'Super Administrator', 'full', 'Oct 24, 2026', 'System');
    insertPerm.run('perm_2_owner', 'doc_2', 'user_owner', 'owner@trustvault.internal', 'Harsha Vardhan Reddy', 'read', 'Oct 24, 2026', 'Super Administrator');
    insertPerm.run('perm_2_viewer', 'doc_2', 'user_viewer', 'viewer@trustvault.internal', 'Sneha Reddy', 'read', 'Oct 24, 2026', 'Super Administrator');

    // doc_3 permissions (private to Harsha Vardhan Reddy)
    insertPerm.run('perm_3_owner', 'doc_3', 'user_owner', 'owner@trustvault.internal', 'Harsha Vardhan Reddy', 'full', 'Oct 22, 2026', 'System');

    // Seed initial audit trail matching screenshot
    insertAuditLog({
      userId: 'user_owner',
      userName: 'Harsha Vardhan Reddy',
      action: 'Downloaded',
      documentId: 'doc_1',
      documentName: 'Project_Report.pdf',
      ipAddress: '127.0.0.1',
      details: 'IP: 127.0.0.1',
      status: 'success'
    });

    insertAuditLog({
      userId: 'user_owner',
      userName: 'Harsha Vardhan Reddy',
      action: 'Permissions Changed',
      documentId: 'doc_1',
      documentName: 'Project_Report.pdf',
      ipAddress: '127.0.0.1',
      details: 'Granted: Sneha Reddy',
      status: 'success'
    });

    insertAuditLog({
      userId: 'user_viewer',
      userName: 'Sneha Reddy',
      action: 'Viewed',
      documentId: 'doc_2',
      documentName: 'Company_Policy.docx',
      ipAddress: '127.0.0.1',
      details: '-',
      status: 'success'
    });

    insertAuditLog({
      userId: 'user_superadmin',
      userName: 'Super Administrator',
      action: 'Deleted',
      documentId: 'doc_old',
      documentName: 'Old_Report.pdf',
      ipAddress: '127.0.0.1',
      details: '-',
      status: 'warning'
    });

    insertAuditLog({
      userId: 'user_owner',
      userName: 'Harsha Vardhan Reddy',
      action: 'Uploaded',
      documentId: 'doc_3',
      documentName: 'Budget_2026.xlsx',
      ipAddress: '127.0.0.1',
      details: '-',
      status: 'success'
    });
  }
};

// Helper: insert audit log with cryptographic continuous hash chaining
export const insertAuditLog = (params: {
  userId?: string | null;
  userName: string;
  action: string;
  documentId?: string | null;
  documentName?: string | null;
  ipAddress?: string | null;
  details?: string | null;
  status: 'success' | 'blocked' | 'warning';
}) => {
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const formattedTimestamp = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + ' ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Fetch previous log's signature hash to maintain an unbroken cryptographic chain
  let prevHash = 'GENESIS_HASH_000000000000000000000000';
  try {
    const lastRow = db.prepare('SELECT signature_hash FROM AuditLogs ORDER BY rowid DESC LIMIT 1').get() as any;
    if (lastRow?.signature_hash) {
      prevHash = lastRow.signature_hash;
    }
  } catch (e) {
    // fallback to genesis
  }

  const payload = `${prevHash}|${id}|${formattedTimestamp}|${params.userId || 'anonymous'}|${params.action}|${params.documentId || ''}|${params.status}|${params.details || ''}`;
  const signatureHash = crypto.createHash('sha256').update(payload).digest('hex');

  try {
    db.prepare(`
      INSERT INTO AuditLogs (id, timestamp, user_id, user_name, action, document_id, document_name, ip_address, details, status, signature_hash, prev_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      formattedTimestamp,
      params.userId || null,
      params.userName,
      params.action,
      params.documentId || null,
      params.documentName || null,
      params.ipAddress || '127.0.0.1',
      params.details || '-',
      params.status,
      signatureHash,
      prevHash
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

// Cryptographic audit chain verification: checks unbroken linkage and detects any quiet record alteration
export const verifyAuditLogChain = (): {
  valid: boolean;
  total: number;
  compromisedIndex?: number;
  recordId?: string;
  reason?: string;
  headHash?: string;
} => {
  const logs = db.prepare('SELECT * FROM AuditLogs ORDER BY rowid ASC').all() as any[];
  let expectedPrev = 'GENESIS_HASH_000000000000000000000000';

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    if (log.prev_hash && log.prev_hash !== expectedPrev) {
      return {
        valid: false,
        total: logs.length,
        compromisedIndex: i,
        recordId: log.id,
        reason: `Cryptographic chain broken at record ${log.id}: prev_hash does not match preceding signature`
      };
    }

    const payload = `${log.prev_hash || expectedPrev}|${log.id}|${log.timestamp}|${log.user_id || 'anonymous'}|${log.action}|${log.document_id || ''}|${log.status}|${log.details || ''}`;
    const calculated = crypto.createHash('sha256').update(payload).digest('hex');

    if (log.prev_hash && calculated !== log.signature_hash) {
      return {
        valid: false,
        total: logs.length,
        compromisedIndex: i,
        recordId: log.id,
        reason: `Cryptographic signature mismatch at record ${log.id}: payload content has been altered`
      };
    }

    expectedPrev = log.signature_hash;
  }

  return { valid: true, total: logs.length, headHash: expectedPrev };
};
