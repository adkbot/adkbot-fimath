import React from 'react';
import { BarChart3, Volume2, TrendingUp, TrendingDown, CircleSlash, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  onSettingsClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick }) => {
  return (
    <aside className="fixed left-0 top-14 bottom-0 flex flex-col items-center py-6 z-40 bg-background w-20 border-r border-outline-variant/10">
      <div className="flex flex-col gap-8 items-center flex-1">
        <SidebarItem icon={<BarChart3 size={20} />} label="Analisar" active />
        <SidebarItem icon={<Volume2 size={20} />} label="Ouvir" />
        <SidebarItem icon={<TrendingUp size={20} />} label="Compra" />
        <SidebarItem icon={<TrendingDown size={20} />} label="Venda" />
        <SidebarItem icon={<CircleSlash size={20} />} label="Neutro" />
      </div>
      
      <div className="flex flex-col gap-6 items-center pb-4">
        <button 
          onClick={onSettingsClick}
          className="text-on-surface-variant hover:text-white transition-all"
        >
          <Settings size={20} />
        </button>
        <button className="text-on-surface-variant hover:text-white transition-all">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean }> = ({ icon, label, active }) => (
  <button className={cn(
    "flex flex-col items-center gap-1.5 p-2 w-full transition-all duration-200",
    active ? "bg-surface-container text-primary border-l-2 border-primary" : "text-on-surface-variant hover:text-white hover:bg-surface-low"
  )}>
    {icon}
    <span className="text-[9px] uppercase tracking-widest font-bold font-sans">{label}</span>
  </button>
);
