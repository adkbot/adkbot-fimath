import React from 'react';
import { Play, Square, Target, Zap, Activity, ShieldCheck, Cpu, BarChart3, Gauge, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StrategyType } from '../types';

interface ControlPanelProps {
  isRunning: boolean;
  isAutoExecActive: boolean;
  scanInterval: number;
  onStart: () => void;
  onStop: () => void;
  currentAsset: string;
  lot: number;
  stopLoss: number;
  takeProfit: number;
  activeStrategy: StrategyType;
  onUpdateState: (updates: any) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ 
  isRunning, 
  isAutoExecActive,
  scanInterval,
  onStart, 
  onStop, 
  currentAsset,
  lot,
  stopLoss,
  takeProfit,
  activeStrategy,
  onUpdateState
}) => {
  return (
    <aside className="h-full bg-transparent flex flex-col overflow-y-auto custom-scrollbar gap-1">
      {/* System Integrity & MT5 Status */}
      <div className="bg-[#050505] rounded-xl border border-white/5 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Cpu size={14} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Neural Core</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">System Protocol v4.0</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
            <button 
                onClick={() => onUpdateState({ activeStrategy: 'NEURAL_AI' })}
                className={cn(
                    "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                    activeStrategy === 'NEURAL_AI' ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                )}
            >
                Neural AI
            </button>
            <button 
                onClick={() => onUpdateState({ activeStrategy: 'FIMATHE' })}
                className={cn(
                    "py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
                    activeStrategy === 'FIMATHE' ? "bg-magenta-600 border-magenta-500 text-white shadow-[0_0_15px_rgba(255,0,102,0.4)]" : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                )}
            >
                Fimathe Pure
            </button>
        </div>

        <div className="space-y-2">
           <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1 mb-2">Fluxo de Ignição</p>
           {!isRunning ? (
              <button 
                onClick={onStart}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] py-3 rounded-xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]"
              >
                <Play size={14} fill="currentColor" />
                Iniciar Bot
              </button>
           ) : (
              <button 
                onClick={onStop}
                className="w-full bg-magenta-600 hover:bg-magenta-500 text-white font-black text-[10px] py-3 rounded-xl uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(255,0,102,0.2)] hover:shadow-[0_0_30px_rgba(255,0,102,0.4)]"
              >
                <Square size={14} fill="currentColor" />
                Pausar Bot
              </button>
           )}
        </div>
      </div>

      {/* Execution Matrix */}
      <div className="bg-[#050505] rounded-xl border border-white/5 p-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-magenta-500/10 rounded-lg">
            <Target size={14} className="text-magenta-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Execution Matrix</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Order Parameters</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-white/30 uppercase font-black tracking-widest">Volume (LOT)</label>
              <span className="text-[10px] font-mono text-cyan-400">{(lot ?? 0).toFixed(2)}</span>
            </div>
            <input 
              type="range" min="0.01" max="1.0" step="0.01" value={lot}
              onChange={(e) => onUpdateState({ lot: parseFloat(e.target.value) })}
              className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/40 rounded-xl border border-white/5 p-3 space-y-1">
              <label className="text-[8px] text-white/30 uppercase font-black block">Stop Loss</label>
              <input 
                type="number" value={stopLoss}
                onChange={(e) => onUpdateState({ stopLoss: parseInt(e.target.value) })}
                className="w-full bg-transparent text-sm font-black text-magenta-500 outline-none"
              />
            </div>
            <div className="bg-black/40 rounded-xl border border-white/5 p-3 space-y-1">
              <label className="text-[8px] text-white/30 uppercase font-black block">Take Profit</label>
              <input 
                type="number" value={takeProfit}
                onChange={(e) => onUpdateState({ takeProfit: parseInt(e.target.value) })}
                className="w-full bg-transparent text-sm font-black text-cyan-400 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Override */}
      <div className="bg-[#050505] rounded-xl border border-white/5 p-5 flex-1 min-h-[220px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/10 rounded-lg">
            <Zap size={14} className="text-yellow-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Sistema Operacional</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Controle Autônomo</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
           {/* Scan Intervals */}
           <div className="space-y-2">
             <span className="text-[8px] text-white/30 uppercase font-black tracking-widest ml-1">Frequência (Intervalo)</span>
             <div className="flex gap-1">
               {[1, 5, 15, 30].map(v => (
                 <button 
                   key={v} 
                   onClick={() => onUpdateState({ scanInterval: v })}
                   className={cn(
                     "flex-1 h-7 text-[9px] font-black rounded-lg border transition-all duration-300",
                     v === scanInterval ? "bg-white text-black border-white" : "text-white/40 border-white/5 hover:bg-white/5"
                   )}
                 >
                   {v}s
                 </button>
               ))}
             </div>
           </div>

           <div className="flex-1 flex flex-col justify-end gap-3 pb-2 pt-4 border-t border-white/5 mt-auto">
              <div className="flex items-center justify-between px-2 mb-2">
                 <span className="text-[10px] font-black text-white/40 tracking-widest uppercase">{activeStrategy === 'FIMATHE' ? 'Fimathe Bot' : 'AI EXECUTION'}</span>
                 <div className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                    isAutoExecActive ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-white/20"
                 )}>
                   {isAutoExecActive ? "ATIVO" : "DESATIVO"}
                 </div>
              </div>
              
              <button 
                onClick={() => onUpdateState({ isAutoExecActive: !isAutoExecActive })}
                className={cn(
                  "w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-500 border",
                  isAutoExecActive 
                    ? "bg-magenta-600 border-magenta-500 text-white shadow-[0_8px_20px_rgba(255,0,102,0.3)]" 
                    : "bg-white/5 border-white/10 text-white/40 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-400"
                )}
              >
                <Zap size={14} className={isAutoExecActive ? "animate-pulse" : ""} />
                {isAutoExecActive ? "DESATIVAR AUTO-BOT" : "MODO AUTOMÁTICO"}
              </button>
           </div>
        </div>
      </div>
    </aside>
  );
};
