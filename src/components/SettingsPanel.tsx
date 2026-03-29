import React from 'react';
import { Settings, Target, Percent, List, Play, Square, Activity } from 'lucide-react';

interface SettingsPanelProps {
  lotSize: number;
  riskPercent: number;
  maxTrades: number;
  maxPositions: number;
  selectedAssets: string[];
  isScannerActive: boolean;
  onUpdate: (key: string, value: any) => void;
  onToggleScanner: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  lotSize,
  riskPercent,
  maxTrades,
  maxPositions,
  selectedAssets,
  isScannerActive,
  onUpdate,
  onToggleScanner
}) => {
  const assets = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'BTCUSD', 'ETHUSD'];

  const toggleAsset = (asset: string) => {
    const newAssets = selectedAssets.includes(asset)
      ? selectedAssets.filter(a => a !== asset)
      : [...selectedAssets, asset];
    onUpdate('selectedScanAssets', newAssets);
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-primary/5">
        <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-primary" />
          Gerenciamento e Auto-Scanner
        </h3>
        <div className="flex items-center gap-2">
          {isScannerActive ? (
            <button
              onClick={onToggleScanner}
              key="btn-stop"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all bg-danger text-white shadow-[0_0_15px_rgba(255,82,82,0.3)]"
            >
              <Square className="w-3 h-3 fill-current" />
              Parar Scanner
            </button>
          ) : (
            <button
              onClick={onToggleScanner}
              key="btn-start"
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all bg-success text-white shadow-[0_0_15px_rgba(0,200,83,0.3)]"
            >
              <Play className="w-3 h-3 fill-current" />
              Iniciar Scanner
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Trading Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/40 flex items-center gap-1">
              <List className="w-3 h-3" /> Lote por Trade
            </label>
            <input
              type="number"
              value={lotSize}
              onChange={(e) => onUpdate('lot', parseFloat(e.target.value))}
              step="0.01"
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-black text-primary focus:border-primary/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/40 flex items-center gap-1">
              <Percent className="w-3 h-3" /> Risco por Trade (%)
            </label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => onUpdate('riskPerTradePercent', parseFloat(e.target.value))}
              step="0.1"
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-black text-warning focus:border-warning/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/40 flex items-center gap-1">
              <Target className="w-3 h-3" /> Limite Trades/Dia
            </label>
            <input
              type="number"
              value={maxTrades}
              onChange={(e) => onUpdate('maxTradesPerDay', parseInt(e.target.value))}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-black text-success focus:border-success/50 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] uppercase font-black text-white/40 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Máx Posições (1 p/ ativo)
            </label>
            <input
              type="number"
              value={maxPositions}
              onChange={(e) => onUpdate('maxOpenPositions', parseInt(e.target.value))}
              className="w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm font-black text-secondary focus:border-secondary/50 outline-none transition-all"
            />
          </div>
        </div>

        {/* Asset Selection */}
        <div className="space-y-3">
          <label className="text-[9px] uppercase font-black text-white/40 block">
            Ativos para Monitoramento Automático
          </label>
          <div className="grid grid-cols-3 gap-2">
            {assets.map(asset => (
              <button
                key={asset}
                onClick={() => toggleAsset(asset)}
                className={`px-2 py-2 rounded-lg text-[10px] font-black border transition-all ${
                  selectedAssets.includes(asset)
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                }`}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
