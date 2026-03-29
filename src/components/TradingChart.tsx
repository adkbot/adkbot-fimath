import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData as LW_CandlestickData, ColorType, UTCTimestamp, CandlestickSeries, CrosshairMode } from 'lightweight-charts';
import { CandlestickData, FimatheState } from '../types';
import { BarChart3, Search } from 'lucide-react';

interface TradingChartProps {
  data: CandlestickData[];
  symbol: string;
  timeframe: string;
  onSymbolChange: (s: string) => void;
  onTimeframeChange: (tf: string) => void;
  orders: any[];
  fimatheState?: FimatheState;
  onManualCapture?: () => void;
  isRunning?: boolean;
}

export const TradingChart: React.FC<TradingChartProps> = ({ 
  data, 
  symbol, 
  timeframe, 
  onSymbolChange, 
  onTimeframeChange,
  orders,
  fimatheState,
  onManualCapture,
  isRunning
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [inputSymbol, setInputSymbol] = useState(symbol);
  const priceLinesRef = useRef<any[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0F14' },
        textColor: '#808080',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelVisible: true, color: 'rgba(255, 255, 255, 0.2)', style: 2 },
        horzLine: { labelVisible: true, color: 'rgba(255, 255, 255, 0.2)', style: 2 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00E676',
      downColor: '#FF5252',
      borderVisible: false,
      wickUpColor: '#00E676',
      wickDownColor: '#FF5252',
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      const formatted = data.map(d => ({
        time: (new Date(d.time).getTime() / 1000) as UTCTimestamp,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
      seriesRef.current.setData(formatted);
    }
  }, [data]);

  // Unified effect for ALL Price Lines (Orders + Fimathe Levels)
  useEffect(() => {
    if (!seriesRef.current) return;

    // 1. Clear ALL existing price lines first
    priceLinesRef.current.forEach(line => {
        try { seriesRef.current?.removePriceLine(line); } catch (e) {}
    });
    priceLinesRef.current = [];

    const addLine = (price: number, color: string, title: string, style: number = 0) => {
        if (!price || isNaN(price)) return;
        try {
            const line = seriesRef.current?.createPriceLine({
                price,
                color,
                lineWidth: 1,
                lineStyle: style,
                axisLabelVisible: true,
                title,
            });
            if (line) priceLinesRef.current.push(line);
        } catch (e) {
            console.error("Error adding price line:", e);
        }
    };

    // 2. Add Order Lines (SL/TP/Entry)
    orders.forEach(order => {
      if (order.symbol !== symbol) return;
      
      addLine(order.price_open, order.type === 'BUY' ? '#00E676' : '#FF5252', `${order.type} ${order.price_open.toFixed(5)}`);
      if (order.sl > 0) addLine(order.sl, '#FF5252', `SL ${order.sl.toFixed(5)}`, 2);
      if (order.tp > 0) addLine(order.tp, '#00C853', `TP ${order.tp.toFixed(5)}`, 2);
    });

    // 3. Add Fimathe Levels (CR, ZN, SC)
    if (fimatheState?.isDefined) {
        // CR - Canal de Referência (Bold Green/Red)
        addLine(fimatheState.canalHigh, '#00ff88', `CR TOPO (${fimatheState.canalHigh.toFixed(5)})`, 0);
        addLine(fimatheState.canalLow, '#ff3366', `CR FUNDO (${fimatheState.canalLow.toFixed(5)})`, 0);
        
        // ZN - Zona Neutra (Dashed for clear distinction)
        if (fimatheState.referenciaHigh) addLine(fimatheState.referenciaHigh, '#00e5ff', `ZN TOPO (${fimatheState.referenciaHigh.toFixed(5)})`, 2);
        if (fimatheState.referenciaLow) addLine(fimatheState.referenciaLow, '#ff00ff', `ZN FUNDO (${fimatheState.referenciaLow.toFixed(5)})`, 2);
        
        // SC - Subciclo (Slightly more subtle color)
        if (fimatheState.subcicloHigh) addLine(fimatheState.subcicloHigh, '#ccff00', `SC TOPO (${fimatheState.subcicloHigh.toFixed(5)})`, 3);
        if (fimatheState.subcicloLow) addLine(fimatheState.subcicloLow, '#ff8000', `SC FUNDO (${fimatheState.subcicloLow.toFixed(5)})`, 3);
    }

    return () => {
        priceLinesRef.current.forEach(line => {
            try { seriesRef.current?.removePriceLine(line); } catch (e) {}
        });
        priceLinesRef.current = [];
    };
  }, [orders, fimatheState, symbol]);

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-wider text-white">
            Gráfico de Velas em Tempo Real
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              value={inputSymbol}
              onChange={(e) => setInputSymbol(e.target.value.toUpperCase())}
              placeholder="DIGITE O ATIVO"
              className="bg-black/40 border border-secondary px-3 py-1.5 rounded text-[11px] font-bold text-white placeholder:text-white/20 w-40 focus:outline-none focus:ring-1 focus:ring-secondary/50"
            />
          </div>
          <button 
            onClick={() => onSymbolChange(inputSymbol)}
            className="bg-secondary hover:bg-secondary/80 text-white px-4 py-1.5 rounded text-[11px] font-black uppercase transition-all"
          >
            IR
          </button>

          {onManualCapture && (
            <button 
                onClick={onManualCapture}
                className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-4 py-1.5 rounded text-[11px] font-black uppercase transition-all flex items-center gap-2"
            >
                <BarChart3 className="w-3.5 h-3.5" />
                CAPTURAR CANAL
            </button>
          )}
          
          <select 
            value={symbol}
            onChange={(e) => onSymbolChange(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-1.5 rounded text-[11px] font-bold text-white focus:outline-none"
          >
            <option value="EURUSD">EURUSD</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="BTCUSD">BTCUSD</option>
          </select>

          <select 
            value={timeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="bg-black/40 border border-white/10 px-3 py-1.5 rounded text-[11px] font-bold text-white focus:outline-none"
          >
            <option value="M1">M1</option>
            <option value="M2">M2</option>
            <option value="M5">M5</option>
            <option value="M15">M15</option>
            <option value="H1">H1</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      <div ref={chartContainerRef} className="flex-1 min-h-0" />

      {/* Footer / Legend */}
      <div className="p-3 bg-black/20 border-t border-white/5 flex items-center justify-center gap-6">
        <LegendItem color="bg-success" label="Entrada BUY" />
        <LegendItem color="bg-danger" label="Entrada SELL" />
        <LegendItem color="bg-success" label="TP" isDashed />
        <LegendItem color="bg-danger" label="SL" isDashed />
        <LegendItem color="bg-primary" label="Vela Alta" />
        <LegendItem color="bg-danger" label="Vela Baixa" />
      </div>
    </div>
  );
};

const LegendItem: React.FC<{ color: string; label: string; isDashed?: boolean }> = ({ color, label, isDashed }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-0.5 ${color} ${isDashed ? 'opacity-50 border-t border-dashed' : ''}`} />
    <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{label}</span>
  </div>
);
