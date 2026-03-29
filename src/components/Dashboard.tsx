import React from 'react';
import { Header } from './Header';
import { MetricsCards } from './MetricsCards';
import { TradingChart } from './TradingChart';
import { OrdersPanel } from './OrdersPanel';
import { EconomicCalendar } from './EconomicCalendar';
import { SettingsPanel } from './SettingsPanel';
import { SignalDisplay } from './SignalDisplay';
import { TradingState, CandlestickData } from '../types';

interface DashboardProps {
  state: TradingState;
  chartData: CandlestickData[];
  onSymbolChange: (s: string) => void;
  onTimeframeChange: (tf: string) => void;
  isConnecting: boolean;
  onConnect: () => void;
  onToggleBot: () => void;
  onManualCapture: () => void;
  onUpdateSetting: (key: string, value: any) => void;
  onToggleScanner: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  state, 
  chartData,
  onSymbolChange, 
  onTimeframeChange,
  isConnecting,
  onConnect,
  onToggleBot,
  onManualCapture,
  onUpdateSetting,
  onToggleScanner
}) => {
  return (
    <div className="flex flex-col h-screen bg-background text-white overflow-hidden font-sans">
      <Header 
        isMT5Connected={state.accountName !== '---'} 
        isConnecting={isConnecting}
        onConnect={onConnect}
        isRunning={state.isRunning}
        isScannerActive={state.isAutoScannerActive}
        timeframe={state.timeframe}
        onToggleBot={onToggleBot}
      />
      
      <MetricsCards 
        balance={state.balance}
        equity={state.equity}
        tradesToday={state.metrics.tradesToday}
        profit={state.profit}
        wins={state.metrics.wins}
        losses={state.metrics.losses}
        winRate={state.metrics.winRate}
      />

      <div className="flex-1 grid grid-cols-12 gap-1 p-1 min-h-0">
        {/* Left Sidebar - Settings & Scanning */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-1 h-full min-h-0">
          <div className="flex-[0_0_auto]">
            <SettingsPanel 
              lotSize={state.lot}
              riskPercent={state.riskPerTradePercent}
              maxTrades={state.maxTradesPerDay}
              maxPositions={state.maxOpenPositions}
              selectedAssets={state.selectedScanAssets}
              isScannerActive={state.isAutoScannerActive}
              onUpdate={onUpdateSetting}
              onToggleScanner={onToggleScanner}
            />
          </div>
          <div className="flex-1 min-h-0 max-h-56">
            <SignalDisplay signal={state.lastSignal} />
          </div>
        </div>

        {/* Main Chart Area */}
        <div className="col-span-12 lg:col-span-6 h-full min-h-0">
          <TradingChart 
            data={chartData} 
            symbol={state.currentAsset}
            timeframe={state.timeframe}
            onSymbolChange={onSymbolChange}
            onTimeframeChange={onTimeframeChange}
            orders={state.positions}
            fimatheState={state.fimatheStates[state.currentAsset]}
            onManualCapture={onManualCapture}
            isRunning={state.isRunning}
          />
        </div>

        {/* Right Sidebar - Orders & Calendar */}
        <div className="col-span-12 lg:col-span-3 h-full flex flex-col gap-1 min-h-0">
          <div className="h-1/2 min-h-0">
            <OrdersPanel orders={state.positions} />
          </div>
          <div className="h-1/2 min-h-0">
            <EconomicCalendar events={state.calendar} />
          </div>
        </div>
      </div>

      <footer className="h-6 bg-black/40 border-t border-white/5 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex gap-4">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
            SYSTEM STATUS: <span className="text-primary">ONLINE</span>
          </span>
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
             ACCOUNT: <span className="text-white">{state.accountName}</span>
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em]">
            {state.accountServer}
          </span>
          <span className="text-[9px] font-bold text-white/40">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
      </footer>
    </div>
  );
};
