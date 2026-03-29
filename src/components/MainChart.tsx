import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData as LW_CandlestickData, ColorType, UTCTimestamp, CandlestickSeries, LineSeries, CrosshairMode } from 'lightweight-charts';
import { CandlestickData, FimatheState } from '@/types';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, Settings, Save, LayoutGrid, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainChartProps {
  data: CandlestickData[];
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  fimatheState?: FimatheState;
}

export const MainChart: React.FC<MainChartProps> = ({ data, timeframe, onTimeframeChange, fimatheState }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const highLineRef = useRef<any>(null);
  const lowLineRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    // Ensure the container is empty to avoid insertBefore errors with React
    chartContainerRef.current.innerHTML = '';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#050505' },
        textColor: '#808080',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)', style: 2 },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)', style: 2 },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(34, 211, 238, 0.5)', width: 1, style: 0 },
        horzLine: { color: 'rgba(34, 211, 238, 0.5)', width: 1, style: 0 },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: { top: 0.1, bottom: 0.15 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        fixLeftEdge: true,
        rightOffset: 12,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ffcc',
      downColor: '#ff0066',
      borderVisible: false,
      wickUpColor: '#00ffcc',
      wickDownColor: '#ff0066',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !data.length) return;

    const formattedData: LW_CandlestickData[] = data.map(d => ({
      time: (new Date(d.time).getTime() / 1000) as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeriesRef.current.setData(formattedData);

  }, [data]);

  // Handle Fimathe lines
  useEffect(() => {
    const series = candlestickSeriesRef.current;
    if (!series) return;

    // Remove existing lines safely
    if (highLineRef.current) {
        try { series.removePriceLine(highLineRef.current); } catch(e) {}
        highLineRef.current = null;
    }
    if (lowLineRef.current) {
        try { series.removePriceLine(lowLineRef.current); } catch(e) {}
        lowLineRef.current = null;
    }

    if (fimatheState?.isDefined) {
        highLineRef.current = series.createPriceLine({
            price: fimatheState.canalHigh,
            color: '#0ea5e9',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'Canal High',
        });
        lowLineRef.current = series.createPriceLine({
            price: fimatheState.canalLow,
            color: '#f43f5e',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'Canal Low',
        });
    }
  }, [fimatheState?.canalHigh, fimatheState?.canalLow, fimatheState?.isDefined]);

  const handleZoomIn = () => chartRef.current?.timeScale().zoomIn();
  const handleZoomOut = () => chartRef.current?.timeScale().zoomOut();
  const handleReset = () => {
     chartRef.current?.timeScale().resetTimeScale();
     chartRef.current?.timeScale().fitContent();
  };
  
  const toggleFullScreen = () => {
    const element = chartContainerRef.current?.closest('.flex-1');
    if (!document.fullscreenElement) {
      element?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const timeframes = ['M1', 'M2', 'M5', 'M15', 'M30', 'H1'];

  return (
    <div className="flex-1 bg-[#050505] relative border-b border-white/5 flex flex-col overflow-hidden">
      {/* Chart Header - Premium Glass Look */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <LayoutGrid size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Quantum View</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-[11px] tracking-widest">{(data[data.length-1]?.close ?? 0).toFixed(5)}</span>
            <span className={cn(
               "text-[9px] font-bold px-1.5 py-0.5 rounded",
               data[data.length-1]?.close > data[0]?.close ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
            )}>
               {data[0]?.close && data[data.length-1]?.close ? (((data[data.length-1].close / data[0].close) - 1) * 100).toFixed(2) : "0.00"}%
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "text-[9px] font-black px-2.5 py-1 rounded-md transition-all",
                timeframe === tf ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "text-white/30 hover:text-white hover:bg-white/5"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={toggleFullScreen} className="text-white/40 hover:text-white transition-all bg-white/5 p-1.5 rounded-lg"><Maximize2 size={14} /></button>
        </div>
      </div>

      {/* Tools Floating Panel */}
      <div className="absolute left-4 top-16 w-10 flex flex-col gap-2 z-20">
        <ToolBtn icon={<ZoomIn size={16} />} onClick={handleZoomIn} />
        <ToolBtn icon={<ZoomOut size={16} />} onClick={handleZoomOut} />
        <ToolBtn icon={<RotateCcw size={16} />} onClick={handleReset} />
        <div className="h-px w-6 bg-white/5 mx-auto my-1" />
        <ToolBtn icon={<Target size={16} />} active />
        <ToolBtn icon={<LayoutGrid size={16} />} />
      </div>

      {/* Real-time Indicator Banner */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-2 bg-black/80 backdrop-blur-xl border border-white/5 rounded-2xl flex items-center gap-6 shadow-2xl">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Signal Stream</span>
         </div>
         <div className="h-4 w-px bg-white/10" />
          <span className={cn(
            "text-xs font-black uppercase tracking-widest",
            (data[data.length-1]?.close || 0) > (data[data.length-2]?.close || 0) ? "text-cyan-400" : "text-magenta-500"
          )}>
            {(data[data.length-1]?.close || 0) > (data[data.length-2]?.close || 0) ? "Ascending Wave" : "Descending Force"}
          </span>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="flex-1 w-full" />
    </div>
  );
};

const ToolBtn: React.FC<{ icon: React.ReactNode; onClick?: () => void; active?: boolean }> = ({ icon, onClick, active }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-10 h-10 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 text-white/40 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all",
      active && "bg-cyan-500/10 border-cyan-500/40 text-cyan-400"
    )}
  >
    {icon}
  </button>
);


