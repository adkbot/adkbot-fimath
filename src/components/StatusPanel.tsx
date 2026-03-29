import React from 'react';
import { Play, Square, BellOff, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusPanelProps {
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onAnalyze: () => void;
  onListen: () => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = ({ isRunning, onStart, onStop, onAnalyze, onListen }) => {
  return (
    <div className="w-80 flex flex-col gap-2 shrink-0 p-2">
      {/* Real Time Status */}
      <div className="bg-surface-container p-4 border border-outline-variant/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">
            GRÁFICO TEMPO REAL
          </h2>
          <span className={cn(
            "flex items-center gap-1.5 text-[10px] font-black",
            isRunning ? "text-primary" : "text-on-surface-variant"
          )}>
            <span className={cn("w-2 h-2 rounded-full", isRunning ? "bg-primary animate-pulse" : "bg-on-surface-variant")} />
            {isRunning ? "RODANDO" : "PARADO"}
          </span>
        </div>
        
        <div className="space-y-1 mb-4 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">BID:</span>
            <span className="text-tertiary">1.15896</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">ASK:</span>
            <span className="text-tertiary">1.15898</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">SPREAD:</span>
            <span className="text-secondary">0.0 pips</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">ATIVO:</span>
            <span className="text-secondary">EURUSD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">SINAL:</span>
            <span className="text-tertiary font-bold">VENDA (76%)</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onStart}
            disabled={isRunning}
            className={cn(
              "bg-primary hover:brightness-110 text-on-primary font-black py-2.5 text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest",
              isRunning && "opacity-50 cursor-not-allowed"
            )}
          >
            <Play size={14} fill="currentColor" /> INICIAR TEMPO REAL
          </button>
          <button 
            onClick={onStop}
            disabled={!isRunning}
            className={cn(
              "bg-tertiary-container hover:brightness-110 text-white font-black py-2.5 text-[10px] flex items-center justify-center gap-2 transition-all active:scale-95 uppercase tracking-widest",
              !isRunning && "opacity-50 cursor-not-allowed"
            )}
          >
            <Square size={14} fill="currentColor" /> PARAR TEMPO REAL
          </button>
        </div>
      </div>

      {/* Multi-Monitor Selector */}
      <div className="bg-surface-container p-4 border border-outline-variant/10 flex-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-headline font-bold text-[10px] text-on-surface-variant uppercase tracking-widest">
            MULTI-MONITOR
          </h2>
          <span className={cn("text-[10px] font-black", isRunning ? "text-primary" : "text-on-surface-variant")}>
            {isRunning ? "RODANDO" : "PARADO"}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] text-on-surface-variant font-bold block mb-2 uppercase">Confiança Mínima</label>
            <div className="bg-background p-3 border border-outline-variant/20 flex justify-between items-center">
              <span className="text-primary font-black text-sm">80%</span>
              <div className="h-1 w-24 bg-surface-low relative">
                <div className="absolute left-0 top-0 h-full bg-primary w-[80%]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <ActionButton label="ANALISAR" color="blue" onClick={onAnalyze} />
            <ActionButton label="OUVIR ANÁLISE" color="purple" onClick={onListen} />
            <ActionButton label="COMPRA" color="green" />
            <ActionButton label="VENDA" color="red" />
            <ActionButton label="NEUTRO" color="gray" />
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{ label: string; color: string; onClick?: () => void }> = ({ label, color, onClick }) => {
  const colors: Record<string, string> = {
    blue: "bg-blue-900/30 text-blue-400 border-blue-400/30",
    purple: "bg-purple-900/30 text-purple-400 border-purple-400/30",
    green: "bg-primary/10 text-primary border-primary/30",
    red: "bg-tertiary-container/10 text-tertiary border-tertiary-container/30",
    gray: "bg-surface-bright/30 text-on-surface-variant border-outline-variant/30",
  };
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full py-2.5 text-[10px] font-black border uppercase tracking-widest transition-all hover:brightness-125",
        colors[color]
      )}
    >
      {label}
    </button>
  );
};
