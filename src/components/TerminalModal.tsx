import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal as TerminalIcon, Shield, Zap, Activity, Cpu, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface TerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TerminalModal: React.FC<TerminalModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (isOpen && status === 'IDLE') {
      startConnection();
    }
    
    // Cleanup on close
    if (!isOpen && eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setStatus('IDLE');
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startConnection = () => {
    setStatus('CONNECTING');
    setLogs([]);
    addLog("SOLICITANDO ACESSO AO SERVIDOR LOCAL...");

    const es = new EventSource('http://localhost:3001/api/connect-mt5');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          addLog(data.message);
          if (data.message.includes("SUCESSO") || data.type === 'connection_success') setStatus('CONNECTED');
          if (data.message.includes("ERRO") || data.type === 'error') setStatus('ERROR');
        } else if (data.type === 'status') {
          // Status updates don't need to be logs, but we can update the status state
          setStatus('CONNECTED');
        }
      } catch (e) {
        console.error("Error parsing message:", e);
      }
    };

    es.onerror = (err) => {
      addLog("ERRO DE CONEXÃO COM O SERVIDOR BRIDGE. CERTIFIQUE-SE DE QUE O 'server.ts' ESTÁ RODANDO.");
      setStatus('ERROR');
      es.close();
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-[#050505] border border-cyan-500/20 w-full max-w-2xl overflow-hidden shadow-[0_0_80px_rgba(34,211,238,0.1)] flex flex-col h-[500px] rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <TerminalIcon size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="font-black text-[10px] uppercase tracking-[0.4em] text-white">NEXUS CORE v4.0</h2>
              <p className="text-[8px] text-cyan-400 font-bold tracking-widest uppercase">MetaTrader 5 Native Bridge</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-all bg-white/5 p-2 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Status Bar */}
        <div className="bg-black/20 px-4 py-2 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full", 
                status === 'CONNECTED' ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : 
                status === 'CONNECTING' ? "bg-yellow-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">BRIDGE: {status}</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu size={12} className="text-cyan-500" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">OS: WINDOWS_X64</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-green-500/50">
            <ShieldCheck size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">ENCRYPTED</span>
          </div>
        </div>

        {/* Terminal Area */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 font-mono text-[11px] overflow-y-auto bg-black/60 custom-scrollbar space-y-1.5"
        >
          {logs.length === 0 && (
            <div className="text-white/20 flex flex-col items-center justify-center h-full gap-4">
               <Activity size={40} className="opacity-10 animate-pulse" />
               <span className="text-[10px] font-black tracking-widest uppercase italic">Aguardando inicialização do sistema quântico...</span>
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} className={cn(
              "flex gap-3",
              log.includes("SUCESSO") ? "text-green-400" : 
              log.includes("ERRO") ? "text-magenta-500 font-bold" : 
              "text-cyan-400/70"
            )}>
              <span className="opacity-20 shrink-0">[{i.toString().padStart(3, '0')}]</span>
              <span className="break-all">{log}</span>
            </div>
          ))}
          {status === 'CONNECTING' && (
            <div className="text-cyan-500 animate-pulse flex gap-3">
              <span className="opacity-20 shrink-0">[_]</span>
              <span>CARREGANDO PROTOCOLO...</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center">
          <div className="flex gap-6">
             <div className="flex flex-col">
               <span className="text-[8px] text-white/20 font-black uppercase">Latency</span>
               <span className="text-[10px] text-cyan-400 font-mono">14ms</span>
             </div>
             <div className="flex flex-col">
               <span className="text-[8px] text-white/20 font-black uppercase">Buffer</span>
               <span className="text-[10px] text-white/70 font-mono">OK</span>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="bg-white/5 text-white/60 hover:text-white hover:bg-white/10 font-black py-2 px-6 rounded-lg text-[9px] uppercase tracking-[0.2em] transition-all border border-white/5"
          >
            OCULTAR TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
};

