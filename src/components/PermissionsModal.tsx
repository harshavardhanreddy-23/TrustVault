import React, { useState, useEffect } from 'react';
import { Shield, X, UserPlus, Trash2, Key, Sparkles, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { PermissionLevel, DocumentPermission } from '../types/index.ts';

interface AISuggestion {
  userId: string;
  userName: string;
  userEmail: string;
  recommendedLevel: PermissionLevel;
  rationale: string;
}

export const PermissionsModal: React.FC = () => {
  const { permissionsModalDoc, closePermissionsModal, updatePermissions, registeredUsers, showToast } = useVault();
  
  const [grantEmail, setGrantEmail] = useState('');
  const [grantLevel, setGrantLevel] = useState<PermissionLevel>('read');
  const [currentPermissions, setCurrentPermissions] = useState<DocumentPermission[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showAiAdvisor, setShowAiAdvisor] = useState(false);

  useEffect(() => {
    if (permissionsModalDoc) {
      setCurrentPermissions(permissionsModalDoc.permissions || []);
      setAiSuggestions([]);
      setShowAiAdvisor(false);
    }
  }, [permissionsModalDoc]);

  if (!permissionsModalDoc) return null;

  const handleFetchAiSuggestions = async () => {
    try {
      setLoadingAi(true);
      setShowAiAdvisor(true);
      const token = localStorage.getItem('trustvault_token');
      const res = await fetch(`/api/documents/${permissionsModalDoc.id}/ai-suggest-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
        showToast('AI least-privilege suggestions generated. Human confirmation required.', 'info');
      } else {
        showToast(data.message || 'Failed to fetch AI suggestions.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error requesting AI advice.', 'error');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleAcceptAiSuggestion = (suggestion: AISuggestion) => {
    const newPerm: DocumentPermission = {
      userId: suggestion.userId,
      userName: suggestion.userName,
      userEmail: suggestion.userEmail,
      role: 'viewer',
      level: suggestion.recommendedLevel,
      grantedAt: 'Staged by Owner'
    };
    setCurrentPermissions(prev => [...prev.filter(p => p.userEmail !== suggestion.userEmail), newPerm]);
    setAiSuggestions(prev => prev.filter(s => s.userEmail !== suggestion.userEmail));
    showToast(`Accepted recommendation for ${suggestion.userName}. Save changes to enforce.`, 'success');
  };

  const handleDismissAiSuggestion = (userEmail: string) => {
    setAiSuggestions(prev => prev.filter(s => s.userEmail !== userEmail));
  };

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
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
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
              <p className="text-xs text-slate-500 font-mono truncate max-w-md">
                {permissionsModalDoc.name}
              </p>
            </div>
          </div>
          <button
            onClick={closePermissionsModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* AI Least-Privilege Advisor Banner & Trigger */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    AI Access Advisor (Least-Privilege)
                    <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                      Human Confirmation Required
                    </span>
                  </h3>
                  <p className="text-[11px] text-indigo-700/80 mt-0.5 leading-relaxed">
                    The machine suggests candidate collaborators based on category least-privilege. <strong className="font-semibold text-indigo-900">The AI never widens access on its own.</strong> An explicit human owner confirmation is mandatory.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFetchAiSuggestions}
                disabled={loadingAi}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {loadingAi ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Consult AI
                  </>
                )}
              </button>
            </div>

            {/* AI Candidate Suggestions Card List */}
            {showAiAdvisor && (
              <div className="mt-3 pt-3 border-t border-indigo-100/80 space-y-2">
                <p className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider">
                  Candidate Recommendations:
                </p>
                {aiSuggestions.length === 0 && !loadingAi && (
                  <p className="text-xs text-slate-500 italic py-1">
                    No additional collaborators recommended. All department least-privilege targets are satisfied.
                  </p>
                )}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {aiSuggestions.map(s => (
                    <div
                      key={s.userEmail}
                      className="p-2.5 rounded-lg bg-white border border-indigo-100 flex items-start justify-between gap-2 shadow-2xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{s.userName}</span>
                          <span className="text-[10px] font-mono text-slate-500">{s.userEmail}</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {s.recommendedLevel.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {s.rationale}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptAiSuggestion(s)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-md shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Accept & Stage
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissAiSuggestion(s.userEmail)}
                          className="px-2 py-1 text-slate-400 hover:text-slate-600 text-[11px] rounded-md transition-colors cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Manual Grant Access input bar */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Grant New Access Manually:
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
                <option value="read">Read Only</option>
                <option value="write">Write</option>
                <option value="full">Full Access</option>
              </select>
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* List of current permissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800">
                Staged Collaborators ({currentPermissions.length}):
              </label>
              <span className="text-[11px] text-amber-600 font-medium">
                Instant Revocation Enforced on Save
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto bg-slate-50/30">
              {currentPermissions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No explicit collaborators granted. Document is accessible strictly by the Owner.
                </div>
              ) : (
                currentPermissions.map((perm) => (
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <span className="text-[11px] text-slate-500">
            Audit trail records every permission grant and revocation.
          </span>
          <div className="flex items-center gap-2">
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
    </div>
  );
};

