import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Download, 
  Key, 
  Trash2,
  Lock,
  Users
} from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { DocumentItem, DocCategory } from '../types/index.ts';

interface DocumentsListViewProps {
  filterMode: 'all' | 'my' | 'shared';
  title: string;
  description: string;
}

export const DocumentsListView: React.FC<DocumentsListViewProps> = ({
  filterMode,
  title,
  description
}) => {
  const { 
    documents, 
    currentUser, 
    openUploadModal, 
    openPreviewDoc, 
    openPermissionsModal, 
    downloadDocument, 
    deleteDocument 
  } = useVault();

  const [activeScope, setActiveScope] = useState<'all' | 'my' | 'shared'>(() => {
    if (currentUser.role === 'admin') return 'all';
    return filterMode;
  });

  React.useEffect(() => {
    if (currentUser.role === 'admin' && filterMode === 'my') {
      setActiveScope('all');
    } else {
      setActiveScope(filterMode);
    }
  }, [filterMode, currentUser.role]);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeMenuDocId, setActiveMenuDocId] = useState<string | null>(null);

  const myCount = documents.filter(d => d.ownerId === currentUser.id).length;
  const sharedCount = documents.filter(d => {
    const isShared = d.permissions.some(p => p.userId === currentUser.id || p.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());
    return isShared && (d.ownerId !== currentUser.id || currentUser.role === 'admin');
  }).length;
  const allCount = documents.length;

  const filteredDocs = documents.filter((doc) => {
    // Mode filter
    if (activeScope === 'my' && doc.ownerId !== currentUser.id) {
      return false;
    }
    if (activeScope === 'shared') {
      const isSharedToMe = doc.permissions.some(p => p.userId === currentUser.id || p.userEmail?.toLowerCase() === currentUser.email?.toLowerCase());
      if (!isSharedToMe) return false;
      if (doc.ownerId === currentUser.id && currentUser.role !== 'admin') return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && doc.category.toLowerCase() !== categoryFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matches = 
        doc.name.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.ownerName.toLowerCase().includes(q);
      if (!matches) return false;
    }

    return true;
  });

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
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {description}
          </p>
        </div>

        <button
          onClick={openUploadModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Scope Selector: All Files / My Documents / Shared With Me */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveScope('all')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeScope === 'all'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Files ({allCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveScope('my')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeScope === 'my'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Documents ({myCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveScope('shared')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeScope === 'shared'
              ? 'bg-white text-blue-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Shared With Me ({sharedCount})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by file name or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="reports">Reports</option>
            <option value="financial">Financial</option>
            <option value="legal">Legal</option>
            <option value="engineering">Engineering</option>
            <option value="compliance">Compliance</option>
          </select>
          <span className="text-xs text-slate-400 font-mono">
            ({filteredDocs.length} files)
          </span>
        </div>
      </div>

      {/* Documents Grid / Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200/80 font-semibold select-none">
              <tr>
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Owner</th>
                <th className="py-3.5 px-6">Permissions</th>
                <th className="py-3.5 px-6">Size</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No documents found matching the current criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  const isMenuOpen = activeMenuDocId === doc.id;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Name & Type */}
                      <td className="py-3.5 px-6">
                        <div
                          onClick={() => openPreviewDoc(doc)}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          {getDocTypeIcon(doc.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {doc.name}
                              </span>
                              {doc.isRestricted && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 font-mono font-bold">
                                  Restricted
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">
                              Uploaded {doc.createdAt}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-6 text-slate-700 font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[11px]">
                          {doc.category}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-6 whitespace-nowrap font-medium text-slate-900">
                        {doc.ownerName}
                      </td>

                      {/* Permissions */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-600 font-medium">
                            {doc.permissions.length} users
                          </span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-6 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {doc.size}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setActiveMenuDocId(isMenuOpen ? null : doc.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div 
                              onMouseLeave={() => setActiveMenuDocId(null)}
                              className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-40 text-xs text-left animate-in fade-in"
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
