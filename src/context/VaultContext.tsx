import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Role, 
  DocumentItem, 
  AuditLog, 
  DocumentPermission, 
  DocCategory,
  SecurityThreat
} from '../types/index.ts';
import { SECURITY_THREATS } from '../data/mockData.ts';

interface AccessDeniedInfo {
  isOpen: boolean;
  documentName?: string;
  reason?: string;
}

export interface LoginResult {
  success: boolean;
  error?: 'not_found' | 'invalid_password' | 'missing_fields' | 'forbidden' | 'server_error';
  message?: string;
  user?: User;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
}

interface VaultContextType {
  currentUser: User;
  isAuthenticated: boolean;
  registeredUsers: User[];
  adminUsers: User[];
  signupSuccessNotice: string | null;
  setSignupSuccessNotice: (notice: string | null) => void;
  prefillEmail: string;
  setPrefillEmail: (email: string) => void;
  activeTab: 'dashboard' | 'my_documents' | 'shared' | 'audit_trail' | 'analytics' | 'users' | 'settings';
  documents: DocumentItem[];
  auditLogs: AuditLog[];
  threats: SecurityThreat[];
  isUploadModalOpen: boolean;
  previewDoc: DocumentItem | null;
  permissionsModalDoc: DocumentItem | null;
  accessDeniedInfo: AccessDeniedInfo;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  searchQuery: string;
  clearAllData: () => void;
  loadSampleData: () => void;
  
  // Navigation & filtering
  setActiveTab: (tab: 'dashboard' | 'my_documents' | 'shared' | 'audit_trail' | 'analytics' | 'users' | 'settings') => void;
  setSearchQuery: (query: string) => void;
  loginAsRole: (role: Role) => void;
  loginWithEmail: (email: string, password?: string) => Promise<LoginResult>;
  registerUser: (params: {
    name: string;
    email: string;
    role: Role;
    department: string;
    password?: string;
  }) => Promise<RegisterResult>;
  authViewMode: 'signin' | 'signup';
  setAuthViewMode: (mode: 'signin' | 'signup') => void;
  logout: (targetMode?: 'signin' | 'signup') => void;
  
  // Modals & Inspection
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openPreviewDoc: (doc: DocumentItem) => void;
  closePreviewDoc: () => void;
  openPermissionsModal: (doc: DocumentItem) => void;
  closePermissionsModal: () => void;
  closeAccessDenied: () => void;
  showAccessDenied: (documentName: string, reason?: string) => void;
  
  // Document Operations
  uploadDocument: (newDoc: {
    name: string;
    category: DocCategory;
    size?: string;
    permissions: DocumentPermission[];
  }) => Promise<void>;
  downloadDocument: (doc: DocumentItem) => Promise<void>;
  deleteDocument: (doc: DocumentItem) => Promise<void>;
  updatePermissions: (docId: string, permissions: DocumentPermission[]) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  simulateSecurityTest: (threat: SecurityThreat) => void;

