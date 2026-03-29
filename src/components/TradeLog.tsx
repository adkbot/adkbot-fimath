import React from 'react';
import { History, ArrowUpCircle, ArrowDownCircle, Clock, Database, Trash2 } from 'lucide-react';
import { Trade } from '../types';
import { cn } from '../lib/utils';

interface TradeLogProps {
  history: Trade[];
}

export const TradeLog: React.FC<TradeLogProps> = ({ history }) => {
  return (
    <div className="h-full flex flex-col bg-transparent overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-magenta-500/10 rounded-lg">
            <Database size={14} className="text-magenta-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Oracle Log</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Transaction History</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-mono text-white/60">{history.length}</span>
        </div>
      </div>
      
      {/* List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 pointer-events-none">
            <Clock size={32} className="text-white mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">No Data Streams</span>
          </div>
        ) : (
          history.map((trade) => {
            const isBuy = trade.type === 'COMPRA';
            return (
              <div 
                key={trade.id} 
                className="group relative overflow-hidden bg-black/40 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-300"
              >
                {/* Background Glow */}
                <div className={cn(
                   "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none",
                   isBuy ? "bg-cyan-500" : "bg-magenta-500"
                )} />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-xl border",
                      isBuy ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-magenta-500/10 border-magenta-500/20 text-magenta-500"
                    )}>
                      {isBuy ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white/90 tracking-widest">{trade.symbol}</span>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isBuy ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" : "bg-magenta-500 shadow-[0_0_8px_rgba(255,0,102,0.8)]"
                        )} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-white/30 uppercase tracking-widest">
                        <span>Lot: {trade.lot.toFixed(2)}</span>
                        <span>Price: {trade.price.toFixed(5)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={cn(
                      "text-[11px] font-black tracking-widest",
                      trade.profit ? "text-cyan-400" : "text-white/40 italic"
                    )}>
                      {trade.profit ? `+R$ ${trade.profit.toFixed(2)}` : 'EXECUTING'}
                    </div>
                    <div className="text-[8px] font-mono text-white/20 mt-1">
                      {trade.time}
                    </div>
                  </div>
                </div>

                {/* Progress bar for executing trades */}
                {!trade.profit && (
                   <div className="mt-3 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-magenta-500 animate-[loading_2s_infinite]" />
                   </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

