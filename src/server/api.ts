import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, getAdminEmail, isAdminEmail, hashPassword, verifyPassword, insertAuditLog, verifyAuditLogChain } from './db.ts';

export const apiRouter = Router();

// Extend Request type to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'owner' | 'viewer';
    department: string;
    title?: string;
    is_active: number;
  };
}

// Authentication Middleware: Validates Bearer token against Sessions table
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No bearer token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const session = db.prepare(`
      SELECT s.token, s.expires_at, u.id, u.email, u.name, u.role, u.department, u.title, u.is_active
      FROM Sessions s
      JOIN Users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token) as any;

    if (!session) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
    }

    if (new Date(session.expires_at) < new Date()) {
      db.prepare('DELETE FROM Sessions WHERE token = ?').run(token);
      return res.status(401).json({ success: false, message: 'Session has expired. Please log in again.' });
    }

    if (!session.is_active) {
      db.prepare('DELETE FROM Sessions WHERE token = ?').run(token);
      return res.status(403).json({ success: false, message: 'Your account has been deactivated by an administrator.' });
    }

    req.user = {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      department: session.department,
      title: session.title,
      is_active: session.is_active
    };

    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ success: false, message: 'Internal authentication error.' });
  }
};

// Admin Authorization Middleware: Only Super Administrator can access
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    insertAuditLog({
      userId: req.user?.id,
      userName: req.user?.name || 'Unknown',
      action: 'Admin Access Blocked',
      documentId: 'admin_dashboard',
      documentName: 'Administrative Controls',
      ipAddress: req.ip,
      details: `Non-administrator (${req.user?.email || 'anonymous'}) attempted to access restricted admin API`,
      status: 'blocked'
    });
    return res.status(403).json({ success: false, message: 'Forbidden. Super Administrator privileges required.' });
  }
  next();
};

/* ==========================================================================
   1. AUTHENTICATION & REGISTRATION ENDPOINTS
   ========================================================================== */

// POST /api/auth/register - Unique Email Registration with strict normalization
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, department, role, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // 1. Normalize email: trim and lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // 2. Check for duplicate email in database before creating account
    const existing = db.prepare('SELECT id, email FROM Users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      // Exactly as specified in Section 1
      return res.status(400).json({ 
        success: false, 
        message: 'This email address is already registered. Please log in.' 
      });
    }

    // 3. Super Administrator assignment rule:
    // Only the configured ADMIN_EMAIL receives the Super Administrator role.
    let assignedRole: 'admin' | 'owner' | 'viewer';

    if (isAdminEmail(normalizedEmail)) {
      assignedRole = 'admin';
    } else {
      // Normal users must NEVER be able to select or assign themselves the administrator role
      assignedRole = (role === 'viewer') ? 'viewer' : 'owner';
    }

    // 4. Secure password hashing with cryptographic salt
    const { hash, salt } = hashPassword(password);
    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO Users (id, email, name, password_hash, salt, role, department, title, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      userId,
      normalizedEmail,
      name.trim(),
      hash,
      salt,
      assignedRole,
      department?.trim() || 'General Operations',
      assignedRole === 'admin' ? 'Super Administrator' : `${department || 'Enterprise'} Specialist`,
      now
    );

    // 5. Audit log
    insertAuditLog({
      userId,
      userName: name.trim(),
      action: 'User Registered',
      documentId: 'user_auth',
      documentName: 'Identity Credential',
      ipAddress: req.ip,
      details: `Registered account with ${assignedRole.toUpperCase()} clearance in ${department || 'General'}`,
      status: 'success'
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please log in with your credentials.',
      email: normalizedEmail,
      role: assignedRole
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ success: false, message: 'This email address is already registered. Please log in.' });
    }
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === 'harshavdugga') {
      normalizedEmail = 'harshavdugga@gmail.com';
    }

    const user = db.prepare('SELECT * FROM Users WHERE email = ?').get(normalizedEmail) as any;

    if (!user) {
      insertAuditLog({
        userName: normalizedEmail,
        action: 'Login Failed',
        documentId: 'auth_login',
        documentName: 'Session Auth',
        ipAddress: req.ip,
        details: 'Failed login attempt: Email not found in user database',
        status: 'blocked'
      });
      return res.status(401).json({ 
        success: false, 
        message: 'No registered account found with this email. New users must first Sign Up before signing in.' 
      });
    }

    if (!user.is_active) {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Login Blocked',
        documentId: 'auth_login',
        documentName: 'Account Status',
        ipAddress: req.ip,
        details: 'Login attempt on deactivated user account rejected',
        status: 'blocked'
      });
      return res.status(403).json({ 
        success: false, 
        message: 'This account has been deactivated by an administrator. Please contact IT Security.' 
      });
    }

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Login Failed',
        documentId: 'auth_login',
        documentName: 'Master Password',
        ipAddress: req.ip,
        details: 'Invalid password credentials submitted',
        status: 'blocked'
      });
      return res.status(401).json({ success: false, message: 'Incorrect master password. Please verify and try again.' });
    }

    // Generate secure session token
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.prepare(`
      INSERT INTO Sessions (token, user_id, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(token, user.id, now.toISOString(), expiresAt);

    // Update last login
    db.prepare('UPDATE Users SET last_login_at = ? WHERE id = ?').run(now.toISOString(), user.id);

    // Audit log
    insertAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'User Logged In',
      documentId: 'session_auth',
      documentName: 'Workspace Session',
      ipAddress: req.ip,
      details: `Authenticated with ${user.role.toUpperCase()} role clearance`,
      status: 'success'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        title: user.title
      }
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
apiRouter.post('/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    db.prepare('DELETE FROM Sessions WHERE token = ?').run(token);
  }
  insertAuditLog({
    userId: req.user?.id,
    userName: req.user?.name || 'User',
    action: 'User Logged Out',
    documentId: 'session_auth',
    documentName: 'Workspace Session',
    ipAddress: req.ip,
    details: 'Session token invalidated and removed from database',
    status: 'success'
  });
  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

/* ==========================================================================
   2. DOCUMENT MANAGEMENT ENDPOINTS
   ========================================================================== */

// Helper to check user document authorization:
// Returns access level: 'full', 'write', 'read', or null
export const getUserDocAccessLevel = (docId: string, userId: string, userRole: string): 'full' | 'write' | 'read' | null => {
  const doc = db.prepare('SELECT owner_id FROM Documents WHERE id = ?').get(docId) as any;
  if (!doc) return null;

  // Document owner always has full access
  if (doc.owner_id === userId) return 'full';

  // Super Administrator has audit oversight access
  if (userRole === 'admin') return 'full';

  // Check explicit collaborator permissions
  const perm = db.prepare(`
    SELECT level FROM DocumentPermissions 
    WHERE document_id = ? AND user_id = ?
  `).get(docId, userId) as any;

  if (perm) {
    return perm.level as 'full' | 'write' | 'read';
  }

  return null;
};

// GET /api/documents - Centralized and role-filtered document list
apiRouter.get('/documents', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { search, category, scope } = req.query;

    let sql = `
      SELECT 
        d.id, d.name, d.type, d.size, d.size_bytes, d.category,
        d.owner_id, d.owner_name, d.hash, d.file_summary,
        d.downloads_count, d.views_count, d.created_at, d.updated_at
      FROM Documents d
      WHERE 1=1
    `;
    const params: any[] = [];

    // Authorization scoping
    if (user.role === 'admin') {
      // Administrator can view all documents across platform (Section 4)
      if (scope === 'my_documents') {
        sql += ' AND d.owner_id = ?';
        params.push(user.id);
      }
    } else {
      // Normal users can only view documents they own or have explicit permission for
      if (scope === 'my_documents') {
        sql += ' AND d.owner_id = ?';
        params.push(user.id);
      } else if (scope === 'shared') {
        sql += ` AND d.owner_id != ? AND d.id IN (
          SELECT document_id FROM DocumentPermissions WHERE user_id = ?
        )`;
        params.push(user.id, user.id);
      } else {
        // Default: My docs + shared docs
        sql += ` AND (
          d.owner_id = ? OR d.id IN (
            SELECT document_id FROM DocumentPermissions WHERE user_id = ?
          )
        )`;
        params.push(user.id, user.id);
      }
    }

    // Category filter
    if (category && category !== 'All') {
      sql += ' AND d.category = ?';
      params.push(category);
    }

    // Search filter across name, owner name, category, and date
    if (search && typeof search === 'string' && search.trim() !== '') {
      const s = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (
        LOWER(d.name) LIKE ? OR 
        LOWER(d.owner_name) LIKE ? OR 
        LOWER(d.category) LIKE ? OR 
        d.created_at LIKE ?
      )`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY d.created_at DESC';

    const docs = db.prepare(sql).all(...params) as any[];

    // Attach permissions to each document
    const getPerms = db.prepare(`
      SELECT user_id, user_email, user_name, level, granted_at
      FROM DocumentPermissions
      WHERE document_id = ?
    `);

    const result = docs.map(doc => ({
      ...doc,
      permissions: getPerms.all(doc.id)
    }));

    res.json({ success: true, documents: result });
  } catch (err: any) {
    console.error('Fetch documents error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
});

// POST /api/documents/upload - Upload new document with whitelist permissions
apiRouter.post('/documents/upload', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { name, category, size, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Document name is required.' });
    }

    // Role check: Only Owner or Admin can upload documents
    if (user.role === 'viewer') {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Access Denied',
        documentName: name,
        ipAddress: req.ip,
        details: 'Viewer role attempted unauthorized document upload',
        status: 'blocked'
      });
      return res.status(403).json({ success: false, message: 'Viewer accounts do not have upload privileges.' });
    }

    // File type validation
    const ext = name.split('.').pop()?.toLowerCase();
    const allowedExts = ['pdf', 'docx', 'xlsx', 'txt', 'png', 'jpg', 'zip'];
    if (!ext || !allowedExts.includes(ext)) {
      return res.status(400).json({ success: false, message: `Unsupported file extension .${ext}. Whitelisted types: PDF, DOCX, XLSX, TXT, PNG, JPG, ZIP.` });
    }

    const docType = ext === 'pdf' ? 'pdf' : (ext === 'xlsx' || ext === 'xls') ? 'xlsx' : (ext === 'docx' || ext === 'doc') ? 'docx' : 'pdf';
    const docId = `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const hash = crypto.createHash('sha256').update(`${docId}-${name}-${Date.now()}`).digest('hex');
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    db.prepare(`
      INSERT INTO Documents (
        id, name, type, size, size_bytes, category, owner_id, owner_name, hash, file_summary, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      docId,
      name.trim(),
      docType,
      size || '3.6 MB',
      3774873,
      category || 'Reports',
      user.id,
      user.name,
      hash,
      `Encrypted document record under category: ${category || 'Reports'}. Envelope key protected.`,
      formattedDate,
      'Just now'
    );

    // Grant owner full access
    db.prepare(`
      INSERT INTO DocumentPermissions (id, document_id, user_id, user_email, user_name, level, granted_at, granted_by)
      VALUES (?, ?, ?, ?, ?, 'full', ?, ?)
    `).run(`perm_${Date.now()}_owner`, docId, user.id, user.email, user.name, formattedDate, user.name);

    // Add explicitly chosen collaborators
    if (Array.isArray(permissions)) {
      const insertPerm = db.prepare(`
        INSERT OR REPLACE INTO DocumentPermissions (id, document_id, user_id, user_email, user_name, level, granted_at, granted_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of permissions) {
        if (!p.userEmail) continue;
        const normalizedEmail = p.userEmail.trim().toLowerCase();
        // Lookup target user in database to ensure they are registered
        const targetUser = db.prepare('SELECT id, name, email FROM Users WHERE email = ?').get(normalizedEmail) as any;
        if (targetUser && targetUser.id !== user.id) {
          const permId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          insertPerm.run(
            permId,
            docId,
            targetUser.id,
            targetUser.email,
            targetUser.name,
            p.level || 'read',
            formattedDate,
            user.name
          );
        }
      }
    }

    insertAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'Uploaded',
      documentId: docId,
      documentName: name.trim(),
      ipAddress: req.ip,
      details: `Document uploaded under category ${category || 'Reports'}`,
      status: 'success'
    });

    res.status(201).json({ success: true, message: 'Document uploaded successfully.', documentId: docId });
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: 'Server error during document upload.' });
  }
});

