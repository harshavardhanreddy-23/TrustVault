import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  Download, 
  Clock, 
  CloudUpload, 
  Search, 
  Users2, 
  MoreVertical, 
  Eye, 
  Key, 
  Trash2,
  ShieldAlert,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { ThreatsWidget } from './ThreatsWidget.tsx';
import { BrandBanner } from './BrandBanner.tsx';
import { DocumentItem } from '../types/index.ts';

export const DashboardView: React.FC = () => {
  const { 
    currentUser, 
    documents, 
    auditLogs,
    openUploadModal, 
    openPreviewDoc, 
    openPermissionsModal, 
    downloadDocument, 
    deleteDocument,
    setActiveTab,
    clearAllData,
    loadSampleData
  } = useVault();

  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  // Compute live dynamic stats from real data (no hardcoded sample data or sample dates)
  const totalDocsCount = documents.length;
  const sharedDocsCount = documents.filter(d => d.permissions.length > 1).length;
  const totalDownloadsCount = documents.reduce((acc, d) => acc + (d.downloadsCount || 0), 0);
  const recentActivityText = auditLogs.length > 0 
    ? auditLogs[0].timestamp 
    : 'No activity yet';

  // Take documents for the "Your Documents" widget
  const displayedDocs = documents.slice(0, 5);

  const getDocTypeIcon = (type: DocumentItem['type']) => {
    switch (type) {
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs font-mono shadow-2xs border border-rose-100">
            PDF
          </div>
        );
      case 'docx':
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs font-mono shadow-2xs border border-blue-100">
            DOC
          </div>
        );
      case 'xlsx':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs font-mono shadow-2xs border border-emerald-100">
            XLS
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs font-mono shadow-2xs border border-slate-200">
            FILE
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* Welcome Banner with Data Management */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Welcome, {currentUser.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your documents securely. Access is strictly by your choice.
          </p>
        </div>

        {/* Live Data Controls */}
        <div className="flex items-center gap-2">
          {documents.length > 0 ? (
            <button
              onClick={clearAllData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
              title="Remove all data and reset to a clean state"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data</span>
            </button>
          ) : (
            <button
              onClick={loadSampleData}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-xl transition-all cursor-pointer"
              title="Load demo template documents with live current timestamps"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat KPI Cards - 100% Dynamic from real data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Documents */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Total Documents
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {totalDocsCount}
            </span>
          </div>
        </div>

        {/* Card 2: Shared Documents */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Shared Documents
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {sharedDocsCount}
            </span>
          </div>
        </div>

        {/* Card 3: Downloads */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Downloads
            </span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums leading-tight">
              {totalDownloadsCount}
            </span>
          </div>
        </div>

        {/* Card 4: Recent Activity */}
        <div className="rounded-2xl bg-white p-5 border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-slate-500 block">
              Recent Activity
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate block font-mono">
              {recentActivityText}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Your Documents (left) + Quick Actions (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Your Documents */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold tracking-tight text-slate-900">
                Your Documents
              </h2>
              {displayedDocs.length > 0 && (
                <button
                  onClick={() => setActiveTab('my_documents')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View All</span>
                  <span>→</span>
                </button>
              )}
            </div>

            {/* Document list or Clean Empty State */}
            {displayedDocs.length === 0 ? (
              <div className="py-12 px-4 rounded-xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center justify-center bg-slate-50/50">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <CloudUpload className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  No documents in your vault yet
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Upload your first file to encrypt and set access strictly restricted to your choice.
                </p>
                <button
                  onClick={openUploadModal}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedDocs.map((doc) => {
                  const isMenuOpen = activeMenuDocId === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className="relative flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all group"
                    >
                      <div 
                        onClick={() => openPreviewDoc(doc)}
                        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                      >
                        {getDocTypeIcon(doc.type)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {doc.name}
                            </p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-mono font-semibold border border-emerald-200">
                              Only My Choice
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Owner: <span className="text-slate-700 font-medium">{doc.ownerName}</span> · <span className="text-slate-400">{doc.permissions.length} authorized</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 pl-2">
                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap font-mono tabular-nums">
                          {doc.createdAt}
                        </span>

                        {/* 3 dots action menu */}
                        <div className="relative">
                          <button
                            onClick={() => setActiveMenuDocId(isMenuOpen ? null : doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                            aria-label="Document options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div 
                              onMouseLeave={() => setActiveMenuDocId(null)}
                              className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-40 text-xs animate-in fade-in"
                            >
                              <button
                                onClick={() => {
                                  setActiveMenuDocId(null);
                                  openPreviewDoc(doc);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View File</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuDocId(null);
                                  downloadDocument(doc);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </button>
                              <button
                                onClick={() => {
                                  setActiveMenuDocId(null);
                                  openPermissionsModal(doc);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 hover:text-blue-600 cursor-pointer"
                              >
                                <Key className="w-3.5 h-3.5" />
                                <span>Manage Permissions</span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                onClick={() => {
                                  setActiveMenuDocId(null);
                                  deleteDocument(doc);
                                }}
                                className="w-full text-left px-3 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Actions */}
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900 mb-4">
              Quick Actions
            </h2>

            <div className="space-y-3">
              {/* Action 1: Upload Document */}
              <button
                onClick={openUploadModal}
                className="w-full p-4 rounded-xl bg-sky-50/70 hover:bg-sky-100/70 border border-sky-100 transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-900">
                  Upload Document
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Set permissions &amp; encrypt
                </span>
              </button>

              {/* Action 2: Search */}
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Search documents"]') as HTMLInputElement;
                  if (input) input.focus();
                }}
                className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex items-center justify-center gap-2.5 text-center group cursor-pointer"
              >
                <Search className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">
                  Search
                </span>
              </button>

              {/* Action 3: Manage Permissions */}
              <button
                onClick={() => {
                  if (displayedDocs.length > 0) {
                    openPermissionsModal(displayedDocs[0]);
                  } else {
                    openUploadModal();
                  }
                }}
                className="w-full p-3.5 rounded-xl bg-purple-50/60 hover:bg-purple-100/60 border border-purple-100 transition-all flex items-center justify-center gap-2.5 text-center group cursor-pointer"
              >
                <Users2 className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">
                  Manage Permissions
                </span>
              </button>
            </div>
          </div>

          {/* Quick Security Status */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-600" />
              Role: <strong className="text-slate-800 uppercase font-mono">{currentUser.role}</strong>
            </span>
            <span className="text-emerald-600 font-semibold">Protected</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: THREATS.md Terminal (left/center) + TrustVault Brand Banner (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        <ThreatsWidget />
        <BrandBanner />
      </div>
    </div>
  );
};
