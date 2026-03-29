import { FimatheSettings, FimatheState, CandlestickData } from '../types';

export const INITIAL_FIMATHE_STATE = (symbol: string): FimatheState => ({
  symbol,
  canalHigh: 0,
  canalLow: 0,
  canalSize: 0,
  isDefined: false,
  isBroken: false,
  isWaitingRetest: false,
  direction: 0,
  capturedToday: false,
  lastResetDay: -1,
  isManual: false,
  reversaisToday: 0,
  tradesToday: 0,
  isSlicingApplied: false,
  phase: 'SETUP',
  currentCycleStartBarIndex: -1
});

export const DEFAULT_FIMATHE_SETTINGS: FimatheSettings = {
  minChannel: 200,
  sliceChannel: 1000,
  maxChannel: 3500,
  openingHour: 15,
  captureMinute: 30,
  riskPerTrade: 1.0,
  maxTrades: 2,
  dailyRiskLimit: 3.0,
  maxDrawdown: 10.0,
  bodyStrength: 0.6,
  maxReversalsPerDay: 1,
};

export class FimatheService {
  static checkDailyReset(state: FimatheState): FimatheState {
    const now = new Date();
    const today = now.getDate();

    if (state.lastResetDay !== today) {
      return {
        ...state,
        isDefined: false,
        isBroken: false,
        isWaitingRetest: false,
        capturedToday: false,
        lastResetDay: today,
      };
    }
    return state;
  }

  static captureManual(bars: CandlestickData[]): Partial<FimatheState> {
    if (bars.length < 5) return { isDefined: false };

    // Use latest 4 bars
    let high = bars[bars.length - 1].high;
    let low = bars[bars.length - 1].low;

    for (let i = 1; i < 4; i++) {
      const idx = bars.length - 1 - i;
      high = Math.max(high, bars[idx].high);
      low = Math.min(low, bars[idx].low);
    }

    const size = high - low;

    return {
      canalHigh: high,
      canalLow: low,
      canalSize: size,
      isDefined: true,
      capturedToday: true,
      isManual: true,
    };
  }

  static captureChannel(bars: CandlestickData[], settings: FimatheSettings): Partial<FimatheState> {
    if (bars.length < 5) return { isDefined: false };

    // 1. Identify start of session time today
    const now = new Date();
    const sessionStart = new Date(now);
    sessionStart.setHours(settings.openingHour, settings.captureMinute, 0, 0);

    // 2. Filter bars that start at or after sessionStart on the current day
    const sessionBars = bars.filter(bar => {
        const barDate = new Date(bar.time);
        return barDate.getTime() >= sessionStart.getTime() && barDate.getDate() === now.getDate();
    });

    // 3. We need at least 4 completed candles from the session start
    // If timeframe is M2, 4 candles = 8 minutes. We look for >= 4 candles.
    if (sessionBars.length < 4) return { isDefined: false };

    // 4. Capture EXACTLY the first 4 candles of the session
    const firstFour = sessionBars.slice(0, 4);
    
    let high = -Infinity;
    let low = Infinity;

    firstFour.forEach(bar => {
        if (bar.high > high) high = bar.high;
        if (bar.low < low) low = bar.low;
    });

    let size = (high - low);
    const sizePoints = Math.round(size * 100000); 

    if (sizePoints < settings.minChannel || sizePoints > settings.maxChannel) {
        console.log(`[PCM] Canal Rejeitado (Tamanho fora dos limites: ${sizePoints} pts)`);
        return { isDefined: false };
    }

    if (sizePoints > settings.sliceChannel) {
      size /= 2.0;
      high = low + size;
    }

    console.log(`[PCM] Canal Capturado com Precisão (Primeiros 4 Candles M2)`);
    console.log(`[PCM] High (Wick): ${high.toFixed(5)} / Low (Wick): ${low.toFixed(5)}`);

    return {
      canalHigh: high,
      canalLow: low,
      canalSize: size,
      referenciaHigh: high + size, // 100% Projection (Expansion)
      referenciaLow: low - size,   // Bottom of Neutral Zone
      subcicloHigh: high + (size / 2),
      subcicloLow: low - (size / 2),
      isDefined: true,
      capturedToday: true,
    };
  }

  static isStrongBreakout(bar: CandlestickData, threshold: number = 0.6): boolean {
    const open = bar.open;
    const close = bar.close;
    const high = bar.high;
    const low = bar.low;

    const body = Math.abs(close - open);
    const range = high - low;

    if (range === 0) return false;
    return body >= range * threshold;
  }

