/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VaultProvider, useVault } from './context/VaultContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { DocumentsListView } from './components/DocumentsListView.tsx';
import { AuditTrailView } from './components/AuditTrailView.tsx';
import { AdminPanelView } from './components/AdminPanelView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { UserManagementView } from './components/UserManagementView.tsx';
import { SignInView } from './components/SignInView.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { DocumentPreviewModal } from './components/DocumentPreviewModal.tsx';
import { PermissionsModal } from './components/PermissionsModal.tsx';
import { AccessDeniedModal } from './components/AccessDeniedModal.tsx';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const VaultWorkspace: React.FC = () => {
  const { isAuthenticated, activeTab, toast, currentUser } = useVault();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is logged out, render the exact Sign In screen shown in screenshot
  if (!isAuthenticated) {
    return <SignInView />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 h-full">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Scrollable Content View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'my_documents' && (
              <DocumentsListView
                filterMode={currentUser.role === 'admin' ? 'all' : 'my'}
                title={currentUser.role === 'admin' ? "All Files & Centralized Records" : "My Documents"}
                description={
                  currentUser.role === 'admin'
                    ? "Complete enterprise file repository with cryptographic integrity hashes and real-time permission monitoring."
                    : "Encrypted documents owned and uploaded by your account with cryptographic retention."
                }
              />
            )}
            {activeTab === 'shared' && (
              <DocumentsListView
                filterMode="shared"
                title="Shared With Me"
                description="Secure files shared with your clearance level by internal teams."
              />
            )}
            {activeTab === 'audit_trail' && <AuditTrailView />}
            {activeTab === 'analytics' && <AdminPanelView />}
            {activeTab === 'users' && <UserManagementView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Interactive Overlays */}
      <UploadModal />
      <DocumentPreviewModal />
      <PermissionsModal />
      <AccessDeniedModal />

      {/* Toast Feedback Banner */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-2 fade-in">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <VaultWorkspace />
    </VaultProvider>
  );
}
