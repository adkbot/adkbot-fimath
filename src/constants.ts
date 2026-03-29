import { AssetSignal, CandlestickData } from "./types";

export const INITIAL_SIGNALS: AssetSignal[] = [
  { symbol: 'EURUSD', signal: 'VENDA MODERADA', confidence: 58, price: 1.15897, status: 'AUTO', trend: 'down' },
  { symbol: 'GBPUSD', signal: 'VENDA', confidence: 85, price: 1.33936, status: 'AUTO', trend: 'down' },
  { symbol: 'USDJPY', signal: 'COMPRA', confidence: 85, price: 158.74200, status: 'AUTO', trend: 'up' },
  { symbol: 'AUDUSD', signal: 'VENDA', confidence: 76, price: 0.69637, status: 'AUTO', trend: 'down' },
  { symbol: 'USDCAD', signal: 'COMPRA MODERADA', confidence: 58, price: 1.37487, status: 'AUTO', trend: 'up' },
  { symbol: 'USDCHF', signal: 'COMPRA', confidence: 78, price: 0.78758, status: 'MANUAL', trend: 'up' },
  { symbol: 'NZDUSD', signal: 'NEUTRO', confidence: 0, price: 0.58276, status: 'MANUAL', trend: 'neutral' },
  { symbol: 'XAUUSD', signal: 'NEUTRO', confidence: 0, price: 4409.72, status: 'AUTO', trend: 'neutral' },
  { symbol: 'US30', signal: 'VENDA MODERADA', confidence: 60, price: 46073.65, status: 'AUTO', trend: 'down' },
];

export const generateMockChartData = (count: number): CandlestickData[] => {
  let base = 1.1580;
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const open = base + Math.random() * 0.002 - 0.001;
    const close = open + Math.random() * 0.002 - 0.001;
    const high = Math.max(open, close) + Math.random() * 0.0005;
    const low = Math.min(open, close) - Math.random() * 0.0005;
    base = close;
    
    const time = new Date(now.getTime() - (count - i) * 60 * 5 * 1000); // 5 minute intervals
    return {
      time: time.toISOString(),
      open,
      high,
      low,
      close,
    };
  });
};
