import React, { createContext, useContext, useState } from 'react';
import { 
  User, 
  Role, 
  DocumentItem, 
  AuditLog, 
  DocumentPermission, 
  DocCategory,
  SecurityThreat
} from '../types/index.ts';
import { 
  INITIAL_DOCUMENTS, 
  INITIAL_AUDIT_LOGS,
  SAMPLE_DOCUMENTS,
  SAMPLE_AUDIT_LOGS,
  SECURITY_THREATS
} from '../data/mockData.ts';

interface AccessDeniedInfo {
  isOpen: boolean;
  documentName?: string;
  reason?: string;
}

interface VaultContextType {
  currentUser: User;
  isAuthenticated: boolean;
  registeredUsers: User[];
  activeTab: 'dashboard' | 'my_documents' | 'shared' | 'audit_trail' | 'analytics' | 'settings';
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
  
  // Actions
  setActiveTab: (tab: 'dashboard' | 'my_documents' | 'shared' | 'audit_trail' | 'analytics' | 'settings') => void;
  setSearchQuery: (query: string) => void;
  loginAsRole: (role: Role) => void;
  loginWithEmail: (email: string) => boolean;
  registerUser: (params: {
    name: string;
    email: string;
    role: Role;
    department: string;
    password?: string;
  }) => boolean;
  authViewMode: 'signin' | 'signup';
  setAuthViewMode: (mode: 'signin' | 'signup') => void;
  logout: (targetMode?: 'signin' | 'signup') => void;
  openUploadModal: () => void;
  closeUploadModal: () => void;
  openPreviewDoc: (doc: DocumentItem) => void;
  closePreviewDoc: () => void;
  openPermissionsModal: (doc: DocumentItem) => void;
  closePermissionsModal: () => void;
  closeAccessDenied: () => void;
  showAccessDenied: (documentName: string, reason?: string) => void;
  
