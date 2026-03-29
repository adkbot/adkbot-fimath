import React from 'react';
import { Star, Clock } from 'lucide-react';
import { EconomicEvent } from '../types';

interface EconomicCalendarProps {
  events: EconomicEvent[];
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ events }) => {
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-primary';
      default: return 'text-white/40';
    }
  };

  const getImpactStars = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-white">
          Calendário Econômico
        </h3>
        <span className="text-[10px] text-white/40 font-bold uppercase">
          {new Date().toLocaleDateString('pt-BR')}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
            <Clock className="w-8 h-8" />
            <span className="text-[10px] font-bold uppercase">Nenhum evento hoje</span>
          </div>
        ) : (
          events.map((event, index) => (
            <div key={index} className="p-3 bg-background/50 rounded-lg border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] font-black text-white group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    {event.currency || 'USD'}
                  </span>
                  <span className="text-[10px] font-bold text-white/40">
                    {event.time || '--:--'}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < getImpactStars(event.impact || 'low') ? getImpactColor(event.impact || 'low') : 'text-white/5'}`}
                      fill={i < getImpactStars(event.impact || 'low') ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[11px] font-bold text-white/80 leading-tight">
                {event.event || 'Evento Econômico'}
              </p>
              {(event.actual || event.estimate) && (
                <div className="mt-2 flex gap-3 border-t border-white/5 pt-2">
                  {event.actual && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-white/30 font-bold">Atual</span>
                      <span className="text-[10px] text-white font-black">{event.actual}</span>
                    </div>
                  )}
                  {event.estimate && (
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase text-white/30 font-bold">Previsto</span>
                      <span className="text-[10px] text-white/60 font-black">{event.estimate}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
