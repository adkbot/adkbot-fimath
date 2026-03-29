import React from 'react';
import { ShieldCheck, Brain, Mic2, Clock, ZoomIn, Maximize2, UserCircle, Settings } from 'lucide-react';

interface TopBarProps {
  isRunning: boolean;
  balance: number;
  accountName?: string;
  accountServer?: string;
  onSettingsClick?: () => void;
  onTerminalClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ isRunning, balance, accountName, accountServer, onSettingsClick, onTerminalClick }) => {
  return (
    <header className="bg-[#0a0a0a] flex justify-between items-center w-full px-6 h-14 z-50 border-b border-outline-variant/10">
      <div className="flex items-center gap-8">
        <span className="text-magenta-500 font-black tracking-widest uppercase text-lg font-headline">
          NEXUS <span className="text-cyan-400">FENIX</span> <span className="text-white/20 text-xs font-black">CYBER v4.0</span>
        </span>
        <nav className="hidden xl:flex gap-6">
          <NavItem icon={<ShieldCheck size={16} />} label="LICENÇA" active />
          <NavItem icon={<Brain size={16} />} label="IA+" />
          <NavItem icon={<Mic2 size={16} />} label="VOZ+" />
          <NavItem icon={<Clock size={16} className={isRunning ? "text-cyan-400 animate-pulse" : ""} />} label="TEMPO REAL" active={isRunning} />
          <NavItem icon={<ZoomIn size={16} />} label="ZOOM+" />
        </nav>
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onTerminalClick}
          className="bg-cyan-500/10 border border-cyan-500/30 px-4 py-1.5 rounded-sm flex items-center gap-2 hover:bg-cyan-500/20 transition-all group"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse group-hover:animate-ping" />
          <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">CONECTAR MT5</span>
        </button>

        {isRunning && (
          <div className="bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping" />
            <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">AUTO-TRADING ATIVO</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          {accountName || '---'} | {accountServer || '---'}
        </div>
        
        <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
          <span className="text-[9px] font-black text-white/40 tracking-[0.2em] uppercase">Timeframe:</span>
          <span className="text-[10px] font-black text-cyan-400 tracking-[0.1em]">M2 (2 MINUTOS)</span>
        </div>

        <div className="flex items-center gap-2 ml-2">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">$ {(balance ?? 0).toFixed(2)}</span>
        </div>
        <button 
          onClick={onSettingsClick}
          className="text-white/40 hover:text-cyan-400 transition-all"
        >
          <Settings size={20} />
        </button>
        <button className="text-white/40 hover:text-white transition-all">
          <Maximize2 size={20} />
        </button>
        <button className="text-white/40 hover:text-white transition-all">
          <UserCircle size={20} />
        </button>
      </div>
    </header>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <a 
    href="#" 
    className={`flex items-center gap-2 text-[11px] font-black tracking-widest transition-all hover:brightness-125 ${active ? 'text-cyan-400' : 'text-white/40'}`}
  >
    {icon}
    <span className="font-headline uppercase">{label}</span>
  </a>
);