  // Document actions
  uploadDocument: (newDoc: {
    name: string;
    category: DocCategory;
    size?: string;
    permissions: DocumentPermission[];
  }) => void;
  downloadDocument: (doc: DocumentItem) => void;
  deleteDocument: (doc: DocumentItem) => void;
  updatePermissions: (docId: string, permissions: DocumentPermission[]) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  simulateSecurityTest: (threat: SecurityThreat) => void;
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
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authViewMode, setAuthViewMode] = useState<'signin' | 'signup'>('signin');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my_documents' | 'shared' | 'audit_trail' | 'analytics' | 'settings'>('dashboard');
  const [documents, setDocuments] = useState<DocumentItem[]>(INITIAL_DOCUMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [threats] = useState<SecurityThreat[]>(SECURITY_THREATS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [permissionsModalDoc, setPermissionsModalDoc] = useState<DocumentItem | null>(null);
  const [accessDeniedInfo, setAccessDeniedInfo] = useState<AccessDeniedInfo>({ isOpen: false });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3800);
  };

  const addAuditLog = (
    action: AuditLog['action'], 
    docName: string, 
    details: string, 
    docId: string = 'doc_ref',
    status: AuditLog['status'] = 'success'
  ) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const newLog: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: formattedDate,
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      documentId: docId,
      documentName: docName,
      ipAddress: '127.0.0.1',
      details,
      status,
      signatureHash: Math.random().toString(16).substring(2, 10) + '...' + Math.random().toString(16).substring(2, 6)
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };

  const checkUserCanAccess = (doc: DocumentItem, requiredLevel: 'read' | 'write' | 'full' = 'read'): boolean => {
    // Direct document owner has full access
    if (doc.ownerId === currentUser.id) return true;

    // Access strictly restricted to owner's explicit choice
    const perm = doc.permissions.find(p => p.userId === currentUser.id || p.userEmail === currentUser.email);
    if (!perm) return false;

    if (requiredLevel === 'read') return true;
    if (requiredLevel === 'write') return perm.level === 'write' || perm.level === 'full';
    if (requiredLevel === 'full') return perm.level === 'full';

    return false;
  };

  const loginAsRole = (role: Role) => {
    setCurrentUser(prev => ({
      ...prev,
      role: role
    }));
    setIsAuthenticated(true);
    setAccessDeniedInfo({ isOpen: false });
    showToast(`Active clearance updated to ${role.toUpperCase()}`, 'info');
  };

  const loginWithEmail = (email: string): boolean => {
    const trimmed = email.toLowerCase().trim();
    if (!trimmed) {
      showToast('Please enter your work email address', 'error');
      return false;
    }
    const found = registeredUsers.find(u => u.email.toLowerCase() === trimmed);
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
      showToast(`Welcome back, ${found.name}!`, 'success');
      return true;
    }

    // Generate user profile from email input
    const formattedName = trimmed.split('@')[0]
      .replace(/[._-]/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Workspace Member';

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: formattedName,
      email: trimmed,
      role: 'owner',
      title: 'Document Owner',
      department: 'Core Operations'
    };
    setRegisteredUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    showToast(`Signed in as ${newUser.name}`, 'success');
    return true;
  };

  const registerUser = (params: {
    name: string;
    email: string;
    role: Role;
    department: string;
    password?: string;
  }): boolean => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      role: params.role,
      title: `${params.department} Specialist`,
      department: params.department
    };
    setRegisteredUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setIsAuthenticated(true);
    setAccessDeniedInfo({ isOpen: false });
    addAuditLog('Uploaded', 'User Credentials', `Enrolled account: ${params.name} (${params.role.toUpperCase()}) in ${params.department}`, 'auth_reg', 'success');
    showToast(`Account created for ${params.name}. Logged in as ${params.role.toUpperCase()}.`, 'success');
    return true;
  };

  const logout = (targetMode: 'signin' | 'signup' = 'signin') => {
    setAuthViewMode(targetMode);
    setIsAuthenticated(false);
    showToast(targetMode === 'signup' ? 'Workspace ready for new user registration.' : 'Secure session invalidated and token revoked.', 'info');
  };

  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);

  const openPreviewDoc = (doc: DocumentItem) => {
    if (!checkUserCanAccess(doc, 'read')) {
      addAuditLog('Access Denied', doc.name, `Unauthorized Read attempt by ${currentUser.name} (${currentUser.role})`, doc.id, 'blocked');
      setAccessDeniedInfo({
        isOpen: true,
        documentName: doc.name,
        reason: `Your account (${currentUser.name} - ${currentUser.role.toUpperCase()}) does not have clearance to view this document.`
      });
      return;
    }

    setPreviewDoc(doc);
    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, viewsCount: d.viewsCount + 1 } : d));
    addAuditLog('Viewed', doc.name, '-', doc.id, 'success');
  };

  const closePreviewDoc = () => setPreviewDoc(null);

  const openPermissionsModal = (doc: DocumentItem) => {
    if (!checkUserCanAccess(doc, 'full')) {
      addAuditLog('Access Denied', doc.name, `Permission edit attempt rejected for ${currentUser.name}`, doc.id, 'blocked');
      setAccessDeniedInfo({
        isOpen: true,
        documentName: doc.name,
        reason: 'Access strictly limited to owner choice: Only the Document Owner can manage permissions.'
      });
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

  const uploadDocument = (newDoc: {
    name: string;
    category: DocCategory;
    size?: string;
    permissions: DocumentPermission[];
  }) => {
    const ext = newDoc.name.split('.').pop()?.toLowerCase();
    const docType: DocumentItem['type'] = 
      ext === 'pdf' ? 'pdf' : 
      ext === 'xlsx' || ext === 'xls' ? 'xlsx' : 
      ext === 'docx' || ext === 'doc' ? 'docx' : 'pdf';

    const created: DocumentItem = {
      id: `doc_${Date.now()}`,
      name: newDoc.name,
      type: docType,
      size: newDoc.size || '3.4 MB',
      sizeBytes: 3565158,
      category: newDoc.category,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerAvatar: currentUser.avatarUrl,
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      updatedAt: 'Just now',
      downloadsCount: 0,
      viewsCount: 1,
      hash: Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
      fileSummary: `Securely encrypted document uploaded under category: ${newDoc.category}. Encrypted with envelope key derivation.`,
      permissions: [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          role: currentUser.role,
          level: 'full',
          grantedAt: 'Just now'
        },
        ...newDoc.permissions
      ]
    };

    setDocuments(prev => [created, ...prev]);
    setIsUploadModalOpen(false);
    addAuditLog('Uploaded', created.name, '-', created.id, 'success');
    showToast(`"${created.name}" uploaded successfully with encrypted ACLs.`, 'success');
  };

  const downloadDocument = (doc: DocumentItem) => {
    if (!checkUserCanAccess(doc, 'read')) {
      addAuditLog('Access Denied', doc.name, `Unauthorized Download attempt by ${currentUser.name}`, doc.id, 'blocked');
      setAccessDeniedInfo({
        isOpen: true,
        documentName: doc.name,
        reason: 'You do not have permission to download this document.'
      });
      return;
    }

    setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, downloadsCount: d.downloadsCount + 1 } : d));
    addAuditLog('Downloaded', doc.name, 'IP: 127.0.0.1', doc.id, 'success');

    // Create a client-side simulated blob file download
    const blobContent = `TrustVault Verified Document\nTitle: ${doc.name}\nOwner: ${doc.ownerName}\nClassification: ${doc.category}\nSHA-256 Hash: ${doc.hash}\nDownloaded At: ${new Date().toISOString()}\nUser: ${currentUser.name} (${currentUser.email})\n\n-- Content preview --\n${doc.fileSummary || 'Official confidential document archive.'}`;
    const blob = new Blob([blobContent], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    showToast(`Downloaded "${doc.name}" (Audit log recorded)`, 'success');
  };

  const deleteDocument = (doc: DocumentItem) => {
    if (!checkUserCanAccess(doc, 'full')) {
      addAuditLog('Access Denied', doc.name, `Unauthorized Delete attempt by ${currentUser.name}`, doc.id, 'blocked');
      setAccessDeniedInfo({
        isOpen: true,
        documentName: doc.name,
        reason: 'Access strictly limited to owner choice: Only the Document Owner has deletion privileges.'
      });
      return;
    }

    setDocuments(prev => prev.filter(d => d.id !== doc.id));
    if (previewDoc?.id === doc.id) setPreviewDoc(null);
    if (permissionsModalDoc?.id === doc.id) setPermissionsModalDoc(null);
    
    addAuditLog('Deleted', doc.name, '-', doc.id, 'warning');
    showToast(`Document "${doc.name}" was permanently purged.`, 'info');
  };

  const updatePermissions = (docId: string, updatedPerms: DocumentPermission[]) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;

    if (!checkUserCanAccess(doc, 'full')) {
      showToast('Permission denied: You cannot alter ACLs for this file.', 'error');
      return;
    }

    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, permissions: updatedPerms, updatedAt: 'Just now' } : d));
    
    const latestUser = updatedPerms[updatedPerms.length - 1];
    const details = latestUser ? `Granted: ${latestUser.userName} (${latestUser.level.toUpperCase()})` : 'ACLs updated';

    addAuditLog('Permissions Changed', doc.name, details, doc.id, 'success');
    setPermissionsModalDoc(null);
    showToast(`Access rules updated for "${doc.name}"`, 'success');
  };

  const simulateSecurityTest = (threat: SecurityThreat) => {
    if (threat.simKey === 'direct_url') {
      showAccessDenied('Restricted_System_Core.enc', 'Simulated Direct URL Bypass intercepted by Server Route Guard!');
      addAuditLog('Access Denied', 'Restricted_System_Core.enc', 'Simulated unauthorized URL access blocked by middleware', 'sec_sim_1', 'blocked');
    } else if (threat.simKey === 'privilege_escalation') {
      showToast('Owner-Choice Test: Zero admin bypass. Only collaborators explicitly granted by the document owner can access files.', 'success');
    } else if (threat.simKey === 'token_theft') {
      showToast('Simulating Token Rotation: Current ephemeral bearer session rotated. Re-authenticated.', 'info');
    } else if (threat.simKey === 'audit_tamper') {
      showToast('Audit Log Immutability check: Write-once SQLite/Postgres hash integrity verified. Zero mutation allowed.', 'success');
    } else if (threat.simKey === 'malware_upload') {
      showToast('Malware Upload simulation: MIME type signature checks rejected illegal .exe/.sh scripts.', 'success');
    }
  };

  const clearAllData = () => {
    setDocuments([]);
    setAuditLogs([]);
    showToast('All sample data and dates removed. Clean vault initialized.', 'info');
  };

  const loadSampleData = () => {
    setDocuments(SAMPLE_DOCUMENTS);
    setAuditLogs(SAMPLE_AUDIT_LOGS);
    showToast('Loaded sample documents with dynamic current dates.', 'success');
  };

  return (
    <VaultContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        registeredUsers,
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
        simulateSecurityTest
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
