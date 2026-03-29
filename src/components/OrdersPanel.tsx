import React from 'react';
import { ArrowDownCircle, ArrowUpCircle, Target, ShieldAlert } from 'lucide-react';

interface Order {
  ticket: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  volume: number;
  price_open: number;
  sl: number;
  tp: number;
  profit: number;
}

interface OrdersPanelProps {
  orders: Order[];
}

export const OrdersPanel: React.FC<OrdersPanelProps> = ({ orders }) => {
  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <h3 className="text-xs font-black uppercase tracking-widest text-white">
          Ordens no Gráfico
        </h3>
        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-black rounded-full">
          {orders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
            <Target className="w-8 h-8" />
            <span className="text-[10px] font-bold uppercase">Nenhuma ordem aberta</span>
          </div>
        ) : (
          orders.map((order) => (
            <div 
              key={order.ticket} 
              className={`p-3 rounded-lg border ${order.type === 'BUY' ? 'border-success/20 bg-success/5' : 'border-danger/20 bg-danger/5'} relative overflow-hidden group hover:border-white/20 transition-all`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  {order.type === 'BUY' ? (
                    <ArrowUpCircle className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4 text-danger" />
                  )}
                  <span className={`text-[12px] font-black ${order.type === 'BUY' ? 'text-success' : 'text-danger'}`}>
                    {order.type} {order.symbol}
                  </span>
                </div>
                <span className={`text-[12px] font-black ${order.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                  ${order.profit.toFixed(2)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-[10px]">
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase font-bold">Entrada</span>
                  <span className="text-white font-black">{order.price_open.toFixed(5)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white/40 uppercase font-bold">Volume</span>
                  <span className="text-white font-black">{order.volume.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-danger/60 uppercase font-bold">
                    <ShieldAlert className="w-2.5 h-2.5" /> SL
                  </span>
                  <span className="text-danger font-black">{order.sl.toFixed(5)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="flex items-center gap-1 text-success/60 uppercase font-bold">
                    <Target className="w-2.5 h-2.5" /> TP
                  </span>
                  <span className="text-success font-black">{order.tp.toFixed(5)}</span>
                </div>
              </div>

              {/* Decorative side bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${order.type === 'BUY' ? 'bg-success' : 'bg-danger'}`} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
