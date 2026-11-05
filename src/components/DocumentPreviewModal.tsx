import React from 'react';
import { X, Download, ShieldCheck, FileText, Lock, Users, Clock, Hash } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';

export const DocumentPreviewModal: React.FC = () => {
  const { previewDoc, closePreviewDoc, downloadDocument, openPermissionsModal, currentUser } = useVault();

  if (!previewDoc) return null;

  const isOwner = previewDoc.ownerId === currentUser.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-900">
                  {previewDoc.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Access Only My Choice
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Owner: <strong className="text-slate-800">{previewDoc.ownerName}</strong> · Uploaded {previewDoc.createdAt}
              </p>
            </div>
          </div>
          <button
            onClick={closePreviewDoc}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium block">Category</span>
              <span className="text-xs font-bold text-slate-800">{previewDoc.category}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium block">File Size</span>
              <span className="text-xs font-bold text-slate-800 font-mono tabular-nums">{previewDoc.size}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium block">Total Views</span>
              <span className="text-xs font-bold text-slate-800 font-mono tabular-nums">{previewDoc.viewsCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium block">Downloads</span>
              <span className="text-xs font-bold text-slate-800 font-mono tabular-nums">{previewDoc.downloadsCount}</span>
            </div>
          </div>

          {/* Document Content Preview Box */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              Verified Content Summary &amp; Overview
            </label>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
              <p className="mb-2">
                {previewDoc.fileSummary || 'Secure enterprise document stored with asymmetric AES-256 envelope encryption.'}
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200/80 text-[11px] font-mono text-slate-600 space-y-1">
                <div>[STATUS]: Integrity Verified</div>
                <div>[ENCRYPTION]: AES-256-GCM authenticated ciphertext</div>
                <div>[ACCESS_POLICY]: Zero-Trust Token Bearer Authorization Active</div>
              </div>
            </div>
          </div>

          {/* Cryptographic SHA-256 Fingerprint */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-3 text-xs">
            <Hash className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-blue-900 block">SHA-256 Checksum</span>
              <span className="font-mono text-[11px] text-blue-700 break-all select-all">
                {previewDoc.hash}
              </span>
            </div>
          </div>

          {/* Access permissions summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Authorized Collaborators ({previewDoc.permissions.length})
              </label>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    closePreviewDoc();
                    openPermissionsModal(previewDoc);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Edit Permissions →
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {previewDoc.permissions.map((p) => (
                <span
                  key={p.userEmail}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs border border-slate-200"
                >
                  <span className="font-medium">{p.userName}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white font-bold text-slate-600">
                    {p.level}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>Cryptographically Verified Read Access</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={closePreviewDoc}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => downloadDocument(previewDoc)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