  static processTick(
    state: FimatheState,
    bars: CandlestickData[],
    settings: FimatheSettings
  ): { nextState: FimatheState; signal: 'COMPRA' | 'VENDA' | null } {
    let nextState = { ...state };
    let signal: 'COMPRA' | 'VENDA' | null = null;

    nextState = this.checkDailyReset(nextState);

    // Filter bars for the current cycle
    const now = new Date();
    const currentBar = bars[bars.length - 1];
    const lastCompletedBar = bars[bars.length - 2];

    // --- PHASE 1: SETUP (Channel Capture) ---
    if (nextState.phase === 'SETUP') {
        const sessionStart = new Date(now);
        sessionStart.setHours(settings.openingHour, settings.captureMinute, 0, 0);

        const sessionBars = bars.filter(bar => {
            const barDate = new Date(bar.time);
            return barDate.getTime() >= sessionStart.getTime() && barDate.getDate() === now.getDate();
        });

        // Continuity check: If we just finished a trade, we might start a new cycle from a specific bar
        const relevantBars = nextState.currentCycleStartBarIndex >= 0 
            ? bars.slice(nextState.currentCycleStartBarIndex)
            : sessionBars;

        if (relevantBars.length >= 4) {
            const capture = this.captureChannel(relevantBars, settings);
            if (capture.isDefined) {
                nextState = { ...nextState, ...capture, phase: 'WAITING_BREAKOUT' } as FimatheState;
                nextState.isSlicingApplied = (capture.canalSize! * 100000) > settings.sliceChannel;
            }
        }
        return { nextState, signal };
    }

    if (!nextState.isDefined) return { nextState, signal };

    // --- PHASE 2: WAITING_BREAKOUT ---
    if (nextState.phase === 'WAITING_BREAKOUT') {
        if (!this.isStrongBreakout(lastCompletedBar, settings.bodyStrength)) return { nextState, signal };

        if (lastCompletedBar.close > nextState.canalHigh) {
            nextState.direction = 1;
            nextState.phase = 'WAITING_RETEST';
            nextState.isBroken = true;
            nextState.isWaitingRetest = true;
        } else if (lastCompletedBar.close < nextState.canalLow) {
            nextState.direction = -1;
            nextState.phase = 'WAITING_RETEST';
            nextState.isBroken = true;
            nextState.isWaitingRetest = true;
        }
        return { nextState, signal };
    }

    // --- PHASE 3: WAITING_RETEST ---
    if (nextState.phase === 'WAITING_RETEST') {
        const touchedLevel = nextState.direction === 1 
            ? currentBar.low <= nextState.canalHigh 
            : currentBar.high >= nextState.canalLow;

        if (touchedLevel) {
            nextState.phase = 'WAITING_CONFIRMATION';
            nextState.isWaitingRetest = false;
        }
        // Reversal Check while waiting retest
        this.checkReversal(nextState, lastCompletedBar);
        return { nextState, signal };
    }

    // --- PHASE 4: WAITING_CONFIRMATION ---
    if (nextState.phase === 'WAITING_CONFIRMATION') {
        // Confirmation: price breaks the breakout candle high (for buy) or low (for sell)
        // For simplicity: break current channel or 50% projection
        const confirmed = nextState.direction === 1
            ? currentBar.close > lastCompletedBar.high
            : currentBar.close < lastCompletedBar.low;

        if (confirmed) {
            signal = nextState.direction === 1 ? 'COMPRA' : 'VENDA';
            nextState.phase = 'IN_TRADE';
            nextState.tradesToday++;
        }
        
        // Reversal Check
        this.checkReversal(nextState, lastCompletedBar);
        return { nextState, signal };
    }

    // --- PHASE 5: IN_TRADE (Monitoring for Reversal) ---
    if (nextState.phase === 'IN_TRADE') {
        const reversed = this.checkReversal(nextState, lastCompletedBar);
        if (reversed) {
            signal = nextState.direction === 1 ? 'COMPRA' : 'VENDA'; // direction already flipped in checkReversal
            nextState.reversaisToday++;
        }
    }

    return { nextState, signal };
  }

  static checkReversal(state: FimatheState, lastBar: CandlestickData): boolean {
    // Reversal if price closes below Neutral Zone (referenciaLow for Buy, referenciaHigh for Sell)
    if (state.direction === 1 && lastBar.close < state.referenciaLow!) {
        state.direction = -1;
        state.phase = 'IN_TRADE';
        return true;
    }
    if (state.direction === -1 && lastBar.close > state.referenciaHigh!) {
        state.direction = 1;
        state.phase = 'IN_TRADE';
        return true;
    }
    return false;
  }

  static getLiveSignal(state: FimatheState, bars: CandlestickData[]): any {
    if (!bars || bars.length === 0) return null;
    const lastBar = bars[bars.length - 1];
    
    const candleType = lastBar.close > lastBar.open ? 'ALTA' : 'BAIXA';
    
    let type: 'COMPRA' | 'VENDA' | 'NEUTRO' = 'NEUTRO';
    let sl = 0;
    let tp = 0;

    if (state.isDefined) {
      if (state.direction === 1 || (state.phase === 'WAITING_BREAKOUT' && lastBar.close > state.canalHigh)) {
        type = 'COMPRA';
        sl = state.referenciaLow || 0; // Bottom of ZN
        tp = state.referenciaHigh || 0; // 100% Expansion
      } else if (state.direction === -1 || (state.phase === 'WAITING_BREAKOUT' && lastBar.close < state.canalLow)) {
        type = 'VENDA';
        sl = state.referenciaHigh || 0; // Top of ZN
        tp = state.referenciaLow || 0;  // 100% Expansion
      }
    }

    return {
      type,
      price: lastBar.close,
      sl,
      tp,
      candleType,
      symbol: state.symbol,
      phase: state.phase,
      tradesToday: state.tradesToday,
      reversaisToday: state.reversaisToday,
      isSlicingApplied: state.isSlicingApplied
    };
  }
}
