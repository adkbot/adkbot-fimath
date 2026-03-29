import React from 'react';
import { AssetSignal } from '@/types';
import { TrendingUp, TrendingDown, Minus, Activity, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AssetMonitorProps {
  signals: AssetSignal[];
  selectedAssets: string[];
  isRunning: boolean;
  onToggleAsset: (symbol: string) => void;
  onSelectAsset: (symbol: string) => void;
}

export const AssetMonitor: React.FC<AssetMonitorProps> = ({ signals, selectedAssets, isRunning, onToggleAsset, onSelectAsset }) => {
  return (
    <div className="h-full bg-transparent flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg">
            <Zap size={14} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Quantum Scanner</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Global Market Pulse</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="px-3 py-1 bg-black/40 rounded-full border border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-[9px] font-black text-white/60 tracking-widest">{signals.length} ASSETS</span>
           </div>
        </div>
      </div>
      
      {/* Table Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <table className="w-full border-separate border-spacing-y-1.5">
          <thead>
            <tr className="text-[9px] text-white/30 uppercase tracking-[0.2em]">
              <th className="px-4 py-2 text-left font-black">Asset</th>
              <th className="px-4 py-2 text-left font-black">Signal Vector</th>
              <th className="px-4 py-2 text-center font-black">Condition</th>
              <th className="px-4 py-2 text-center font-black">Probability</th>
              <th className="px-4 py-2 text-right font-black">Execution</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal, idx) => {
              const isActive = selectedAssets.includes(signal.symbol) && isRunning;
              const isBuy = signal.signal.includes('COMPRA');
              const isSell = signal.signal.includes('VENDA');

              return (
                <tr 
                  key={signal.symbol} 
                  onClick={() => onSelectAsset(signal.symbol)}
                  className={cn(
                    "group cursor-pointer transition-all duration-300",
                    selectedAssets.includes(signal.symbol) ? "bg-cyan-500/5" : "hover:bg-white/5"
                  )}
                >
                  <td className="px-4 py-3 rounded-l-xl">
                    <div className="flex items-center gap-3">
                      <div 
                        onClick={(e) => { e.stopPropagation(); onToggleAsset(signal.symbol); }}
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center border transition-all duration-300",
                          selectedAssets.includes(signal.symbol) 
                            ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.3)]" 
                            : "bg-black/40 border-white/10 text-transparent group-hover:border-white/20"
                        )}
                      >
                        <ShieldCheck size={12} fill="currentColor" />
                      </div>
                      <span className="text-xs font-black tracking-widest text-white/90 group-hover:text-cyan-400 transition-colors">
                        {signal.symbol}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                       <div className={cn(
                         "p-1 rounded-md",
                         isBuy ? "bg-cyan-500/10" : isSell ? "bg-magenta-500/10" : "bg-white/5"
                       )}>
                         {signal.trend === 'up' && <TrendingUp size={12} className="text-cyan-400" />}
                         {signal.trend === 'down' && <TrendingDown size={12} className="text-magenta-500" />}
                         {signal.trend === 'neutral' && <Minus size={12} className="text-white/30" />}
                       </div>
                       <span className={cn(
                         "text-[10px] font-black tracking-widest uppercase",
                         isBuy ? "text-cyan-400" : isSell ? "text-magenta-500" : "text-white/30"
                       )}>
                         {signal.signal}
                       </span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{signal.condition || "Sincronizando..."}</span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex flex-col items-center">
                       <span className="text-[10px] font-mono text-cyan-400/80 font-bold">{signal.confidence}%</span>
                       <div className="w-12 h-0.5 bg-white/5 mt-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]" 
                            style={{ width: `${signal.confidence}%` }} 
                          />
                       </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right rounded-r-xl">
                    <div className="flex items-center justify-end gap-2">
                       {isActive && <Activity size={10} className="text-cyan-400 animate-pulse" />}
                       <span className={cn(
                         "text-[9px] font-black px-2 py-0.5 rounded border tracking-tighter transition-all",
                         isActive ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : 
                         "bg-white/5 text-white/20 border-white/10"
                       )}>
                         {isActive ? "LIVE" : "IDLE"}
                       </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

