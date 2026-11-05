import React from 'react';
import { useVault } from '../context/VaultContext.tsx';
import { ShieldCheck, UserCheck } from 'lucide-react';

export const AccessDeniedModal: React.FC = () => {
  const { accessDeniedInfo, closeAccessDenied, currentUser, loginAsRole } = useVault();

  if (!accessDeniedInfo.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl border border-slate-100 transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Red Shield Lock Icon matching image */}
        <div className="mx-auto mb-6 flex items-center justify-center">
          <div className="relative w-28 h-28 rounded-full bg-rose-50 flex items-center justify-center">
            {/* Outer soft ring */}
            <div className="absolute inset-0 rounded-full border border-rose-200 animate-pulse" />
            
            {/* Red Lock Icon */}
            <svg 
              className="w-14 h-14 text-rose-500" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
            </svg>

            {/* Red Badge with 'X' in lower right */}
            <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md ring-2 ring-white">
              <svg className="w-4 h-4 stroke-[3]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Access Denied!
        </h2>

        {/* Description */}
        <p className="text-slate-700 text-sm font-medium mb-1">
          You do not have permission to view this document.
        </p>
        <p className="text-slate-500 text-xs mb-6">
          {accessDeniedInfo.reason || 'Contact the document owner if you believe this is a mistake.'}
        </p>

        {/* Current Identity Warning */}
        <div className="mb-6 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80 flex items-center justify-between">
          <span className="text-left">
            Current user: <strong className="text-slate-900">{currentUser.name}</strong>
          </span>
          <span className="px-2 py-0.5 rounded font-mono font-bold uppercase text-[10px] bg-slate-200 text-slate-800">
            {currentUser.role}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={closeAccessDenied}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all text-sm cursor-pointer"
          >
            Go Back
          </button>

          {/* Owner-controlled access choice */}
          {currentUser.role === 'viewer' && (
            <button
              onClick={() => {
                loginAsRole('owner');
                closeAccessDenied();
              }}
              className="w-full py-2 px-3 text-xs text-emerald-700 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Switch to Document Owner to manage access</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
