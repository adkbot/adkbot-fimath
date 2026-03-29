import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dashboard } from './components/Dashboard';
import { INITIAL_SIGNALS, generateMockChartData } from './constants';
import { TradingState, CandlestickData, Trade, EconomicEvent } from './types';
import { speakAnalysis } from './services/geminiService';
import { FimatheService, DEFAULT_FIMATHE_SETTINGS, INITIAL_FIMATHE_STATE } from './services/fimatheService';

export default function App() {
  const [state, setState] = useState<TradingState>({
    currentAsset: 'XAUUSD',
    timeframe: 'M2',
    balance: 0,
    equity: 0,
    profit: 0,
    accountName: '---',
    accountServer: '---',
    lot: 0.10,
    stopLoss: 30,
    takeProfit: 60,
    isRunning: false,
    isAutoScannerActive: false,
    maxTradesPerDay: 5,
    riskPerTradePercent: 1.0,
    maxOpenPositions: 3,
    selectedScanAssets: ['EURUSD', 'GBPUSD'],
    signals: INITIAL_SIGNALS,
    history: [],
    positions: [],
    isAnalyzing: false,
    lastAnalysis: '',
    settings: {
      confidenceThreshold: 70,
      voiceName: 'Kore',
      analysisModel: 'gemini-1.5-flash',
    },
    fimatheSettings: {
        ...DEFAULT_FIMATHE_SETTINGS,
        openingHour: 9,
        captureMinute: 0,
        maxReversalsPerDay: 1,
    },
    fimatheStates: {
        'XAUUSD': INITIAL_FIMATHE_STATE('XAUUSD')
    },
    metrics: {
      tradesToday: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    },
    calendar: [],
    lastSignal: {
      type: 'NEUTRO',
      price: 0,
      sl: 0,
      tp: 0,
      candleType: 'ALTA',
      symbol: 'XAUUSD'
    }
  });

  const [chartData, setChartData] = useState<CandlestickData[]>(generateMockChartData(100));
  const eventSourceRef = useRef<EventSource | null>(null);

  const [isConnecting, setIsConnecting] = useState(false);

  // 1. Connect to Bridge & Handle Real-time Data
  const connectMT5 = useCallback(() => {
    if (isConnecting) return;
    setIsConnecting(true);
    
    if (eventSourceRef.current) {
        eventSourceRef.current.close();
    }

    eventSourceRef.current = new EventSource('http://localhost:3001/api/connect-mt5');
    
    eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'connection_success') {
            setIsConnecting(false);
            speakAnalysis("Conexão com MetaTrader 5 estabelecida automaticamente.", state.settings.voiceName);
        }
        if (data.type === 'error') {
            setIsConnecting(false);
            console.error("Erro na conexão:", data.message);
        }
        
        if (data.type === 'status' || data.type === 'connection_success') {
            setState(prev => {
              const positions = data.positions ?? prev.positions;
              const tradesToday = prev.history.length + positions.length; // Simplified for demo
              const wins = prev.history.filter(t => (t.profit || 0) > 0).length;
              const losses = prev.history.filter(t => (t.profit || 0) < 0).length;
              const winRate = tradesToday > 0 ? (wins / (wins + losses || 1)) * 100 : 0;

              return { 
                ...prev, 
                balance: data.balance ?? prev.balance, 
                equity: data.equity ?? prev.equity,
                profit: data.profit ?? prev.profit,
                accountName: data.name ?? prev.accountName,
                accountServer: data.server ?? prev.accountServer,
                positions: positions,
                metrics: {
                  tradesToday,
                  wins,
                  losses,
                  winRate
                }
              };
            });
        }
    };

    eventSourceRef.current.onerror = () => {
        setIsConnecting(false);
        eventSourceRef.current?.close();
    };
  }, [isConnecting, state.settings.voiceName]);

  useEffect(() => {
    connectMT5();
    return () => {
        eventSourceRef.current?.close();
    };
  }, []);

  // 2. Fetch Economic Calendar
  const fetchCalendar = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/calendar');
      const data = await response.json();
      setState(prev => ({ ...prev, calendar: data }));
    } catch (e) {
      console.error("Erro ao buscar calendário:", e);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
    const interval = setInterval(fetchCalendar, 60000); // 60s
    return () => clearInterval(interval);
  }, [fetchCalendar]);

  // 3. Fetch Chart History
  const isFetchingHistoryRef = useRef(false);
  const fetchHistory = useCallback(async (symbol: string, tf: string) => {
    if (isFetchingHistoryRef.current) return;
    isFetchingHistoryRef.current = true;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`http://localhost:3001/api/history?symbol=${symbol}&timeframe=${tf}&count=200`, {
        signal: controller.signal
      });
      clearTimeout(id);
      const realData = await res.json();
      if (realData && realData.length > 0) {
        const formatted = realData.map((d: any) => ({
          ...d,
          time: new Date(d.time * 1000).toISOString()
        }));
        setChartData(formatted);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        console.error("Erro ao buscar histórico:", e);
      }
    } finally {
      isFetchingHistoryRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchHistory(state.currentAsset, state.timeframe);
    const interval = setInterval(() => fetchHistory(state.currentAsset, state.timeframe), 5000);
    return () => clearInterval(interval);
  }, [state.currentAsset, state.timeframe, fetchHistory]);

  const handleSymbolChange = (symbol: string) => {
    setState(prev => ({ ...prev, currentAsset: symbol }));
  };

  const handleTimeframeChange = (tf: string) => {
    setState(prev => ({ ...prev, timeframe: tf }));
  };

  const handleToggleBot = () => {
    setState(prev => {
        const newState = !prev.isRunning;
        return { ...prev, isRunning: newState };
    });
    // Side-effects outside of state update
    if (!state.isRunning) {
        speakAnalysis("Iniciando protocolo de negociação automática.", state.settings.voiceName);
    } else {
        speakAnalysis("Protocolo de negociação interrompido.", state.settings.voiceName);
    }
  };

  // Update Live Signal (Candle Status) regardless of bot state
  useEffect(() => {
    if (chartData.length < 5) return;
    const sym = state.currentAsset;
    const currentFimathe = state.fimatheStates[sym] || INITIAL_FIMATHE_STATE(sym);
    const liveSignal = FimatheService.getLiveSignal(currentFimathe, chartData);
    if (liveSignal) {
      setState(prev => ({ 
        ...prev, 
        lastSignal: {
          ...liveSignal,
          phase: currentFimathe.phase
        } 
      }));
    }
  }, [chartData, state.currentAsset, state.fimatheStates]);

  const handleManualCapture = () => {
    const capture = FimatheService.captureManual(chartData);
    setState(prev => ({
        ...prev,
        fimatheStates: {
            ...prev.fimatheStates,
            [prev.currentAsset]: {
                ...INITIAL_FIMATHE_STATE(prev.currentAsset),
                ...capture
            } as any
        }
    }));
    speakAnalysis("Canal capturado manualmente.", state.settings.voiceName);
  };

  const handleUpdateSetting = (key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleScanner = () => {
    setState(prev => {
        const newState = !prev.isAutoScannerActive;
        return { ...prev, isAutoScannerActive: newState };
    });
    // Side-effects outside of state update
    if (!state.isAutoScannerActive) {
        speakAnalysis("Auto-scanner ativado. Monitorando ativos selecionados.", state.settings.voiceName);
    } else {
        speakAnalysis("Auto-scanner desativado.", state.settings.voiceName);
    }
  };

  // 4. Strategy Execution Loop (Main Chart)
  useEffect(() => {
    if (!state.isRunning || chartData.length < 5) return;

    const interval = setInterval(() => {
        if (new Date().getSeconds() % 30 === 0) {
            console.log(`[BOT] Estratégia Ativa no gráfico: ${state.currentAsset}. Monitorando preços...`);
        }

        let execSignal: string | null = null;
        let execSymbol: string = state.currentAsset;
        let isBrokenDetected: boolean = false;
        let brokenDirection: 'ALTA' | 'BAIXA' | null = null;

        setState(prev => {
            const sym = prev.currentAsset;
            const currentFimathe = prev.fimatheStates[sym] || INITIAL_FIMATHE_STATE(sym);
            if (!currentFimathe.isDefined) return prev;

            const { nextState, signal } = FimatheService.processTick(currentFimathe, chartData, prev.fimatheSettings);
            
            if (nextState.isBroken && !currentFimathe.isBroken) {
                isBrokenDetected = true;
                brokenDirection = nextState.direction === 1 ? 'ALTA' : 'BAIXA';
            }
            if (signal) {
                execSignal = signal;
            }

            return {
                ...prev,
                fimatheStates: {
                    ...prev.fimatheStates,
                    [sym]: nextState
                }
            };
        });

        // Trigger side-effects based on captured variables
        if (isBrokenDetected) {
            console.log(`[BOT] ${execSymbol}: Rompimento Detectado! Direção: ${brokenDirection}. Aguardando reteste...`);
        }
        if (execSignal) {
            console.log(`[BOT] ${execSymbol}: SINAL DE ${execSignal} CONFIRMADO.`);
            speakAnalysis(`Sinal de ${execSignal} detectado em ${execSymbol}. Executando operação.`, state.settings.voiceName);
            new Audio('/sounds/entry.mp3').play().catch(() => {});
            
            fetch('http://localhost:3001/api/trade', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    symbol: execSymbol, type: execSignal, lot: state.lot, sl: state.stopLoss, tp: state.takeProfit
                })
            }).catch(err => console.error(`[BRIDGE] Erro no trade ${execSymbol}:`, err));
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, chartData, state.currentAsset, state.fimatheSettings, state.lot, state.stopLoss, state.takeProfit, state.settings.voiceName]);

  // 5. Auto-Scanner Background Loop (Multi-Asset)
  const isScanningRef = useRef(false);
  useEffect(() => {
    if (!state.isAutoScannerActive) return;

    const scanAll = async () => {
        if (isScanningRef.current) return;
        isScanningRef.current = true;
        
        const { selectedScanAssets, timeframe, currentAsset, fimatheSettings, lot, stopLoss, takeProfit, settings } = state;
        const updates: Record<string, any> = {};
        const signalsToExecute: {symbol: string, signal: string}[] = [];
        
        try {
            for (const symbol of selectedScanAssets) {
                if (symbol === currentAsset) continue;
                await new Promise(r => setTimeout(r, 600)); 

                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(`http://localhost:3001/api/history?symbol=${symbol}&timeframe=${timeframe}&count=30`, {
                    signal: controller.signal
                });
                clearTimeout(tid);
                if (!res.ok) continue;
                const history = await res.json();
                if (!history || history.length < 5) continue;

                const formatted = history.map((d: any) => ({
                    time: d.time, open: d.open, high: d.high, low: d.low, close: d.close
                }));

                const currentState = state.fimatheStates[symbol] || INITIAL_FIMATHE_STATE(symbol);
                const { nextState, signal } = FimatheService.processTick(currentState, formatted, fimatheSettings);

                if (signal && state.positions.length < state.maxOpenPositions && state.metrics.tradesToday < state.maxTradesPerDay) {
                     signalsToExecute.push({ symbol, signal });
                }
                updates[symbol] = nextState;
            }

            if (Object.keys(updates).length > 0) {
                setState(prev => ({
                    ...prev,
                    fimatheStates: { ...prev.fimatheStates, ...updates }
                }));
            }

            for (const item of signalsToExecute) {
                console.log(`[SCANNER] Sinal de ${item.signal} em ${item.symbol}`);
                speakAnalysis(`Scanner detectou ${item.signal} em ${item.symbol}.`, settings.voiceName);
                fetch('http://localhost:3001/api/trade', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        symbol: item.symbol, type: item.signal, lot, sl: stopLoss, tp: takeProfit
                    })
                }).catch(err => console.error("Erro scanner trade:", err));
            }
        } catch (e) {
            console.error("Scanner Error:", e);
        } finally {
            isScanningRef.current = false;
        }
    };

    const interval = setInterval(scanAll, 12000); 
    return () => clearInterval(interval);
  }, [state.isAutoScannerActive, state.selectedScanAssets, state.timeframe, state.currentAsset, state.fimatheSettings, state.lot, state.stopLoss, state.takeProfit, state.positions.length, state.maxOpenPositions, state.metrics.tradesToday, state.maxTradesPerDay, state.settings.voiceName]);

  // 6. Global Notifications for Terminal Events & Continuity Loop
  const prevPosCountRef = useRef<number>(0);
  useEffect(() => {
    const currentCount = state.positions.length;
    if (prevPosCountRef.current > 0 && currentCount < prevPosCountRef.current) {
        // A trade was closed!
        speakAnalysis("Operação finalizada. Iniciando novo ciclo de continuidade.", state.settings.voiceName);
        
        setState(prev => {
            const sym = prev.currentAsset; // Assuming continuity on current asset for now
            const newState = INITIAL_FIMATHE_STATE(sym);
            newState.phase = 'SETUP';
            newState.currentCycleStartBarIndex = chartData.length - 1; 
            newState.tradesToday = prev.fimatheStates[sym]?.tradesToday || 0;
            newState.reversaisToday = prev.fimatheStates[sym]?.reversaisToday || 0;

            return {
                ...prev,
                fimatheStates: {
                    ...prev.fimatheStates,
                    [sym]: newState
                }
            };
        });
    } else if (currentCount > prevPosCountRef.current) {
        speakAnalysis("Nova operação detectada no terminal.", state.settings.voiceName);
    }
    prevPosCountRef.current = currentCount;
  }, [state.positions.length, state.settings.voiceName, chartData.length]);

  return (
    <div className="bg-background min-h-screen">
      <Dashboard 
        state={state}
        chartData={chartData}
        onSymbolChange={handleSymbolChange}
        onTimeframeChange={handleTimeframeChange}
        isConnecting={isConnecting}
        onConnect={connectMT5}
        onToggleBot={handleToggleBot}
        onManualCapture={handleManualCapture}
        onUpdateSetting={handleUpdateSetting}
        onToggleScanner={handleToggleScanner}
      />
    </div>
  );
}
