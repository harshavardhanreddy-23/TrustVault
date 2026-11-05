import { User, DocumentItem, AuditLog, SecurityThreat } from '../types/index.ts';

export const MOCK_USERS: User[] = [
  {
    id: 'user_harsha',
    name: 'Harsha Vardhan Reddy',
    email: 'harsha@trustvault.internal',
    role: 'owner',
    avatarUrl: '/src/assets/images/avatar_harsha_1793858253812.jpg',
    title: 'Lead Systems Architect & Document Owner',
    department: 'Core Infrastructure'
  },
  {
    id: 'user_ravi',
    name: 'Ravi Kumar',
    email: 'ravi.kumar@trustvault.internal',
    role: 'owner',
    avatarUrl: '/src/assets/images/avatar_ravi_1793858252815.jpg',
    title: 'Senior Product Manager',
    department: 'Product Operations'
  },
  {
    id: 'user_sneha',
    name: 'Sneha Reddy',
    email: 'sneha.reddy@trustvault.internal',
    role: 'viewer',
    avatarUrl: '/src/assets/images/avatar_sneha_1793858252763.jpg',
    title: 'Financial Analyst (Auditor)',
    department: 'Financial Auditing'
  }
];

// Clean slate: Sample data and sample dates removed by default
export const INITIAL_DOCUMENTS: DocumentItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];

// Optional sample data template with dynamic relative dates (no hardcoded sample dates)
const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const yesterdayDate = new Date(Date.now() - 86400000);
const yesterdayStr = yesterdayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_1',
    name: 'Project_Report.pdf',
    type: 'pdf',
    size: '4.8 MB',
    sizeBytes: 5033164,
    category: 'Reports',
    ownerId: 'user_harsha',
    ownerName: 'Harsha Vardhan Reddy',
    ownerAvatar: '/src/assets/images/avatar_harsha_1793858253812.jpg',
    createdAt: todayStr,
    updatedAt: todayStr,
    downloadsCount: 19,
    viewsCount: 46,
    accessOnlyMyChoice: true,
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileSummary: 'Comprehensive quarterly engineering report on vault architecture, data retention lifecycle, and end-to-end cryptographic integrity protocols.',
    permissions: [
      {
        userId: 'user_harsha',
        userName: 'Harsha Vardhan Reddy',
        userEmail: 'harsha@trustvault.internal',
        role: 'owner',
        level: 'full',
        grantedAt: todayStr
      },
      {
        userId: 'user_ravi',
        userName: 'Ravi Kumar',
        userEmail: 'ravi.kumar@trustvault.internal',
        role: 'owner',
        level: 'full',
        grantedAt: todayStr
      },
      {
        userId: 'user_sneha',
        userName: 'Sneha Reddy',
        userEmail: 'sneha.reddy@trustvault.internal',
        role: 'viewer',
        level: 'read',
        grantedAt: todayStr
      }
    ]
  },
  {
    id: 'doc_2',
    name: 'Company_Policy.docx',
    type: 'docx',
    size: '1.2 MB',
    sizeBytes: 1258291,
    category: 'Legal',
    ownerId: 'user_harsha',
    ownerName: 'Harsha Vardhan Reddy',
    createdAt: yesterdayStr,
    updatedAt: yesterdayStr,
    downloadsCount: 14,
    viewsCount: 38,
    accessOnlyMyChoice: true,
    hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    fileSummary: 'Organization-wide cybersecurity, confidential data handling, remote work access rules, and non-disclosure obligations.',
    permissions: [
      {
        userId: 'user_harsha',
        userName: 'Harsha Vardhan Reddy',
        userEmail: 'harsha@trustvault.internal',
        role: 'owner',
        level: 'full',
        grantedAt: yesterdayStr
      },
      {
        userId: 'user_ravi',
        userName: 'Ravi Kumar',
        userEmail: 'ravi.kumar@trustvault.internal',
        role: 'owner',
        level: 'read',
        grantedAt: yesterdayStr
      },
      {
        userId: 'user_sneha',
        userName: 'Sneha Reddy',
        userEmail: 'sneha.reddy@trustvault.internal',
        role: 'viewer',
        level: 'read',
        grantedAt: yesterdayStr
      }
    ]
  },
  {
    id: 'doc_3',
    name: 'Budget_2026.xlsx',
    type: 'xlsx',
    size: '8.4 MB',
    sizeBytes: 8808038,
    category: 'Financial',
    ownerId: 'user_harsha',
    ownerName: 'Harsha Vardhan Reddy',
    ownerAvatar: '/src/assets/images/avatar_harsha_1793858253812.jpg',
    createdAt: yesterdayStr,
    updatedAt: yesterdayStr,
    downloadsCount: 9,
    viewsCount: 22,
    accessOnlyMyChoice: true,
    hash: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    fileSummary: 'Detailed fiscal year projections, cloud infrastructure spend, security audits, software licenses, and headcount allocations.',
    permissions: [
      {
        userId: 'user_harsha',
        userName: 'Harsha Vardhan Reddy',
        userEmail: 'harsha@trustvault.internal',
        role: 'owner',
        level: 'full',
        grantedAt: yesterdayStr
      },
      {
        userId: 'user_ravi',
        userName: 'Ravi Kumar',
        userEmail: 'ravi.kumar@trustvault.internal',
        role: 'owner',
        level: 'read',
        grantedAt: yesterdayStr
      }
    ]
  }
];

