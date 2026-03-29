import React from 'react';
import { X, Settings, Mic, Brain, Percent, Play } from 'lucide-react';
import { AISettings } from '../types';
import { cn } from '../lib/utils';
import { speakAnalysis } from '../services/geminiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onUpdate: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
  if (!isOpen) return null;

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
  const models = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast)' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Advanced)' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite (Efficient)' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container border border-outline-variant/30 w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b border-outline-variant/20 bg-surface-low">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-secondary" />
            <h2 className="font-headline font-black text-sm uppercase tracking-widest">Configurações da IA</h2>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Confidence Threshold */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
                <Percent size={14} className="text-primary" /> Limiar de Confiança
              </label>
              <span className="text-primary font-mono font-bold">{settings.confidenceThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="95" 
              step="5"
              value={settings.confidenceThreshold}
              onChange={(e) => onUpdate({ ...settings, confidenceThreshold: parseInt(e.target.value) })}
              className="w-full accent-primary h-1 bg-surface-low cursor-pointer"
            />
            <p className="text-[9px] text-on-surface-variant italic">A IA só emitirá alertas de voz para sinais acima deste valor.</p>
          </section>

          {/* Voice Selection */}
          <section className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
              <Mic size={14} className="text-primary" /> Voz do Alerta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {voices.map((v) => (
                <button
                  key={v}
                  onClick={() => onUpdate({ ...settings, voiceName: v as any })}
                  className={cn(
                    "py-2 text-[10px] font-bold border transition-all",
                    settings.voiceName === v 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-surface-low border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
            <button 
              onClick={() => speakAnalysis("Teste de voz do sistema ADK Quantum.", settings.voiceName)}
              className="w-full mt-2 py-2 bg-surface-bright text-primary text-[10px] font-black border border-primary/30 hover:bg-primary/10 transition-all flex items-center justify-center gap-2"
            >
              <Play size={12} fill="currentColor" /> TESTAR VOZ
            </button>
          </section>

          {/* Model Selection */}
          <section className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
              <Brain size={14} className="text-primary" /> Modelo de Análise
            </label>
            <div className="space-y-2">
              {models.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onUpdate({ ...settings, analysisModel: m.id })}
                  className={cn(
                    "w-full p-3 text-left text-[11px] font-bold border transition-all flex justify-between items-center",
                    settings.analysisModel === m.id 
                      ? "bg-primary/10 border-primary text-primary" 
                      : "bg-surface-low border-outline-variant/20 text-on-surface-variant hover:border-outline-variant/50"
                  )}
                >
                  {m.name}
                  {settings.analysisModel === m.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 bg-surface-low border-t border-outline-variant/20 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-primary text-black font-black py-2 px-6 text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
