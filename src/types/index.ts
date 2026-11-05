export type Role = 'owner' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  title: string;
  department: string;
}

export type PermissionLevel = 'read' | 'write' | 'full';

export interface DocumentPermission {
  userId: string;
  userName: string;
  userEmail: string;
  role: Role;
  level: PermissionLevel;
  grantedAt: string;
}

export type DocCategory = 'Reports' | 'Financial' | 'Legal' | 'Engineering' | 'HR' | 'Compliance';
export type DocType = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'zip';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocType;
  size: string;
  sizeBytes: number;
  category: DocCategory;
  ownerId: string;
  ownerName: string;
  ownerAvatar?: string;
  createdAt: string;
  updatedAt: string;
  downloadsCount: number;
  viewsCount: number;
  permissions: DocumentPermission[];
  isRestricted?: boolean;
  accessOnlyMyChoice?: boolean;
  fileSummary?: string;
  hash: string;
}

export type AuditAction = 
  | 'Downloaded' 
  | 'Permissions Changed' 
  | 'Viewed' 
  | 'Deleted' 
  | 'Uploaded' 
  | 'Access Denied';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  documentId: string;
  documentName: string;
  ipAddress: string;
  details: string;
  status: 'success' | 'blocked' | 'warning';
  signatureHash: string;
}

export interface SecurityThreat {
  id: number;
  threat: string;
  solution: string;
  status: 'mitigated' | 'enforced';
  description: string;
  simKey: 'direct_url' | 'privilege_escalation' | 'token_theft' | 'audit_tamper' | 'malware_upload';
}
