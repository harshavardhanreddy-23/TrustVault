import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  Search, 
  ShieldAlert, 
  Mail, 
  Building, 
  FileText, 
  Activity, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';

export const UserManagementView: React.FC = () => {
  const { adminUsers, toggleUserStatus, fetchAdminUsers, currentUser, showToast } = useVault();
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'admin' | 'owner' | 'viewer'>('All');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredUsers = adminUsers.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.department.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalUsers = adminUsers.length;
  const adminCount = adminUsers.filter(u => u.role === 'admin').length;
  const ownerCount = adminUsers.filter(u => u.role === 'owner').length;
  const viewerCount = adminUsers.filter(u => u.role === 'viewer').length;
  const activeCount = adminUsers.filter(u => u.is_active !== 0).length;

  const handleToggle = async (userId: string, isSuperAdmin: boolean) => {
    if (isSuperAdmin) {
      showToast('The Super Administrator account cannot be deactivated.', 'error');
      return;
    }
    setTogglingId(userId);
    try {
      await toggleUserStatus(userId);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[11px] font-mono font-bold tracking-wide uppercase">
              SUPER ADMINISTRATOR CONTROLS
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            User Management &amp; Role Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centrally manage user accounts, inspect document activity, and control workspace access clearance.
          </p>
        </div>

        <button
          onClick={() => { fetchAdminUsers(); showToast('Refreshed user directory.', 'info'); }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Directory</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Registered</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{totalUsers}</p>
          <span className="text-[11px] text-emerald-600 font-medium">{activeCount} Active Sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Super Admin</span>
            <ShieldAlert className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{adminCount}</p>
          <span className="text-[11px] text-slate-500 font-mono">1 Permanent Authority</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Document Owners</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{ownerCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Upload &amp; Share Rights</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Viewers</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{viewerCount}</p>
          <span className="text-[11px] text-purple-600 font-medium">Read-Only Clearance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          {(['All', 'admin', 'owner', 'viewer'] as const).map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'All' ? 'All Roles' : role.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role Clearance</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Docs Owned</th>
                <th className="py-3 px-4 text-center">Audit Actions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSuperAdmin = user.role === 'admin';
                  const isActive = user.is_active !== 0;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 ${
                            isSuperAdmin 
                              ? 'bg-blue-600 text-white' 
                              : user.role === 'owner' 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-purple-600 text-white'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight flex items-center gap-1.5">
                              {user.name}
                              {user.id === currentUser.id && (
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">You</span>
                              )}
                            </p>
                            <span className="text-[11px] text-slate-500 font-normal block">
                              {user.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          isSuperAdmin 
                            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                            : user.role === 'owner' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : 'bg-purple-100 text-purple-800 border border-purple-200'
                        }`}>
                          {isSuperAdmin && <ShieldAlert className="w-3 h-3" />}
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {user.department || 'Operations'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {user.documents_count || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 tabular-nums">
                        {user.actions_count || 0}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/80'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed">
                            <Lock className="w-3 h-3" />
                            Permanent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggle(user.id, isSuperAdmin)}
                            disabled={togglingId === user.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                              isActive
                                ? 'text-rose-600 hover:bg-rose-50 border border-rose-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Governance Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
          <span>
            Account deactivation immediately revokes all active auth sessions and blocks document downloads.
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Trigger-enforced ledger: 100% Immutable
        </span>
      </div>
    </div>
  );
};
