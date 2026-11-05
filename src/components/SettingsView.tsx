import React, { useState } from 'react';
import { Shield, Key, Lock, Clock, Database, CheckCircle2, RefreshCw } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';

export const SettingsView: React.FC = () => {
  const { currentUser, showToast } = useVault();

  const [sessionTimeout, setSessionTimeout] = useState('15');
  const [requireMFA, setRequireMFA] = useState(true);
  const [immutableAudit, setImmutableAudit] = useState(true);
  const [urlRouteGuards, setUrlRouteGuards] = useState(true);
  const [ipRestriction, setIpRestriction] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Enterprise security policy updated successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Security Settings &amp; Policies
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure zero-trust access boundaries, encryption standards, and retention constraints.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Policy Section 1: Authentication & Token Security */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Key className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Session &amp; Token Architecture</h2>
              <p className="text-xs text-slate-500">Defense against token theft, replay attacks, and stale authorization states</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Ephemeral Token Expiration</p>
                <p className="text-slate-500">Short-lived bearer token duration before automatic silent refresh</p>
              </div>
              <select
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="5">5 Minutes</option>
                <option value="15">15 Minutes (Recommended)</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-semibold text-slate-900">Mandatory Multi-Factor Authentication (MFA)</p>
                <p className="text-slate-500">Enforce hardware key or TOTP challenge on sensitive document operations</p>
              </div>
              <input
                type="checkbox"
                checked={requireMFA}
                onChange={(e) => setRequireMFA(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Policy Section 2: Audit Trail Immutability */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Audit Trail Integrity &amp; Cryptographic Constraints</h2>
              <p className="text-xs text-slate-500">Immutable database-level constraints for legal and compliance auditability</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">Write-Once Append-Only Log Constraint</p>
                <p className="text-slate-500">Rejects UPDATE and DELETE SQL queries on audit records via database trigger</p>
              </div>
              <input
                type="checkbox"
                checked={immutableAudit}
                onChange={(e) => setImmutableAudit(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-semibold text-slate-900">Strict URL Route Security Guard</p>
                <p className="text-slate-500">Intercepts direct link requests with real-time session role validation</p>
              </div>
              <input
                type="checkbox"
                checked={urlRouteGuards}
                onChange={(e) => setUrlRouteGuards(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Apply Security Policies
          </button>
        </div>
      </form>
    </div>
  );
};
