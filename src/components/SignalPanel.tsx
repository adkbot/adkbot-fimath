import React from 'react';
import { BellOff, TrendingDown, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalPanelProps {
  currentAsset: string;
  isAnalyzing: boolean;
  analysis: any;
  lot: number;
  onLotChange: (lot: number) => void;
}

export const SignalPanel: React.FC<SignalPanelProps> = ({ currentAsset, isAnalyzing, analysis, lot, onLotChange }) => {
  const recommendation = analysis?.recommendation || 'AGUARDAR';
  const probability = analysis?.probability || 0;
  const isVenda = recommendation === 'VENDA';
  const isCompra = recommendation === 'COMPRA';

  const indicators = analysis?.indicators || {};

  return (
    <div className="w-72 flex flex-col gap-2 shrink-0 p-2">
      <div className={cn(
        "bg-surface-container border flex-1 flex flex-col p-5 relative overflow-hidden transition-all duration-500",
        isVenda ? "border-tertiary/30" : isCompra ? "border-primary/30" : "border-outline-variant/20"
      )}>
        {/* Glow effect */}
        <div className={cn(
          "absolute -top-20 -right-20 w-40 h-40 blur-[60px] rounded-full transition-all duration-500",
          isVenda ? "bg-tertiary/10" : isCompra ? "bg-primary/10" : "bg-on-surface-variant/5"
        )} />
        
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-[8px] text-on-surface-variant font-black uppercase tracking-widest">Lote Operação</span>
            <input 
              type="number" 
              value={lot} 
              onChange={(e) => onLotChange(parseFloat(e.target.value))}
              step="0.01"
              min="0.01"
              className="bg-surface-low border border-outline-variant/30 text-white font-mono font-bold text-xs w-20 px-2 py-1 focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-surface-low px-3 py-1.5 border border-outline-variant/30 hover:bg-surface-bright transition-all">
            <BellOff size={12} className="text-on-surface-variant" />
            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Alert Audio</span>
          </button>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isAnalyzing ? (
                <div className="w-2 h-2 rounded-full bg-secondary animate-ping" />
              ) : (
                <div className={cn("w-2 h-2 rounded-full animate-pulse", isVenda ? "bg-tertiary" : isCompra ? "bg-primary" : "bg-on-surface-variant")} />
              )}
              <h1 className={cn(
                "font-headline font-black text-4xl tracking-tighter transition-all",
                isVenda ? "text-tertiary" : isCompra ? "text-primary" : "text-on-surface-variant"
              )}>
                {isAnalyzing ? "ANALISANDO..." : recommendation}
              </h1>
            </div>
            <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest">
              {currentAsset} - Confiança: {probability}%
            </p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-headline font-black text-white">{probability}%</span>
          </div>
        </div>

        <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          <div className={cn(
            "bg-surface-low p-4 border-l-2 relative group transition-all",
            isVenda ? "border-tertiary" : isCompra ? "border-primary" : "border-on-surface-variant"
          )}>
            <p className="text-[9px] text-on-surface-variant uppercase font-black mb-1 tracking-widest">Stop Loss</p>
            <p className="text-xl font-mono font-bold text-white">1.16008</p>
            <Target className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/20 group-hover:text-on-surface-variant/40 transition-all" size={24} />
          </div>

          <div className="flex flex-col gap-2">
            <SignalLevel label="Take Profit 1" value="1.15784" color="primary" />
            <SignalLevel label="Take Profit 2" value="1.15727" color="primary" />
          </div>
          
          <div className="pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Indicadores Técnicos</span>
            </div>
            <div className="space-y-2">
              <IndicatorRow label="MA 9" value={indicators.ma9?.value || "---"} intensity={indicators.ma9?.intensity} />
              <IndicatorRow label="MA 20" value={indicators.ma20?.value || "---"} intensity={indicators.ma20?.intensity} />
              <IndicatorRow label="MA 56" value={indicators.ma56?.value || "---"} intensity={indicators.ma56?.intensity} />
              <IndicatorRow label="AROON" value={`${indicators.aroon?.up || 0}/${indicators.aroon?.down || 0}`} intensity={indicators.aroon?.intensity} />
              <IndicatorRow label="ADX" value={indicators.adx?.value || "---"} intensity={indicators.adx?.intensity} />
            </div>
          </div>
          
          <div className="pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-2 mb-3">
              <Activity size={14} className="text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">IA Insight</span>
            </div>
            <div className="bg-surface-low/50 p-2 text-[10px] text-on-surface-variant italic leading-relaxed">
              {analysis?.reason || "Aguardando próxima análise do mercado..."}
            </div>
          </div>
        </div>

        <div className={cn(
          "mt-6 p-3 text-center border transition-all",
          isVenda ? "bg-tertiary-container/10 border-tertiary-container/30 text-tertiary" : 
          isCompra ? "bg-primary/10 border-primary/30 text-primary" : 
          "bg-surface-low border-outline-variant/20 text-on-surface-variant"
        )}>
          <span className="font-black text-sm uppercase tracking-widest">
            Trend: {analysis?.trend || "NEUTRAL"}
          </span>
        </div>
      </div>
    </div>
  );
};

const IndicatorRow: React.FC<{ label: string; value: string | number; intensity?: string }> = ({ label, value, intensity }) => (
  <div className="flex flex-col gap-0.5 border-b border-outline-variant/5 pb-1">
    <div className="flex justify-between items-center">
      <span className="text-[9px] text-on-surface-variant font-bold uppercase">{label}</span>
      <span className="text-[10px] font-black text-white font-mono">{value}</span>
    </div>
    {intensity && (
      <span className="text-[8px] text-primary/70 italic leading-tight">{intensity}</span>
    )}
  </div>
);

const SignalLevel: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-surface-low p-3 flex justify-between items-center border border-outline-variant/10 hover:border-primary/30 transition-all cursor-pointer group">
    <span className={cn("text-[10px] uppercase font-black tracking-widest", color === 'primary' ? 'text-primary' : 'text-tertiary')}>
      {label}
    </span>
    <span className="text-sm font-mono font-bold text-white group-hover:text-primary transition-all">{value}</span>
  </div>
);
