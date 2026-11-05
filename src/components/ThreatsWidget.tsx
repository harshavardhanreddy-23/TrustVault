import React, { useState } from 'react';
import { Check, Play, ShieldAlert, Sparkles } from 'lucide-react';
import { useVault } from '../context/VaultContext.tsx';
import { SecurityThreat } from '../types/index.ts';

export const ThreatsWidget: React.FC = () => {
  const { threats, simulateSecurityTest } = useVault();
  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);

  const handleRunSim = (threat: SecurityThreat) => {
    setActiveSimulation(threat.simKey);
    simulateSecurityTest(threat);
    setTimeout(() => {
      setActiveSimulation(null);
    }, 1500);
  };

  return (
    <div className="rounded-2xl bg-slate-950 text-slate-100 shadow-xl border border-slate-800 overflow-hidden font-mono flex flex-col">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500/90" />
          <div className="w-3 h-3 rounded-full bg-amber-500/90" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
          <span className="ml-2 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
            THREATS.md
          </span>
        </div>
        <span className="text-[11px] text-slate-500 tracking-wider">
          IMMUTABLE KERNEL
        </span>
      </div>

      {/* Terminal Content matching image */}
      <div className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed overflow-x-auto space-y-3">
        {threats.map((threat, index) => {
          const threatLineNum = index * 2 + 1;
          const solLineNum = index * 2 + 2;
          const isRunning = activeSimulation === threat.simKey;

          return (
            <div key={threat.id} className="group relative rounded-lg p-1.5 transition-colors hover:bg-slate-900/60">
              {/* Threat line */}
              <div className="flex items-start gap-3">
                <span className="w-5 text-right text-slate-600 select-none tabular-nums text-xs font-mono">
                  {threatLineNum}
                </span>
                <span className="text-sky-300 font-semibold tracking-wide">
                  {threat.id}. {threat.threat}
                </span>
              </div>

              {/* Solution line */}
              <div className="flex items-center justify-between gap-3 mt-1 pl-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500">-</span>
                  <span className="text-slate-300">Solution:</span>
                  <span className="text-emerald-400 font-medium">
                    {threat.solution}
                  </span>
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                </div>

                {/* Interactive Test Simulation Button */}
                <button
                  onClick={() => handleRunSim(threat)}
                  title={`Run real-time probe simulation for ${threat.threat}`}
                  className="hidden group-hover:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans font-medium text-slate-300 bg-slate-800 hover:bg-sky-900/40 hover:text-sky-300 hover:border-sky-700/50 rounded border border-slate-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Play className={`w-2.5 h-2.5 ${isRunning ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
                  <span>{isRunning ? 'Probing...' : 'Test Guard'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer status notice */}
      <div className="mt-auto px-4 py-2.5 bg-slate-900/80 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-sky-400" />
          5/5 Threat Mitigations Verified
        </span>
        <span className="text-emerald-400 text-[11px] font-mono">
          STATUS: ENFORCED
        </span>
      </div>
    </div>
  );
};
