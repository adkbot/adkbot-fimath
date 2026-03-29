import React, { useState } from 'react';
import { Lock, Cpu } from 'lucide-react';

interface HeaderProps {
  isMT5Connected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  isRunning: boolean;
  isScannerActive: boolean;
  timeframe: string;
  onToggleBot: () => void;
  isCloudMode: boolean;
  baseUrl: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  isMT5Connected, 
  isConnecting, 
  onConnect,
  isRunning,
  isScannerActive,
  timeframe,
  onToggleBot,
  isCloudMode,
  baseUrl
}) => {
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  return (
    <header className="flex items-center justify-between p-4 bg-background border-b border-surface">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Auto-Trading IA
        </h1>
        
        <button
          onClick={onConnect}
          disabled={isConnecting || isMT5Connected}
          className={`ml-4 px-4 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all shadow-lg ${
            isMT5Connected 
              ? 'bg-primary/20 text-primary cursor-default border border-primary/30' 
              : isConnecting 
                ? 'bg-secondary/40 text-white cursor-wait animate-pulse' 
                : 'bg-secondary hover:bg-secondary/80 text-white border border-secondary active:scale-95'
          }`}
        >
          {isMT5Connected ? 'SISTEMA CONECTADO' : isConnecting ? 'CONECTANDO...' : 'CONECTAR MT5 AUTOMÁTICO'}
        </button>

        {isMT5Connected && (
          <button
            onClick={onToggleBot}
            className={`ml-2 px-6 py-1.5 rounded text-[11px] font-black uppercase tracking-wider transition-all shadow-xl active:scale-95 border ${
              isRunning 
                ? 'bg-danger/20 text-danger border-danger/30 hover:bg-danger/30' 
                : 'bg-success hover:bg-success/80 text-white border-success'
            }`}
          >
            {isRunning ? '🛑 PARAR BOT' : '🚀 INICIAR BOT'}
          </button>
        )}
      </div>

      <div className="flex gap-3">
        {(isRunning || isScannerActive) && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 rounded-full border border-cyan-500/40 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-wider">
              MODO AUTOMÁTICO: ATIVO
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-1.5 bg-success/20 rounded-full border border-success/30">
          <Lock className="w-3.5 h-3.5 text-success" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            Licença Válida
          </span>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1.5 ${isMT5Connected ? 'bg-primary/20' : 'bg-danger/20'} rounded-full border ${isMT5Connected ? 'border-primary/40' : 'border-danger/40'} transition-colors`}>
          <div className={`w-2 h-2 rounded-full ${isMT5Connected ? 'bg-primary animate-pulse' : 'bg-danger'}`} />
          <span className={`text-[11px] font-black uppercase tracking-wider ${isMT5Connected ? 'text-primary' : 'text-danger'}`}>
            {isMT5Connected ? `MT5 CONECTADO [${timeframe}]` : 'MT5 DESCONECTADO'}
          </span>
        </div>
      </div>
    </header>
  );
};
