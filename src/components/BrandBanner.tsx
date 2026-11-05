import React from 'react';
import { Shield, FileCheck, Zap, Users } from 'lucide-react';

export const BrandBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50/80 p-6 sm:p-8 border border-sky-100 shadow-xs">
      {/* Decorative cyber grid backdrop */}
      <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-200/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        {/* TrustVault Shield Logo */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-2xl bg-gradient-to-b from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/25 ring-4 ring-sky-100">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <rect x="9" y="11" width="6" height="5" rx="1" />
            <path d="M10 11V9a2 2 0 1 1 4 0v2" />
          </svg>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-1">
          TrustVault
        </h3>
        <p className="text-sky-600 font-bold tracking-tight text-sm sm:text-base mb-6">
          Secure. Share. Audit.
        </p>

        {/* 4 Pillars Grid matching image */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl pt-2">
          {/* Pillar 1 */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white/80 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-2.5">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 text-center">
              Role-Based Security
            </span>
          </div>

          {/* Pillar 2 */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white/80 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
              <FileCheck className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 text-center">
              Complete Audit Trail
            </span>
          </div>

          {/* Pillar 3 */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white/80 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 text-center">
              Instant Revocation
            </span>
          </div>

          {/* Pillar 4 */}
          <div className="flex flex-col items-center p-3 sm:p-4 rounded-xl bg-white/80 border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 text-center">
              Trusted Collaboration
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
