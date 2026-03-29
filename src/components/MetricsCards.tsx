import React from 'react';
import { Activity, TrendingUp, CheckCircle2, XCircle, Percent } from 'lucide-react';

interface MetricsCardsProps {
  balance: number;
  equity: number;
  tradesToday: number;
  profit: number;
  wins: number;
  losses: number;
  winRate: number;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  balance,
  equity,
  tradesToday,
  profit,
  wins,
  losses,
  winRate
}) => {
  const cards = [
    { label: 'Saldo', value: `$${balance.toFixed(2)}`, icon: Activity, color: 'text-primary' },
    { label: 'Capital', value: `$${equity.toFixed(2)}`, icon: Activity, color: 'text-success' },
    { label: 'Lucro Hoje', value: `$${profit.toFixed(2)}`, icon: TrendingUp, color: profit >= 0 ? 'text-primary' : 'text-danger' },
    { label: 'Trades Hoje', value: tradesToday, icon: Activity, color: 'text-white' },
    { label: 'Wins', value: wins, icon: CheckCircle2, color: 'text-success' },
    { label: 'Losses', value: losses, icon: XCircle, color: 'text-danger' },
    { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, icon: Percent, color: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 p-4 bg-background">
      {cards.map((card, index) => (
        <div key={index} className="bg-surface rounded-xl border border-white/5 p-4 flex flex-col items-center justify-center gap-2 hover:border-primary/20 transition-all cursor-default">
          <div className="p-2 bg-white/5 rounded-lg">
            <card.icon className={`w-5 h-5 ${card.color}`} />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">
            {card.label}
          </span>
          <span className={`text-xl font-black ${card.color}`}>
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
};
