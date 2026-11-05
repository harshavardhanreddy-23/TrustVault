import React, { useState } from 'react';
import { Shield, X, UserPlus, Trash2, Key } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { PermissionLevel, DocumentPermission } from '../types/index.ts';

export const PermissionsModal: React.FC = () => {
  const { permissionsModalDoc, closePermissionsModal, updatePermissions, registeredUsers } = useVault();
  
  const [grantEmail, setGrantEmail] = useState('');
  const [grantLevel, setGrantLevel] = useState<PermissionLevel>('read');
  const [currentPermissions, setCurrentPermissions] = useState<DocumentPermission[]>(
    permissionsModalDoc ? permissionsModalDoc.permissions : []
  );

  if (!permissionsModalDoc) return null;

  const handleAdd = () => {
    if (!grantEmail.trim()) return;

    const matched = registeredUsers.find(
      u => u.email.toLowerCase() === grantEmail.trim().toLowerCase() ||
           u.name.toLowerCase().includes(grantEmail.trim().toLowerCase())
    );

    const newPerm: DocumentPermission = {
      userId: matched ? matched.id : `user_custom_${Date.now()}`,
      userName: matched ? matched.name : grantEmail.trim().split('@')[0],
      userEmail: grantEmail.trim(),
      role: matched ? matched.role : 'viewer',
      level: grantLevel,
      grantedAt: 'Just now'
    };

    setCurrentPermissions(prev => [...prev.filter(p => p.userEmail !== grantEmail.trim()), newPerm]);
    setGrantEmail('');
  };

  const handleRemove = (userEmail: string) => {
    setCurrentPermissions(prev => prev.filter(p => p.userEmail !== userEmail));
  };

  const handleSave = () => {
    updatePermissions(permissionsModalDoc.id, currentPermissions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  Manage Permissions
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Access Only My Choice
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {permissionsModalDoc.name}
              </p>
            </div>
          </div>
          <button
            onClick={closePermissionsModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Grant Access input bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Grant New Access:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="User name or email..."
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdd();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <select
                value={grantLevel}
                onChange={(e) => setGrantLevel(e.target.value as PermissionLevel)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="full">Full Access</option>
              </select>
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Grant
              </button>
            </div>
          </div>

          {/* List of current permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                Authorized Collaborators ({currentPermissions.length}):
              </label>
              <span className="text-[11px] text-amber-600 font-medium">
                Instant Revocation Enabled
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {currentPermissions.map((perm) => (
                <div
                  key={perm.userEmail}
                  className="p-3 bg-white flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                      {perm.userName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{perm.userName}</p>
                      <p className="text-[11px] text-slate-400">{perm.userEmail}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      perm.level === 'full'
                        ? 'bg-emerald-100 text-emerald-800'
                        : perm.level === 'write'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {perm.level === 'full' ? 'Full Access' : perm.level === 'write' ? 'Write' : 'Read'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemove(perm.userEmail)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Revoke Access Immediately"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={closePermissionsModal}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