  // Super Administrator Operations
  fetchAdminUsers: () => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const DEFAULT_USER: User = {
  id: 'user_active',
  name: 'Workspace Member',
  email: 'user@trustvault.internal',
  role: 'owner',
  title: 'Document Owner',
  department: 'Core Operations'
};

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('trustvault_token') || null;
  });

  const [signupSuccessNotice, setSignupSuccessNotice] = useState<string | null>(null);
  const [prefillEmail, setPrefillEmail] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authViewMode, setAuthViewMode] = useState<'signin' | 'signup'>('signin');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my_documents' | 'shared' | 'audit_trail' | 'analytics' | 'users' | 'settings'>('dashboard');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [threats] = useState<SecurityThreat[]>(SECURITY_THREATS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [permissionsModalDoc, setPermissionsModalDoc] = useState<DocumentItem | null>(null);
  const [accessDeniedInfo, setAccessDeniedInfo] = useState<AccessDeniedInfo>({ isOpen: false });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const activeToken = token || localStorage.getItem('trustvault_token');
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }
    return headers;
  }, [token]);

  // Fetch Documents from server
  const fetchDocuments = useCallback(async (search?: string) => {
    try {
      const activeToken = token || localStorage.getItem('trustvault_token');
      if (!activeToken) return;

      const url = new URL('/api/documents', window.location.origin);
      if (search !== undefined && search.trim() !== '') {
        url.searchParams.set('search', search.trim());
      }

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.documents)) {
          const mapped: DocumentItem[] = data.documents.map((d: any) => ({
            id: d.id,
            name: d.name,
            type: d.type || 'pdf',
            size: d.size || '3.4 MB',
            sizeBytes: d.size_bytes || 3565158,
            category: d.category || 'Reports',
            ownerId: d.owner_id,
            ownerName: d.owner_name,
            ownerAvatar: d.owner_id === 'user_superadmin' ? undefined : undefined,
            createdAt: d.created_at,
            updatedAt: d.updated_at || 'Just now',
            downloadsCount: d.downloads_count || 0,
            viewsCount: d.views_count || 0,
            hash: d.hash,
            fileSummary: d.file_summary,
            permissions: (d.permissions || []).map((p: any) => ({
              userId: p.user_id,
              userName: p.user_name,
              userEmail: p.user_email,
              role: (p.level === 'full' ? 'owner' : 'viewer') as Role,
              level: p.level,
              grantedAt: p.granted_at || 'Just now'
            }))
          }));
          setDocuments(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  }, [getAuthHeaders, token]);

  // Fetch Audit Logs from server
  const fetchAuditLogs = useCallback(async () => {
    try {
      const activeToken = token || localStorage.getItem('trustvault_token');
      if (!activeToken) return;

      const res = await fetch('/api/audit-logs?limit=200', {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.auditLogs)) {
          const mapped: AuditLog[] = data.auditLogs.map((l: any) => ({
            id: l.id,
            timestamp: l.timestamp,
            userId: l.user_id || 'anonymous',
            userName: l.user_name,
            action: l.action,
            documentId: l.document_id || '',
            documentName: l.document_name || '-',
            ipAddress: l.ip_address || '127.0.0.1',
            details: l.details || '-',
            status: l.status,
            signatureHash: l.signature_hash
          }));
          setAuditLogs(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  }, [getAuthHeaders, token]);

  // Fetch Admin Users list
  const fetchAdminUsers = useCallback(async () => {
    try {
      const activeToken = token || localStorage.getItem('trustvault_token');
      if (!activeToken) return;

      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setAdminUsers(data.users);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
    }
  }, [getAuthHeaders, token]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchDocuments(searchQuery),
      fetchAuditLogs(),
      fetchAdminUsers()
    ]);
  }, [fetchDocuments, fetchAuditLogs, fetchAdminUsers, searchQuery]);

  // Debounced search trigger
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        fetchDocuments(searchQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isAuthenticated, fetchDocuments]);

  // On mount: check token validity with /api/auth/me
  useEffect(() => {
    const savedToken = localStorage.getItem('trustvault_token');
    if (!savedToken) return;

    fetch('/api/auth/me', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${savedToken}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setCurrentUser(data.user);
          setIsAuthenticated(true);
          setToken(savedToken);
          // Auto-navigate Super Admin to Analytics / Dashboard
          if (data.user.role === 'admin') {
            setActiveTab('analytics');
          } else {
            setActiveTab('dashboard');
          }
        } else {
          localStorage.removeItem('trustvault_token');
          setToken(null);
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('trustvault_token');
        setToken(null);
        setIsAuthenticated(false);
      });
  }, []);

  // When authenticated, refresh documents and audit logs
  useEffect(() => {
    if (isAuthenticated && token) {
      refreshAllData();
    }
  }, [isAuthenticated, token, refreshAllData]);

  // Login With Email against backend REST API
  const loginWithEmail = async (email: string, password?: string): Promise<LoginResult> => {
    const trimmed = email.toLowerCase().trim();
    if (!trimmed) {
      showToast('Please enter your work email address', 'error');
      return { success: false, error: 'missing_fields', message: 'Please enter your work email address.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, password: password || '' })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Unable to log in.', 'error');
        return {
          success: false,
          error: res.status === 401 ? (data.message.includes('Password') ? 'invalid_password' : 'not_found') : 'forbidden',
          message: data.message
        };
      }

      // Successful login
      localStorage.setItem('trustvault_token', data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      setSignupSuccessNotice(null);
      setAccessDeniedInfo({ isOpen: false });

      // Role-Based Redirection:
      // Administrator is automatically redirected to the administrative dashboard
      if (data.user.role === 'admin') {
        setActiveTab('analytics');
        showToast(`Welcome Super Administrator! Accessing centralized security dashboard.`, 'success');
      } else {
        setActiveTab('dashboard');
        showToast(`Welcome back, ${data.user.name}! Authenticated with ${data.user.role.toUpperCase()} clearance.`, 'success');
      }

      return {
        success: true,
        user: data.user
      };
    } catch (err) {
      console.error('Login request failed:', err);
      showToast('Network error during login. Please try again.', 'error');
      return {
        success: false,
        error: 'server_error',
        message: 'Network communication failure. Please check server.'
      };
    }
  };

  // Register User against backend REST API with duplicate rejection
  const registerUser = async (params: {
    name: string;
    email: string;
    role: Role;
    department: string;
    password?: string;
  }): Promise<RegisterResult> => {
    const trimmedEmail = params.email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: params.name.trim(),
          email: trimmedEmail,
          role: params.role,
          department: params.department,
          password: params.password
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.message || 'Registration failed.', 'error');
        return {
          success: false,
          message: data.message
        };
      }

      // Successful registration: redirect to login page as specified in Section 1
      setPrefillEmail(trimmedEmail);
      setSignupSuccessNotice(`Account registered successfully with ${data.role?.toUpperCase() || 'OWNER'} clearance! Please log in.`);
      setAuthViewMode('signin');
      showToast(`Account created for ${params.name}. Please log in.`, 'success');

      return {
        success: true,
        message: data.message
      };
    } catch (err) {
      console.error('Registration failed:', err);
      showToast('Network error during registration.', 'error');
      return {
        success: false,
        message: 'Network failure during registration.'
      };
    }
  };

  const logout = async (targetMode: 'signin' | 'signup' = 'signin') => {
    try {
      const activeToken = token || localStorage.getItem('trustvault_token');
      if (activeToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: getAuthHeaders()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('trustvault_token');
      setToken(null);
      setIsAuthenticated(false);
      setAuthViewMode(targetMode);
      setSignupSuccessNotice(null);
      showToast(targetMode === 'signup' ? 'Ready to register new user.' : 'Session invalidated. Logged out.', 'info');
    }
  };

  const loginAsRole = (role: Role) => {
    // Quick demo switch
    if (role === 'admin') {
      loginWithEmail('harshavdugga@gmail.com', 'Harsha@1122');
    } else if (role === 'viewer') {
      loginWithEmail('viewer@trustvault.internal', 'Viewer@TrustVault2026!');
    } else {
      loginWithEmail('owner@trustvault.internal', 'Owner@TrustVault2026!');
    }
  };

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const openPreviewDoc = (doc: DocumentItem) => {
    // Check access
    const isOwner = doc.ownerId === currentUser.id;
    const hasPerm = doc.permissions.some(p => p.userId === currentUser.id || p.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !hasPerm && !isAdmin) {
      showAccessDenied(doc.name, `Your account (${currentUser.name} - ${currentUser.role.toUpperCase()}) does not have clearance to view this document.`);
      return;
    }

    setPreviewDoc(doc);
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, viewsCount: d.viewsCount + 1 } : d));
  };

  const closePreviewDoc = () => setPreviewDoc(null);

  const openPermissionsModal = (doc: DocumentItem) => {
    if (doc.ownerId !== currentUser.id && currentUser.role !== 'admin') {
      showAccessDenied(doc.name, 'Access strictly limited to owner choice: Only the Document Owner can manage permissions.');
      return;
    }
    setPermissionsModalDoc(doc);
  };

  const closePermissionsModal = () => setPermissionsModalDoc(null);
  const closeAccessDenied = () => setAccessDeniedInfo({ isOpen: false });

  const showAccessDenied = (documentName: string, reason?: string) => {
    setAccessDeniedInfo({
      isOpen: true,
      documentName,
      reason
    });
  };

  const uploadDocument = async (newDoc: {
    name: string;
    category: DocCategory;
    size?: string;
    permissions: DocumentPermission[];
  }) => {
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newDoc.name,
          category: newDoc.category,
          size: newDoc.size || '3.5 MB',
          permissions: newDoc.permissions.map(p => ({
            userEmail: p.userEmail,
            level: p.level
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 403) {
          showAccessDenied(newDoc.name, data.message || 'Viewer accounts do not have upload privileges.');
        } else {
          showToast(data.message || 'Upload failed.', 'error');
        }
        return;
      }

      setIsUploadModalOpen(false);
      showToast(`"${newDoc.name}" uploaded successfully with encrypted ACLs.`, 'success');
      await refreshAllData();
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Network error during upload.', 'error');
    }
  };

  const downloadDocument = async (doc: DocumentItem) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}/download`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        showAccessDenied(doc.name, errorData.message || 'You do not have permission to download this document.');
        await fetchAuditLogs();
        return;
      }

      // Download file blob
      const textBlob = await res.blob();
      const downloadUrl = URL.createObjectURL(textBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = doc.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      showToast(`Downloaded "${doc.name}" (Audit log recorded)`, 'success');
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, downloadsCount: d.downloadsCount + 1 } : d));
      await fetchAuditLogs();
    } catch (err) {
      console.error('Download error:', err);
      showToast('Network error during download.', 'error');
    }
  };

  const deleteDocument = async (doc: DocumentItem) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showAccessDenied(doc.name, data.message || 'Only the Document Owner can delete this document.');
        return;
      }

      if (previewDoc?.id === doc.id) setPreviewDoc(null);
      if (permissionsModalDoc?.id === doc.id) setPermissionsModalDoc(null);

      showToast(`Document "${doc.name}" was permanently purged.`, 'info');
      await refreshAllData();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error during deletion.', 'error');
    }
  };

  const updatePermissions = async (docId: string, permissions: DocumentPermission[]) => {
    try {
      const res = await fetch(`/api/documents/${docId}/permissions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          permissions: permissions.map(p => ({
            userEmail: p.userEmail,
            level: p.level
          }))
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Failed to update permissions.', 'error');
        return;
      }

      setPermissionsModalDoc(null);
      showToast('Access rules updated and applied immediately.', 'success');
      await refreshAllData();
    } catch (err) {
      console.error('Update permissions error:', err);
      showToast('Network error updating permissions.', 'error');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.message || 'Failed to change user status.', 'error');
        return;
      }

      showToast(data.message, 'success');
      await fetchAdminUsers();
      await fetchAuditLogs();
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast('Network error during user status update.', 'error');
    }
  };

  const simulateSecurityTest = (threat: SecurityThreat) => {
    if (threat.simKey === 'direct_url') {
      showAccessDenied('Restricted_System_Core.enc', 'Simulated Direct URL Bypass intercepted by Server Route Guard!');
    } else if (threat.simKey === 'privilege_escalation') {
      showToast('Owner-Choice Test: Zero admin bypass. Only collaborators explicitly granted by the document owner can access files.', 'success');
    } else if (threat.simKey === 'token_theft') {
      showToast('Simulating Token Rotation: Current ephemeral bearer session rotated. Re-authenticated.', 'info');
    } else if (threat.simKey === 'audit_tamper') {
      showToast('Audit Log Immutability check: Write-once SQLite hash integrity verified. Zero mutation allowed.', 'success');
    } else if (threat.simKey === 'malware_upload') {
      showToast('Malware Upload simulation: MIME type signature checks rejected illegal .exe/.sh scripts.', 'success');
    }
  };

  const clearAllData = () => {
    setDocuments([]);
    setAuditLogs([]);
    showToast('Document cache refreshed.', 'info');
  };

  const loadSampleData = () => {
    refreshAllData();
    showToast('Loaded synchronized database documents and audit log records.', 'success');
  };

  return (
    <VaultContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        registeredUsers: adminUsers,
        adminUsers,
        signupSuccessNotice,
        setSignupSuccessNotice,
        prefillEmail,
        setPrefillEmail,
        activeTab,
        documents,
        auditLogs,
        threats,
        isUploadModalOpen,
        previewDoc,
        permissionsModalDoc,
        accessDeniedInfo,
        toast,
        searchQuery,
        clearAllData,
        loadSampleData,
        setActiveTab,
        setSearchQuery,
        loginAsRole,
        loginWithEmail,
        registerUser,
        authViewMode,
        setAuthViewMode,
        logout,
        openUploadModal,
        closeUploadModal,
        openPreviewDoc,
        closePreviewDoc,
        openPermissionsModal,
        closePermissionsModal,
        closeAccessDenied,
        showAccessDenied,
        uploadDocument,
        downloadDocument,
        deleteDocument,
        updatePermissions,
        showToast,
        simulateSecurityTest,
        fetchAdminUsers,
        toggleUserStatus,
        refreshAllData
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