// GET /api/documents/:id/download - Authenticated download enforcement
apiRouter.get('/documents/:id/download', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;

    const doc = db.prepare('SELECT * FROM Documents WHERE id = ?').get(docId) as any;
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Access authorization check
    const access = getUserDocAccessLevel(docId, user.id, user.role);
    if (!access) {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Access Denied',
        documentId: doc.id,
        documentName: doc.name,
        ipAddress: req.ip,
        details: `Unauthorized download attempt by ${user.name} (${user.email}) rejected`,
        status: 'blocked'
      });
      return res.status(403).json({ success: false, message: 'You do not have permission to download this document.' });
    }

    // Increment downloads count
    db.prepare('UPDATE Documents SET downloads_count = downloads_count + 1 WHERE id = ?').run(docId);

    insertAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'Downloaded',
      documentId: doc.id,
      documentName: doc.name,
      ipAddress: req.ip,
      details: `Authorized download by ${user.name} (${user.role.toUpperCase()})`,
      status: 'success'
    });

    const filePayload = `TrustVault Verified Document Archive\nDocument: ${doc.name}\nOwner: ${doc.owner_name}\nCategory: ${doc.category}\nCryptographic Hash: ${doc.hash}\nDownloaded At: ${new Date().toISOString()}\nAuthorized User: ${user.name} (${user.email})\nAccess Level: ${access.toUpperCase()}\n\n-- Content Summary --\n${doc.file_summary || 'Confidential Enterprise Document Record.'}`;

    res.setHeader('Content-Disposition', `attachment; filename="${doc.name}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(filePayload);
  } catch (err: any) {
    console.error('Download error:', err);
    res.status(500).json({ success: false, message: 'Failed to download document.' });
  }
});

// GET /api/documents/:id - Read document details & preview with strict permission enforcement
apiRouter.get('/documents/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;

    if (!/^[a-zA-Z0-9_-]+$/.test(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid document identifier.' });
    }

    const doc = db.prepare('SELECT * FROM Documents WHERE id = ?').get(docId) as any;
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const access = getUserDocAccessLevel(docId, user.id, user.role);
    if (!access) {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Access Denied',
        documentId: doc.id,
        documentName: doc.name,
        ipAddress: req.ip,
        details: `Unauthorized document preview attempt by ${user.name} (${user.email}) rejected`,
        status: 'blocked'
      });
      return res.status(403).json({ success: false, message: 'You do not have permission to access this document.' });
    }

    // Increment views count
    db.prepare('UPDATE Documents SET views_count = views_count + 1 WHERE id = ?').run(docId);

    insertAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'Viewed',
      documentId: doc.id,
      documentName: doc.name,
      ipAddress: req.ip,
      details: `Authorized view with ${access.toUpperCase()} clearance`,
      status: 'success'
    });

    const permissions = db.prepare(`
      SELECT user_id, user_email, user_name, level, granted_at, granted_by
      FROM DocumentPermissions
      WHERE document_id = ?
    `).all(docId);

    res.json({
      success: true,
      document: {
        ...doc,
        permissions
      }
    });
  } catch (err: any) {
    console.error('Fetch document detail error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve document.' });
  }
});

// DELETE /api/documents/:id - Delete document (Owner or Super Admin only)
apiRouter.delete('/documents/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;

    const doc = db.prepare('SELECT * FROM Documents WHERE id = ?').get(docId) as any;
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Only direct owner or admin can delete
    if (doc.owner_id !== user.id && user.role !== 'admin') {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Access Denied',
        documentId: doc.id,
        documentName: doc.name,
        ipAddress: req.ip,
        details: `Unauthorized delete attempt by non-owner ${user.name} (${user.role}) rejected`,
        status: 'blocked'
      });
      return res.status(403).json({ success: false, message: 'Only the Document Owner can delete this document.' });
    }

    db.prepare('DELETE FROM Documents WHERE id = ?').run(docId);

    insertAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'Deleted',
      documentId: doc.id,
      documentName: doc.name,
      ipAddress: req.ip,
      details: `Permanently removed document by ${user.name}`,
      status: 'warning'
    });

    res.json({ success: true, message: `Document "${doc.name}" has been permanently purged.` });
  } catch (err: any) {
    console.error('Delete error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
});

// POST /api/documents/:id/permissions - Manage collaborator access & instant revocation
apiRouter.post('/documents/:id/permissions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;
    const { permissions } = req.body; // Array of { userEmail, level }

    const doc = db.prepare('SELECT * FROM Documents WHERE id = ?').get(docId) as any;
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Only owner or admin can update permissions
    if (doc.owner_id !== user.id && user.role !== 'admin') {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Access Denied',
        documentId: doc.id,
        documentName: doc.name,
        ipAddress: req.ip,
        details: `Unauthorized attempt to alter permissions by ${user.name} rejected`,
        status: 'blocked'
      });
      return res.status(403).json({ success: false, message: 'Only the Document Owner can modify access permissions.' });
    }

    // Delete existing collaborator permissions (keep owner)
    db.prepare('DELETE FROM DocumentPermissions WHERE document_id = ? AND user_id != ?').run(docId, doc.owner_id);

    const insertPerm = db.prepare(`
      INSERT OR REPLACE INTO DocumentPermissions (id, document_id, user_id, user_email, user_name, level, granted_at, granted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    let grantedCount = 0;

    if (Array.isArray(permissions)) {
      for (const p of permissions) {
        if (!p.userEmail) continue;
        const normalizedEmail = p.userEmail.trim().toLowerCase();
        const targetUser = db.prepare('SELECT id, name, email FROM Users WHERE email = ?').get(normalizedEmail) as any;
        if (targetUser && targetUser.id !== doc.owner_id) {
          const permId = `perm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          insertPerm.run(
            permId,
            docId,
            targetUser.id,
            targetUser.email,
            targetUser.name,
            p.level || 'read',
            now,
            user.name
          );
          grantedCount++;
        }
      }
    }

    insertAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'Permissions Changed',
      documentId: doc.id,
      documentName: doc.name,
      ipAddress: req.ip,
      details: `Collaborator access list updated. ${grantedCount} active collaborators configured.`,
      status: 'success'
    });

    res.json({ success: true, message: 'Document permissions updated successfully.' });
  } catch (err: any) {
    console.error('Update permissions error:', err);
    res.status(500).json({ success: false, message: 'Failed to update document permissions.' });
  }
});

// POST /api/documents/:id/ai-suggest-access - AI Least-Privilege Advisor (Human-in-the-Loop)
// CRITICAL: The machine must NEVER widen access on its own.
// This route generates candidates for Owner review. Access is ONLY granted when the Owner confirms.
apiRouter.post('/documents/:id/ai-suggest-access', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const docId = req.params.id;

    if (!/^[a-zA-Z0-9_-]+$/.test(docId)) {
      return res.status(400).json({ success: false, message: 'Invalid document identifier.' });
    }

    const doc = db.prepare('SELECT * FROM Documents WHERE id = ?').get(docId) as any;
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Only owner or admin can request AI access recommendations
    if (doc.owner_id !== user.id && user.role !== 'admin') {
      insertAuditLog({
        userId: user.id,
        userName: user.name,
        action: 'Access Denied',
        documentId: doc.id,
        documentName: doc.name,
        ipAddress: req.ip,
        details: `Non-owner ${user.name} attempted to trigger AI access review`,
        status: 'blocked'
      });
      return res.status(403).json({ success: false, message: 'Only the Document Owner can request AI access recommendations.' });
    }

    // Get candidate users excluding the owner
    const candidateUsers = db.prepare(`
      SELECT id, name, email, role, department, title
      FROM Users
      WHERE id != ? AND is_active = 1
      LIMIT 10
    `).all(doc.owner_id) as any[];

    // Rule-based least-privilege analysis based on classification and department
    const suggestions = candidateUsers.map(candidate => {
      let recommendedLevel: 'read' | 'write' = 'read';
      let rationale = '';

      if (doc.category === 'Financial' && candidate.department.toLowerCase().includes('audit')) {
        rationale = 'Candidate is in Financial Auditing; recommended for fiscal compliance under least-privilege READ clearance.';
      } else if (doc.category === 'Compliance' && candidate.department.toLowerCase().includes('security')) {
        rationale = 'Candidate is in InfoSec & Security; recommended for security policy review.';
      } else if (doc.category === 'Engineering' && candidate.department.toLowerCase().includes('operations')) {
        rationale = 'Candidate is in Operations; recommended for technical delivery alignment.';
      } else {
        rationale = `Candidate is in ${candidate.department}; least-privilege READ access proposed for cross-team coordination.`;
      }

      return {
        userId: candidate.id,
        userName: candidate.name,
        userEmail: candidate.email,
        recommendedLevel,
        rationale
      };
    });

    // Record audit: AI generated suggestion, but permissions remain untouched until owner confirms
    insertAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'AI Suggestion Created',
      documentId: doc.id,
      documentName: doc.name,
      ipAddress: req.ip,
      details: `Generated least-privilege candidate recommendations for ${suggestions.length} users. Awaiting explicit Owner confirmation.`,
      status: 'success'
    });

    res.json({
      success: true,
      notice: 'AI suggestions generated under least-privilege protocol. Human confirmation required to grant access.',
      suggestions
    });
  } catch (err: any) {
    console.error('AI suggest access error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate AI access suggestions.' });
  }
});

/* ==========================================================================
   3. AUDIT LOGS ENDPOINTS
   ========================================================================== */

// GET /api/audit-logs - Query audit trail with role filtering
apiRouter.get('/audit-logs', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { action, limit } = req.query;

    let sql = 'SELECT * FROM AuditLogs WHERE 1=1';
    const params: any[] = [];

    // If not admin, only show logs relating to documents they own or actions they took
    if (user.role !== 'admin') {
      sql += ` AND (
        user_id = ? OR document_id IN (
          SELECT id FROM Documents WHERE owner_id = ?
        )
      )`;
      params.push(user.id, user.id);
    }

    if (action && action !== 'All') {
      sql += ' AND action = ?';
      params.push(action);
    }

    sql += ' ORDER BY rowid DESC LIMIT ?';
    params.push(Number(limit) || 100);

    const logs = db.prepare(sql).all(...params);
    res.json({ success: true, auditLogs: logs });
  } catch (err: any) {
    console.error('Fetch audit logs error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

// GET /api/audit-logs/verify - Cryptographic Hash Chain Verification
apiRouter.get('/audit-logs/verify', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = verifyAuditLogChain();
    res.json({ success: true, verification: result });
  } catch (err: any) {
    console.error('Audit verification error:', err);
    res.status(500).json({ success: false, message: 'Ledger verification failed.' });
  }
});

/* ==========================================================================
   4. SUPER ADMINISTRATOR MANAGEMENT ENDPOINTS
   ========================================================================== */

// GET /api/admin/users - Administrator User Management list
apiRouter.get('/admin/users', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id, u.email, u.name, u.role, u.department, u.title, u.is_active, u.created_at, u.last_login_at,
        (SELECT COUNT(*) FROM Documents WHERE owner_id = u.id) as documents_count,
        (SELECT COUNT(*) FROM AuditLogs WHERE user_id = u.id) as actions_count
      FROM Users u
      ORDER BY u.created_at DESC
    `).all();

    res.json({ success: true, users });
  } catch (err: any) {
    console.error('Fetch admin users error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve user list.' });
  }
});

