import React, { useState } from 'react';
import { Search, Bell, Menu, Shield, User as UserIcon, Check, UserPlus } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { 
    currentUser, 
    searchQuery, 
    setSearchQuery, 
    loginAsRole, 
    logout,
    documents,
    openPreviewDoc,
    auditLogs
  } = useVault();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Filter documents for search dropdown
  const matchedDocs = searchQuery.trim() 
    ? documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const unreadAlerts = auditLogs.slice(0, 4);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Mobile Menu Trigger & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar matching screenshot */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />

          {/* Search Autocomplete dropdown */}
          {searchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-40">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Matching Documents ({matchedDocs.length})
              </div>
              {matchedDocs.length === 0 ? (
                <div className="px-3 py-3 text-xs text-slate-500 text-center">
                  No documents found matching "{searchQuery}"
                </div>
              ) : (
                matchedDocs.map(doc => (
                  <button
                    key={doc.id}
                    onMouseDown={() => openPreviewDoc(doc)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{doc.name}</p>
                      <span className="text-[10px] text-slate-400">Category: {doc.category} · Owner: {doc.ownerName}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {doc.size}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Header Actions matching screenshot */}
      <div className="flex items-center gap-3">
        {/* Quick Role Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-medium text-slate-700 border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span>Role:</span>
          <span className="font-bold text-slate-900 uppercase font-mono">
            {currentUser.role}
          </span>
        </div>

        {/* Notifications Icon with Dropdown matching screenshot */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(prev => !prev)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="View security notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Security Events &amp; Audit</span>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">All Verified</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {unreadAlerts.map(alert => (
                  <div key={alert.id} className="p-3 hover:bg-slate-50 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-700">{alert.action}</span>
                      <span className="font-mono tabular-nums">{alert.timestamp}</span>
                    </div>
                    <p className="font-medium text-slate-900 mt-0.5">{alert.documentName}</p>
                    <p className="text-[11px] text-slate-500">{alert.userName} · {alert.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar matching screenshot ('H' or photo) */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(prev => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-blue-400/50 transition-all cursor-pointer"
            aria-label="User Profile"
          >
            {currentUser.avatarUrl && !currentUser.avatarUrl.includes('broken') ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center ring-2 ring-slate-200">
                {currentUser.name.charAt(0)}
              </div>
            )}
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-4 pb-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentUser.email}
                </p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-blue-50 text-blue-700">
                    {currentUser.role}
                  </span>
                  <span className="text-[11px] text-slate-500">{currentUser.department}</span>
                </div>
              </div>

              {/* Role Switcher in Profile Menu */}
              <div className="p-3 border-b border-slate-100">
                <span className="text-[10px] uppercase font-mono font-semibold text-slate-400 block mb-1.5">
                  Switch Active Role
                </span>
                <div className="space-y-1">
                  <button
                    onClick={() => { loginAsRole('owner'); setProfileDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                      currentUser.role === 'owner' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Owner Clearance</span>
                    {currentUser.role === 'owner' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => { loginAsRole('viewer'); setProfileDropdownOpen(false); }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                      currentUser.role === 'viewer' ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Viewer Clearance</span>
                    {currentUser.role === 'viewer' && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Sign Up New Account option */}
              <div className="p-2 border-t border-slate-100">
                <button
                  onClick={() => { setProfileDropdownOpen(false); logout('signup'); }}
                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center gap-2 text-blue-600 hover:bg-blue-50 font-semibold transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Enroll New Account (Sign Up)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
