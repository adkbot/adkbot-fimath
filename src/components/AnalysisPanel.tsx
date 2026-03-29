import React from 'react';
import { AssetSignal, FimatheState, StrategyType } from '@/types';
import { TrendingUp, TrendingDown, Minus, Activity, Clock, ShieldCheck, Zap, BarChart3, Waves, MoveUpRight, ArrowDownRight, Target, Layout, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisPanelProps {
  currentAsset: string;
  isAnalyzing: boolean;
  analysis: any;
  activeStrategy: StrategyType;
  fimatheState?: FimatheState;
  onManualCapture?: () => void;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ currentAsset, isAnalyzing, analysis, activeStrategy, fimatheState, onManualCapture }) => {
  const confidence = activeStrategy === 'NEURAL_AI' ? (analysis?.probability || 0) : (fimatheState?.isDefined ? 100 : 0);
  const trend = activeStrategy === 'NEURAL_AI' ? (analysis?.trend || 'NEUTRO') : (fimatheState?.direction === 1 ? 'ALTA' : fimatheState?.direction === -1 ? 'BAIXA' : 'NEUTRO');
  
  return (
    <aside className="w-80 bg-[#070707] border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar">
      {/* Header Stat */}
      <div className="p-6 border-b border-white/5 bg-gradient-to-b from-cyan-500/5 to-transparent">
        <div className="flex flex-col items-center justify-center p-6 border border-cyan-500/10 rounded-xl bg-black/40 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <Zap size={40} className="text-cyan-400" />
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em]">{activeStrategy === 'FIMATHE' ? 'Fimathe Protocol' : 'Neural Sentiment'}</span>
          </div>
          
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-white/5"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={364}
                strokeDashoffset={364 - (364 * confidence) / 100}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  confidence > 70 ? "text-cyan-400" : confidence > 40 ? "text-yellow-500" : "text-magenta-500"
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white font-mono">{confidence}%</span>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Readiness</span>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
             <div className={cn(
               "px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
               trend === 'ALTA' ? "bg-green-500/10 border-green-500/30 text-green-400" :
               trend === 'BAIXA' ? "bg-magenta-500/10 border-magenta-500/30 text-magenta-400" :
               "bg-white/5 border-white/10 text-white/40"
             )}>
               {trend === 'ALTA' ? <MoveUpRight size={12} /> : trend === 'BAIXA' ? <ArrowDownRight size={12} /> : <Minus size={12} />}
               {trend}
             </div>
          </div>
        </div>
      </div>

      {/* Indicators Section */}
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-cyan-400 rounded-full" />
            <h3 className="text-white font-black text-[10px] uppercase tracking-widest">{activeStrategy === 'FIMATHE' ? 'Fimathe State' : 'Quantum Indicators'}</h3>
          </div>
          <Activity size={12} className="text-cyan-400 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {activeStrategy === 'NEURAL_AI' ? (
            <>
              <IndicatorCard 
                icon={<Waves size={14} className="text-blue-400" />}
                label="RSI Matrix" 
                value={analysis?.indicators?.rsi ? analysis.indicators.rsi.value : "--"} 
                subValue={analysis?.indicators?.rsi ? analysis.indicators.rsi.status : "Waiting..."}
                status={analysis?.indicators?.rsi?.status}
              />
              <IndicatorCard 
                icon={<BarChart3 size={14} className="text-yellow-400" />}
                label="ADX Power" 
                value={analysis?.indicators?.adx ? analysis.indicators.adx.value : "--"} 
                subValue={analysis?.indicators?.adx ? analysis.indicators.adx.intensity : "No Trend Signal"}
                status={analysis?.indicators?.adx?.intensity}
              />
              <IndicatorCard 
                icon={<TrendingUp size={14} className="text-magenta-400" />}
                label="Aroon Trend" 
                value={analysis?.indicators?.aroon ? `${analysis.indicators.aroon.up}/${analysis.indicators.aroon.down}` : "--"} 
                subValue={analysis?.indicators?.aroon ? analysis.indicators.aroon.intensity : "Analyzing Cycles..."}
                status={analysis?.indicators?.aroon?.intensity}
              />
              <IndicatorCard 
                icon={<Activity size={14} className="text-cyan-400" />}
                label="MA Cross" 
                value={analysis?.indicators?.ma ? analysis.indicators.ma.status : "--"} 
                subValue={analysis?.indicators?.ma ? analysis.indicators.ma.description : "Calculating Moving Averages..."}
                status={analysis?.indicators?.ma?.status}
              />
            </>
          ) : (
            <>
              <IndicatorCard 
                icon={<Layout size={14} className="text-blue-400" />}
                label="Canal" 
                value={fimatheState?.isDefined ? "DEFINED" : "CAPTURE..."} 
                subValue={fimatheState?.isDefined ? `Size: ${Math.round(fimatheState.canalSize * 100000)} pts` : "Waiting 09:08"}
                status={fimatheState?.isDefined ? 'ALTA' : ''}
              />
              <IndicatorCard 
                icon={<Zap size={14} className="text-yellow-400" />}
                label="Rompimento" 
                value={fimatheState?.isBroken ? "BROKEN" : "WAITING"} 
                subValue={fimatheState?.isBroken ? (fimatheState.direction === 1 ? "Upward Break" : "Downward Break") : "Inside Canal"}
                status={fimatheState?.isBroken ? 'ALTA' : ''}
              />
              <IndicatorCard 
                icon={<Target size={14} className="text-magenta-400" />}
                label="Reteste" 
                value={fimatheState?.isWaitingRetest ? "PENDING" : (fimatheState?.isBroken ? "VALIDATED" : "NONE")} 
                subValue={fimatheState?.isWaitingRetest ? "Price must touch level" : "Retest confirmed"}
                status={fimatheState?.isWaitingRetest ? 'BAIXA' : 'ALTA'}
              />
              <IndicatorCard 
                icon={<Maximize size={14} className="text-cyan-400" />}
                label="Strategy Info" 
                value="M2 PURE" 
                subValue="Fimathe Classic Set"
                status="ALTA"
              />
              
              <button 
                onClick={onManualCapture}
                className="mt-4 w-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black transition-all py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"
              >
                 <Target size={14} />
                 Capturar Canal Agora
              </button>
            </>
          )}
        </div>

        {activeStrategy === 'NEURAL_AI' && analysis && (
          <div className="mt-8 relative pt-6 border-t border-white/5">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-[#070707] border border-white/5 rounded-full flex items-center gap-2">
               <ShieldCheck size={10} className="text-green-500" />
               <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">IA Intelligence Report</span>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <p className="text-[11px] leading-relaxed text-white/70 font-medium italic">
                "{analysis.reason}"
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 border-t border-white/5 bg-black/40">
        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-2">
            <Clock size={12} />
            <span className="text-[9px] font-mono">{new Date().toLocaleTimeString()}</span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-cyan-400">Secure Protocol v1.4</span>
        </div>
      </div>
    </aside>
  );
};

const IndicatorCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subValue: string; status?: string }> = ({ icon, label, value, subValue, status }) => (
  <div className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/[0.07] transition-all group">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-black/40 rounded-lg group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest">{label}</span>
          <span className="text-xs font-black text-white">{value}</span>
        </div>
      </div>
    </div>
    <div className={cn(
      "text-[9px] font-black uppercase tracking-tight",
      status?.includes('SOBRECOMPRA') || status === 'BAIXA' ? "text-magenta-400" :
      status?.includes('SOBREVENDA') || status === 'ALTA' || status?.includes('FORTE') ? "text-cyan-400" :
      "text-white/40"
    )}>
      {subValue}
    </div>
  </div>
);

