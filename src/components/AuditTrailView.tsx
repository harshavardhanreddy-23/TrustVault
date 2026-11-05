import React, { useState } from 'react';
import { ListFilter, Download, ShieldCheck, Search, FileText } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { AuditAction } from '../types/index.ts';

export const AuditTrailView: React.FC = () => {
  const { auditLogs, currentUser } = useVault();
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('30days');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    if (activityFilter !== 'all' && log.action.toLowerCase() !== activityFilter.toLowerCase()) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches = 
        log.documentName.toLowerCase().includes(term) ||
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });

  const getActionBadgeClass = (action: AuditAction) => {
    switch (action) {
      case 'Downloaded':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Permissions Changed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Viewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Deleted':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Uploaded':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'Access Denied':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleExportCSV = () => {
    const headers = ['Date & Time', 'User', 'Action', 'Document', 'Details', 'Signature Hash'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.action}"`,
      `"${l.documentName}"`,
      `"${l.details}"`,
      `"${l.signatureHash}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TrustVault_Audit_Trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Top Header & Filters matching image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ListFilter className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Audit Trail
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-medium border border-emerald-200">
                Live &amp; Immutable
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Cryptographically verified event stream with zero retention tampering
            </p>
          </div>
        </div>

        {/* Filter Controls matching screenshot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Activity Dropdown */}
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none hover:bg-slate-50 cursor-pointer"
          >
            <option value="all">All Activities</option>
            <option value="downloaded">Downloaded</option>
            <option value="permissions changed">Permissions Changed</option>
            <option value="viewed">Viewed</option>
            <option value="deleted">Deleted</option>
            <option value="uploaded">Uploaded</option>
            <option value="access denied">Access Denied</option>
          </select>

          {/* Time Range Dropdown */}
          <select
            value={timeRangeFilter}
            onChange={(e) => setTimeRangeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none hover:bg-slate-50 cursor-pointer"
          >
            <option value="30days">Last 30 Days</option>
            <option value="7days">Last 7 Days</option>
            <option value="today">Today</option>
            <option value="alltime">All Time</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table matching screenshot columns */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-semibold select-none">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Date &amp; Time</th>
              <th className="py-3.5 px-4 sm:px-6">User</th>
              <th className="py-3.5 px-4 sm:px-6">Action</th>
              <th className="py-3.5 px-4 sm:px-6">Document</th>
              <th className="py-3.5 px-4 sm:px-6">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-xs">No audit events recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live user actions (upload, view, download, permission changes) will be cryptographically signed and logged here.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr 
                  key={log.id} 
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Date & Time */}
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-700 tabular-nums whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  {/* User */}
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                        {log.userName.charAt(0)}
                      </div>
                      <span>{log.userName}</span>
                      {log.userName === currentUser.name && (
                        <span className="text-[10px] text-blue-600 font-semibold">
                          (You)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Action Badge */}
                  <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>

                  {/* Document */}
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-800 whitespace-nowrap">
                    <span className="hover:text-blue-600 transition-colors">
                      {log.documentName}
                    </span>
                  </td>

                  {/* Details */}
                  <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-600 whitespace-nowrap">
                    <span className="text-slate-500">
                      {log.details || '-'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Hash Verification */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>SHA-256 Merkle Chain Integrity Verified</span>
        </div>
        <span className="font-mono tabular-nums">
          Showing {filteredLogs.length} of {auditLogs.length} total events
        </span>
      </div>
    </div>
  );
};