// POST /api/admin/users/:id/toggle-status - Activate or Deactivate user
apiRouter.post('/admin/users/:id/toggle-status', requireAuth, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const targetUser = db.prepare('SELECT * FROM Users WHERE id = ?').get(targetUserId) as any;

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ success: false, message: 'The Super Administrator account cannot be deactivated.' });
    }

    const newStatus = targetUser.is_active ? 0 : 1;
    db.prepare('UPDATE Users SET is_active = ? WHERE id = ?').run(newStatus, targetUserId);

    // If deactivated, revoke all existing sessions immediately
    if (newStatus === 0) {
      db.prepare('DELETE FROM Sessions WHERE user_id = ?').run(targetUserId);
    }

    insertAuditLog({
      userId: req.user!.id,
      userName: req.user!.name,
      action: newStatus === 1 ? 'User Activated' : 'User Deactivated',
      documentId: 'admin_usermgmt',
      documentName: `User: ${targetUser.email}`,
      ipAddress: req.ip,
      details: `Administrator changed status of ${targetUser.name} to ${newStatus === 1 ? 'ACTIVE' : 'DEACTIVATED'}`,
      status: 'warning'
    });

    res.json({ 
      success: true, 
      message: `User ${targetUser.name} is now ${newStatus === 1 ? 'Active' : 'Deactivated'}.`,
      isActive: newStatus 
    });
  } catch (err: any) {
    console.error('Toggle status error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
});

// GET /api/categories - Centralized Category list
apiRouter.get('/categories', (req: Request, res: Response) => {
  const categories = db.prepare('SELECT * FROM Categories ORDER BY name ASC').all();
  res.json({ success: true, categories });
});
