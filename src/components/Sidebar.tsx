import React from 'react';
import { 
  LayoutDashboard, 
  Files, 
  Users2, 
  Clock3, 
  ShieldAlert, 
  Settings, 
  LogOut,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { activeTab, setActiveTab, logout, currentUser, loginAsRole } = useVault();

  // Role-based navigation items
  const navItems = currentUser.role === 'admin'
    ? [
        { id: 'analytics' as const, label: 'Admin Dashboard', icon: ShieldAlert },
        { id: 'users' as const, label: 'User Management', icon: Users2 },
        { id: 'my_documents' as const, label: 'All Files', icon: Files },
        { id: 'audit_trail' as const, label: 'Audit Logs', icon: Clock3 },
        { id: 'settings' as const, label: 'Settings', icon: Settings },
      ]
    : currentUser.role === 'owner'
    ? [
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'my_documents' as const, label: 'My Documents', icon: Files },
        { id: 'shared' as const, label: 'Shared With Me', icon: Users2 },
        { id: 'audit_trail' as const, label: 'Audit Logs', icon: Clock3 },
        { id: 'settings' as const, label: 'Settings', icon: Settings },
      ]
    : [
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'shared' as const, label: 'Shared With Me', icon: Users2 },
        { id: 'audit_trail' as const, label: 'Audit Logs', icon: Clock3 },
        { id: 'settings' as const, label: 'Settings', icon: Settings },
      ];

  const handleNavClick = (id: typeof activeTab) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header matching screenshot */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-sky-500/20">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <rect x="9" y="11" width="6" height="5" rx="1" />
            <path d="M10 11V9a2 2 0 1 1 4 0v2" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-extrabold tracking-tight text-white leading-none">
            TrustVault
          </span>
          <span className="text-[10px] text-sky-400 font-mono tracking-wider font-semibold mt-1">
            ENTERPRISE VAULT
          </span>
        </div>
      </div>

      {/* Navigation List matching screenshot */}
      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Quick Role Sandbox Switcher in Sidebar */}
        <div className="pt-6 pb-2">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <UserCheck className="w-3 h-3 text-sky-400" />
            <span>Simulate Role</span>
          </div>
          <div className="grid grid-cols-2 gap-2 px-1">
            <button
              onClick={() => loginAsRole('owner')}
              className={`py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                currentUser.role === 'owner'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Owner
            </button>
            <button
              onClick={() => loginAsRole('viewer')}
              className={`py-1.5 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer text-center ${
                currentUser.role === 'viewer'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              Viewer
            </button>
          </div>
        </div>
      </nav>

      {/* Current User & Logout Section matching screenshot */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-slate-800/40 border border-slate-800">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-700 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 text-sky-400 font-bold text-xs flex items-center justify-center ring-2 ring-slate-700 shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {currentUser.name}
            </p>
            <span className="text-[10px] text-sky-400 font-mono uppercase tracking-wider block">
              {currentUser.role}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <button
            onClick={() => logout('signup')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-sky-400 hover:text-white hover:bg-sky-950/40 border border-sky-500/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-sky-400" />
            <span>Sign Up / Enroll</span>
          </button>

          <button
            onClick={() => logout('signin')}
            className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