export const SAMPLE_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_1',
    timestamp: todayStr + ' 14:32',
    userId: 'user_harsha',
    userName: 'Harsha Vardhan Reddy',
    action: 'Downloaded',
    documentId: 'doc_1',
    documentName: 'Project_Report.pdf',
    ipAddress: '127.0.0.1',
    details: 'IP: 127.0.0.1',
    status: 'success',
    signatureHash: '9a3f...d88c'
  },
  {
    id: 'log_2',
    timestamp: todayStr + ' 13:15',
    userId: 'user_ravi',
    userName: 'Ravi Kumar',
    action: 'Permissions Changed',
    documentId: 'doc_1',
    documentName: 'Project_Report.pdf',
    ipAddress: '192.168.1.88',
    details: 'Granted: Sneha Reddy (Read)',
    status: 'success',
    signatureHash: '4c71...e201'
  },
  {
    id: 'log_3',
    timestamp: yesterdayStr + ' 16:20',
    userId: 'user_sneha',
    userName: 'Sneha Reddy',
    action: 'Viewed',
    documentId: 'doc_2',
    documentName: 'Company_Policy.docx',
    ipAddress: '192.168.1.45',
    details: '-',
    status: 'success',
    signatureHash: '7b22...8f90'
  }
];

export const SECURITY_THREATS: SecurityThreat[] = [
  {
    id: 1,
    threat: 'Unauthorized Access via Direct URL',
    solution: 'Server-side permission checks',
    status: 'mitigated',
    description: 'Bypassing navigation by guessing direct document URLs is rejected by session validation middleware.',
    simKey: 'direct_url'
  },
  {
    id: 2,
    threat: 'Privilege Escalation & Bypass',
    solution: 'Access strictly restricted to Owner choice',
    status: 'mitigated',
    description: 'Zero admin backdoors. Only users specifically chosen by the document owner are authorized.',
    simKey: 'privilege_escalation'
  },
  {
    id: 3,
    threat: 'Token Theft',
    solution: 'Short-lived tokens + logout',
    status: 'mitigated',
    description: 'Cryptographic session tokens expire automatically, coupled with instant one-click session invalidation.',
    simKey: 'token_theft'
  },
  {
    id: 4,
    threat: 'Audit Log Tampering',
    solution: 'Immutable logs (DB constraints)',
    status: 'mitigated',
    description: 'Append-only audit ledger with cryptographic SHA-256 forward hashes and write-once DB constraints.',
    simKey: 'audit_tamper'
  },
  {
    id: 5,
    threat: 'File Upload Malware',
    solution: 'File type & size validation',
    status: 'mitigated',
    description: 'MIME sniffing, strict file extension whitelist, and 50MB payload limits block malicious script payloads.',
    simKey: 'malware_upload'
  }
];

export const ACCESS_TRENDS_DATA = [
  { day: 'Mon', views: 0, downloads: 0 },
  { day: 'Tue', views: 0, downloads: 0 },
  { day: 'Wed', views: 0, downloads: 0 },
  { day: 'Thu', views: 0, downloads: 0 },
  { day: 'Fri', views: 0, downloads: 0 },
  { day: 'Sat', views: 0, downloads: 0 },
  { day: 'Sun', views: 0, downloads: 0 }
];

export const TOP_ACTIVE_USERS = [
  {
    id: 'user_harsha',
    name: 'Harsha Vardhan Reddy',
    count: 0,
    avatar: '/src/assets/images/avatar_harsha_1793858253812.jpg',
    role: 'Owner'
  },
  {
    id: 'user_ravi',
    name: 'Ravi Kumar',
    count: 0,
    avatar: '/src/assets/images/avatar_ravi_1793858252815.jpg',
    role: 'Owner'
  },
  {
    id: 'user_sneha',
    name: 'Sneha Reddy',
    count: 0,
    avatar: '/src/assets/images/avatar_sneha_1793858252763.jpg',
    role: 'Viewer'
  }
];
