export interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SignalInfo {
  type: 'COMPRA' | 'VENDA' | 'NEUTRO';
  price: number;
  sl: number;
  tp: number;
  candleType: 'ALTA' | 'BAIXA';
  symbol: string;
  phase: string;
}

export interface AssetSignal {
  symbol: string;
  signal: 'COMPRA' | 'VENDA' | 'NEUTRO' | 'VENDA MODERADA' | 'COMPRA MODERADA';
  confidence: number;
  price: number;
  status: 'AUTO' | 'MANUAL';
  trend: 'up' | 'down' | 'neutral';
  condition?: string;
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'COMPRA' | 'VENDA';
  price: number;
  lot: number;
  sl: number;
  tp: number;
  time: string;
  status: 'OPEN' | 'CLOSED';
  profit?: number;
}

export type StrategyType = 'NEURAL_AI' | 'FIMATHE';

export interface FimatheSettings {
  minChannel: number;
  sliceChannel: number;
  maxChannel: number;
  openingHour: number;
  captureMinute: number;
  riskPerTrade: number;
  maxTrades: number;
  dailyRiskLimit: number;
  maxDrawdown: number;
  bodyStrength: number;
  maxReversalsPerDay: number;
}

export interface FimatheState {
  symbol: string;
  canalHigh: number;
  canalLow: number;
  referenciaHigh?: number;
  referenciaLow?: number;
  subcicloHigh?: number;
  subcicloLow?: number;
  canalSize: number;
  isDefined: boolean;
  isBroken: boolean;
  isWaitingRetest: boolean;
  direction: number; // 1: Buy, -1: Sell
  capturedToday: boolean;
  isManual: boolean;
  lastResetDay: number;
  reversaisToday: number;
  tradesToday: number;
  isSlicingApplied: boolean;
  phase: 'SETUP' | 'WAITING_BREAKOUT' | 'WAITING_RETEST' | 'WAITING_CONFIRMATION' | 'IN_TRADE';
  currentCycleStartBarIndex: number;
}

export interface AISettings {
  confidenceThreshold: number;
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  analysisModel: string;
}

export interface EconomicEvent {
  date: string;
  time: string;
  currency: string;
  event: string;
  impact: 'Low' | 'Medium' | 'High' | string;
  previous?: string;
  estimate?: string;
  actual?: string;
}

export interface TradingState {
  currentAsset: string;
  timeframe: string;
  balance: number;
  equity: number;
  profit: number;
  accountName: string;
  accountServer: string;
  lot: number;
  stopLoss: number;
  takeProfit: number;
  isRunning: boolean;
  isAutoScannerActive: boolean;
  maxTradesPerDay: number;
  riskPerTradePercent: number;
  maxOpenPositions: number;
  selectedScanAssets: string[];
  metrics: {
    tradesToday: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  calendar: EconomicEvent[];
  lastSignal: SignalInfo;
}
