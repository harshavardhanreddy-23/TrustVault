import React, { useState, useRef } from 'react';
import { UploadCloud, X, UserPlus, File, CheckCircle2 } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { DocCategory, PermissionLevel, DocumentPermission } from '../types/index.ts';

export const UploadModal: React.FC = () => {
  const { isUploadModalOpen, closeUploadModal, uploadDocument, currentUser, registeredUsers } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('3.8 MB');
  const [category, setCategory] = useState<DocCategory>('Reports');
  const [grantEmail, setGrantEmail] = useState('');
  const [grantLevel, setGrantLevel] = useState<PermissionLevel>('read');
  const [dragOver, setDragOver] = useState(false);

  // Initial access list starts with current user or dynamically dated collaborators
  const [accessList, setAccessList] = useState<DocumentPermission[]>([]);

  if (!isUploadModalOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFileName(f.name);
      setFileSizeStr(`${(f.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFileName(f.name);
      setFileSizeStr(`${(f.size / (1024 * 1024)).toFixed(1)} MB`);
    }
  };

  const handleAddUser = () => {
    if (!grantEmail.trim()) return;

    const matchedUser = registeredUsers.find(
      u => u.email.toLowerCase() === grantEmail.trim().toLowerCase() ||
           u.name.toLowerCase().includes(grantEmail.trim().toLowerCase())
    );

    const userName = matchedUser ? matchedUser.name : grantEmail.split('@')[0];
    const newPerm: DocumentPermission = {
      userId: matchedUser ? matchedUser.id : `user_custom_${Date.now()}`,
      userName: userName,
      userEmail: grantEmail.trim(),
      role: matchedUser ? matchedUser.role : 'viewer',
      level: grantLevel,
      grantedAt: 'Just now'
    };

    setAccessList(prev => [...prev.filter(p => p.userEmail !== grantEmail.trim()), newPerm]);
    setGrantEmail('');
  };

  const handleRemovePermission = (userEmail: string) => {
    setAccessList(prev => prev.filter(p => p.userEmail !== userEmail));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = fileName.trim() || 'Executive_Summary_2026.pdf';
    uploadDocument({
      name: finalName,
      category,
      size: fileSizeStr,
      permissions: accessList
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Upload Document
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a file and set permissions
            </p>
          </div>
          <button
            onClick={closeUploadModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {currentUser.role === 'viewer' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
              Viewer clearance is restricted to read-only access. Only Document Owners and Administrators can upload new files.
            </div>
          )}
          {/* Drag & drop dropzone matching image */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center ${
              dragOver ? 'border-blue-500 bg-blue-50/50' : 'border-blue-200 bg-sky-50/30 hover:bg-sky-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            {fileName ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                <File className="w-4 h-4 text-blue-600" />
                <span>{fileName}</span>
                <span className="text-xs text-slate-400 font-normal">({fileSizeStr})</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-700">
                  Drag &amp; drop files here
                </p>
                <span className="text-xs text-slate-400 my-1">or</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  Choose File
                </button>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700 whitespace-nowrap">
              Category:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocCategory)}
              className="flex-1 px-3 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="Reports">Reports</option>
              <option value="Financial">Financial</option>
              <option value="Legal">Legal</option>
              <option value="Engineering">Engineering</option>
              <option value="HR">HR</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>

          {/* Grant Access Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900">
                Grant Access:
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                Access Only My Choice (Zero Bypass)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter user emails to grant..."
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddUser();
                  }
                }}
                className="flex-1 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <select
                value={grantLevel}
                onChange={(e) => setGrantLevel(e.target.value as PermissionLevel)}
                className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none"
              >
                <option value="read">Read</option>
                <option value="write">Write</option>
                <option value="full">Full Access</option>
              </select>
              <button
                type="button"
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Helper Guidance */}
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-500">
              <span>Owner choice: Grant access to specific collaborator emails without any backdoor bypass.</span>
            </div>

            {/* List of Granted Users matching screenshot */}
            <div className="mt-4 space-y-2">
              {accessList.map((perm) => (
                <div
                  key={perm.userEmail}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50/80 rounded-lg border border-slate-200/70 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-800">
                      {perm.userName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({perm.userEmail})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                      perm.level === 'full'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : perm.level === 'write'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      {perm.level === 'full' ? 'Full Access' : perm.level === 'write' ? 'Write' : 'Read'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePermission(perm.userEmail)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Revoke access"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer buttons matching screenshot */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={closeUploadModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
