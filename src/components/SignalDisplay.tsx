import React from 'react';
import { SignalInfo } from '../types';
import { TrendingUp, TrendingDown, Crosshair, ShieldAlert, Zap, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalDisplayProps {
  signal: SignalInfo;
}

export const SignalDisplay: React.FC<SignalDisplayProps> = ({ signal }) => {
  const isBuy = signal.type === 'COMPRA';
  const isSell = signal.type === 'VENDA';
  const isNeutral = signal.type === 'NEUTRO';
  const isBullish = signal.candleType === 'ALTA';

  const phaseMap: Record<string, string> = {
    'SETUP': 'CAPTURANDO CANAL',
    'WAITING_BREAKOUT': 'AGUARDANDO ROMPIMENTO',
    'WAITING_RETEST': 'AGUARDANDO RETESTE',
    'WAITING_CONFIRMATION': 'AGUARDANDO CONFIRMAÇÃO',
    'IN_TRADE': 'EM OPERAÇÃO / MONITORANDO'
  };

  return (
    <div className="flex flex-col bg-surface rounded-xl border border-white/5 overflow-hidden h-full shadow-2xl">
      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-primary/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                PCM QUANTUM PRO
            </h3>
        </div>
        <div className="px-2 py-0.5 bg-black/40 rounded border border-white/10 text-[8px] font-mono text-primary animate-pulse">
            {phaseMap[signal.phase] || signal.phase}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 overflow-y-auto custom-scrollbar">
        {/* Signal Status */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-secondary rounded-lg blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative bg-black/40 border border-white/10 rounded-lg p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase font-black text-white/30 tracking-widest mb-0.5">Direção do Ciclo</span>
              <span className={cn(
                "text-sm font-black tracking-tighter uppercase",
                isBuy ? "text-success" : 
                isSell ? "text-danger" : 
                "text-white/40"
              )}>
                {isNeutral ? "ANALISANDO..." : `PCM ${signal.type}`}
              </span>
            </div>
            <div className={cn(
              "p-1.5 rounded-full",
              isBuy ? "bg-success/10 text-success" : 
              isSell ? "bg-danger/10 text-danger" : 
              "bg-white/5 text-white/20"
            )}>
              {isBuy ? <TrendingUp size={16} /> : isSell ? <TrendingDown size={16} /> : <Crosshair size={16} />}
            </div>
          </div>
        </div>

        {/* TP / SL Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/5 border border-white/5 rounded-lg p-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success opacity-50" />
              <span className="text-[7px] uppercase font-black text-white/30 tracking-widest">ALVO (TP)</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-success/80">
              {signal.tp > 0 ? signal.tp.toFixed(5) : "---"}
            </span>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-lg p-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-danger opacity-50" />
              <span className="text-[7px] uppercase font-black text-white/30 tracking-widest">RISCO (SL)</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-danger/80">
              {signal.sl > 0 ? signal.sl.toFixed(5) : "---"}
            </span>
          </div>
        </div>

        {/* Force & Metrics */}
        <div className="grid grid-cols-2 gap-2">
            <div className={cn(
                "rounded-lg p-2.5 border flex items-center justify-between",
                isBullish ? "bg-success/5 border-success/10" : "bg-danger/5 border-danger/10"
            )}>
                <div className="flex flex-col">
                    <span className="text-[7px] uppercase font-black text-white/30 tracking-widest mb-0.5">VELA M2</span>
                    <span className={cn("text-[9px] font-black uppercase", isBullish ? "text-success" : "text-danger")}>
                        {signal.candleType}
                    </span>
                </div>
                <BarChart2 size={12} className={isBullish ? "text-success" : "text-danger rotate-180"} />
            </div>

            <div className="bg-white/5 border border-white/5 rounded-lg p-2.5 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[7px] uppercase font-black text-white/30 tracking-widest mb-0.5">ATIVO</span>
                    <span className="text-[9px] font-black text-primary uppercase">{signal.symbol}</span>
                </div>
                <ShieldAlert size={12} className="text-primary/40" />
            </div>
        </div>

        {/* Strategy Metrics Footer */}
        <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/40">
                <span>Ciclos Concluídos</span>
                <span className="text-white">{(signal as any).tradesToday || 0} / 2</span>
            </div>
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/40">
                <span>Viradas de Mão</span>
                <span className={cn((signal as any).reversaisToday > 0 ? "text-danger" : "text-white")}>
                    {(signal as any).reversaisToday || 0} / 1
                </span>
            </div>
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/40">
                <span>Fatiamento (Slice)</span>
                <span className={cn((signal as any).isSlicingApplied ? "text-primary animate-pulse" : "text-white/20")}>
                    {(signal as any).isSlicingApplied ? "ATIVO (50%)" : "INATIVO"}
                </span>
            </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
};
