// ============================================================
// TRADEMIND AI — Rich Mock Data Engine
// Drives all frontend components during Phase 1 (no backend)
// ============================================================

// --- Market Symbols ---
export const SYMBOLS = ['NVDA', 'TSMC', 'MSFT', 'AAPL', 'ETH', 'BTC', 'SPY', 'AMZN', 'GOOG', 'META'];

// --- Generate realistic OHLCV candles ---
function generateCandles(symbol, days = 200, basePrice = 400) {
  const candles = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    const ts = now - i * 86400000;
    const vol = (Math.random() - 0.48) * (basePrice * 0.025);
    const open = price;
    const close = price + vol;
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.01);
    const low  = Math.min(open, close) - Math.random() * (basePrice * 0.01);
    const volume = Math.floor(Math.random() * 40000000 + 10000000);
    candles.push({ ts, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export const MARKET_DATA = {
  NVDA: { candles: generateCandles('NVDA', 200, 875), sector: 'Semiconductors' },
  TSMC: { candles: generateCandles('TSMC', 200, 155), sector: 'Semiconductors' },
  MSFT: { candles: generateCandles('MSFT', 200, 415), sector: 'Software' },
  AAPL: { candles: generateCandles('AAPL', 200, 193), sector: 'Consumer Tech' },
  ETH:  { candles: generateCandles('ETH', 200, 3200), sector: 'Crypto' },
  BTC:  { candles: generateCandles('BTC', 200, 67000), sector: 'Crypto' },
  SPY:  { candles: generateCandles('SPY', 200, 520), sector: 'ETF' },
  AMZN: { candles: generateCandles('AMZN', 200, 178), sector: 'E-Commerce' },
  GOOG: { candles: generateCandles('GOOG', 200, 173), sector: 'Advertising' },
  META: { candles: generateCandles('META', 200, 505), sector: 'Social Media' },
};

// --- Live ticks (updates every second) ---
export function generateTick(symbol) {
  const data = MARKET_DATA[symbol];
  const last = data.candles[data.candles.length - 1].close;
  const change = (Math.random() - 0.5) * last * 0.004;
  const price = +(last + change).toFixed(2);
  const changePct = +((change / last) * 100).toFixed(3);
  return { symbol, price, change: +change.toFixed(2), changePct, volume: Math.floor(Math.random() * 2000000) };
}

// --- Correlation Graph (adjacency) for GNN ---
export const CORRELATION_GRAPH = {
  nodes: [
    { id: 'NVDA',  x: 0,    y: 60,   z: 0,    size: 1.4, sector: 'Semiconductors', price: 875,   change: -2.1 },
    { id: 'TSMC',  x: -80,  y: 40,   z: 20,   size: 1.1, sector: 'Semiconductors', price: 155,   change: -1.8 },
    { id: 'MSFT',  x: 70,   y: 50,   z: -30,  size: 1.3, sector: 'Software',       price: 415,   change: -0.9 },
    { id: 'AAPL',  x: 50,   y: 80,   z: 40,   size: 1.3, sector: 'Consumer Tech',  price: 193,   change:  0.2 },
    { id: 'ETH',   x: -40,  y: -20,  z: -60,  size: 0.9, sector: 'Crypto',         price: 3200,  change: -3.4 },
    { id: 'BTC',   x: -90,  y: -40,  z: -20,  size: 1.0, sector: 'Crypto',         price: 67000, change: -2.8 },
    { id: 'AMZN',  x: 90,   y: 20,   z: 50,   size: 1.2, sector: 'E-Commerce',     price: 178,   change:  0.5 },
    { id: 'GOOG',  x: 30,   y: -10,  z: 80,   size: 1.2, sector: 'Advertising',    price: 173,   change:  0.1 },
    { id: 'META',  x: -20,  y: 30,   z: 90,   size: 1.1, sector: 'Social Media',   price: 505,   change:  0.8 },
    { id: 'SPY',   x: 10,   y: -60,  z: 10,   size: 1.5, sector: 'ETF',            price: 520,   change: -0.6 },
  ],
  edges: [
    { source: 'NVDA', target: 'TSMC',  weight: 0.91 },
    { source: 'NVDA', target: 'MSFT',  weight: 0.78 },
    { source: 'NVDA', target: 'ETH',   weight: 0.64 },
    { source: 'TSMC', target: 'AAPL',  weight: 0.82 },
    { source: 'MSFT', target: 'AAPL',  weight: 0.85 },
    { source: 'MSFT', target: 'AMZN',  weight: 0.71 },
    { source: 'AAPL', target: 'SPY',   weight: 0.88 },
    { source: 'ETH',  target: 'BTC',   weight: 0.95 },
    { source: 'ETH',  target: 'NVDA',  weight: 0.58 },
    { source: 'SPY',  target: 'GOOG',  weight: 0.76 },
    { source: 'SPY',  target: 'META',  weight: 0.73 },
    { source: 'AMZN', target: 'GOOG',  weight: 0.68 },
    { source: 'GOOG', target: 'META',  weight: 0.81 },
    { source: 'MSFT', target: 'GOOG',  weight: 0.74 },
    { source: 'BTC',  target: 'SPY',   weight: 0.45 },
  ],
};

// --- Agent Council Votes ---
export function generateAgentVotes(signal = 'BUY') {
  const isBuy = signal === 'BUY';
  return {
    strategist: {
      name: 'RL Strategist',
      icon: '🧠',
      color: 'cyan',
      verdict: isBuy ? 'BUY' : 'SELL',
      confidence: isBuy ? +(0.65 + Math.random() * 0.3).toFixed(2) : +(0.55 + Math.random() * 0.35).toFixed(2),
      reasoning: isBuy
        ? 'RSI at 38.2 — oversold. MACD histogram turning positive. Momentum favors entry.'
        : 'RSI at 71.8 — overbought. Price rejected at resistance. Risk/reward unfavorable.',
      indicators: { RSI: isBuy ? 38.2 : 71.8, MACD: isBuy ? 0.34 : -0.82, BB: isBuy ? 'Lower' : 'Upper' },
    },
    macro: {
      name: 'Macro Agent',
      icon: '📡',
      color: 'purple',
      verdict: isBuy ? 'BULLISH' : 'BEARISH',
      confidence: +(0.6 + Math.random() * 0.3).toFixed(2),
      reasoning: isBuy
        ? 'Fed minutes hint at rate pause. CPI cooling at 2.9%. Risk-on sentiment across tech.'
        : 'Fed hawkish tone persists. Yield curve inversion deepening. Flight to safety emerging.',
      sentiment: { news: isBuy ? 0.72 : -0.61, reddit: isBuy ? 0.58 : -0.44, twitter: isBuy ? 0.64 : -0.52 },
    },
    graph: {
      name: 'GNN Graph Agent',
      icon: '🕸',
      color: 'gold',
      verdict: isBuy ? 'LOW CONTAGION' : 'CONTAGION RISK',
      confidence: +(0.58 + Math.random() * 0.35).toFixed(2),
      reasoning: isBuy
        ? 'Sector correlation graph stable. NVDA drop contained; TSMC/MSFT decoupling. No cascade detected.'
        : 'NVDA-TSMC edge weight spiking to 0.97. Contagion pulse propagating to 7 connected nodes.',
      contagionScore: isBuy ? 0.12 : 0.81,
      affectedNodes: isBuy ? ['NVDA', 'ETH'] : ['NVDA', 'TSMC', 'MSFT', 'AAPL', 'ETH', 'BTC', 'SPY'],
    },
    devil: {
      name: "Devil's Advocate",
      icon: '👿',
      color: 'pink',
      verdict: isBuy ? 'NO VETO' : 'VETO',
      confidence: +(0.55 + Math.random() * 0.4).toFixed(2),
      reasoning: isBuy
        ? 'No liquidity traps detected. Volume confirms move. No upcoming macro events in 48h window.'
        : 'VETO: Detected low-volume fake-out at resistance. Earnings in 3 days. Black Swan risk: EU tech sanctions rumor.',
      risks: isBuy
        ? ['Earnings in 17 days — expiry risk', 'Low after-hours liquidity']
        : ['Earnings in 3 days', 'EU regulatory risk', 'Fake-out at $875 resistance', 'Low volume confirmation'],
    },
  };
}

// --- Trade Proposals ---
export const TRADE_PROPOSALS = [
  {
    id: 'tp-001',
    symbol: 'NVDA',
    action: 'BUY',
    quantity: 50,
    entryPrice: 871.45,
    stopLoss: 845.00,
    takeProfit: 920.00,
    riskReward: '1:1.8',
    strategy: 'Oversold Bounce + Sector Recovery',
    timestamp: new Date(Date.now() - 120000),
    tmrStatus: 'APPROVED',
  },
  {
    id: 'tp-002',
    symbol: 'BTC',
    action: 'SELL',
    quantity: 0.5,
    entryPrice: 66820,
    stopLoss: 68500,
    takeProfit: 63000,
    riskReward: '1:2.2',
    strategy: 'Head & Shoulders Breakdown',
    timestamp: new Date(Date.now() - 300000),
    tmrStatus: 'BLOCKED',
  },
  {
    id: 'tp-003',
    symbol: 'MSFT',
    action: 'BUY',
    quantity: 30,
    entryPrice: 412.30,
    stopLoss: 400.00,
    takeProfit: 435.00,
    riskReward: '1:1.8',
    strategy: 'Bollinger Band Squeeze Breakout',
    timestamp: new Date(Date.now() - 600000),
    tmrStatus: 'DELIBERATING',
  },
];

// --- Paper Portfolio ---
export const PAPER_PORTFOLIO = {
  cashBalance: 84320.45,
  totalValue: 100000,
  openPnL: 4218.73,
  dayPnL: 1140.22,
  dayPnLPct: 1.14,
  allTimePnL: 4218.73,
  allTimePnLPct: 4.22,
  positions: [
    { symbol: 'NVDA', qty: 50,   avgCost: 845.20, current: 871.45, pnl: 1312.5, pnlPct: 3.10 },
    { symbol: 'MSFT', qty: 30,   avgCost: 405.10, current: 412.30, pnl: 216.00, pnlPct: 1.78 },
    { symbol: 'AAPL', qty: 100,  avgCost: 188.50, current: 193.20, pnl: 470.00, pnlPct: 2.49 },
    { symbol: 'ETH',  qty: 2.5,  avgCost: 3050.0, current: 3200,  pnl: 375.00, pnlPct: 4.92 },
  ],
};

// --- Historical Scenarios ---
export const HISTORICAL_SCENARIOS = [
  {
    id: 'covid-crash',
    name: '2020 COVID Crash',
    date: '2020-03-16',
    description: 'Markets fell 34% in 33 days — fastest bear market in history.',
    drawdown: -34,
    recoveryDays: 148,
    pattern: 'V-SHAPED RECOVERY',
    agentAction: 'PIVOT TO DEFENSIVE: Rotated to Gold, T-Bonds. Capital preserved at -4.2% vs -34% market.',
    severity: 'BLACK SWAN',
    color: 'red',
  },
  {
    id: 'gfc-2008',
    name: '2008 Financial Crisis',
    date: '2008-09-15',
    description: 'Lehman Brothers collapse. 57% peak-to-trough decline over 18 months.',
    drawdown: -57,
    recoveryDays: 1200,
    pattern: 'SLOW BLEED',
    agentAction: 'VETO ALL LONGS. Short financials. Hedge via VIX calls. Preserved 78% of capital.',
    severity: 'SYSTEMIC',
    color: 'red',
  },
  {
    id: 'dotcom-bubble',
    name: 'Dot-Com Bubble Burst',
    date: '2000-03-10',
    description: 'NASDAQ fell 78% from peak. Tech valuations collapsed over 2.5 years.',
    drawdown: -78,
    recoveryDays: 4380,
    pattern: 'DEAD CAT BOUNCES',
    agentAction: 'Sold growth exposure. Rotated to value/energy. Devil\'s Advocate detected fake-out rallies.',
    severity: 'SECTOR COLLAPSE',
    color: 'orange',
  },
  {
    id: 'ai-rally-2024',
    name: '2024 AI Bull Run',
    date: '2024-01-10',
    description: 'NVDA +280% in 12 months. AI infrastructure spending surge led by hyperscalers.',
    drawdown: 148,
    recoveryDays: 0,
    pattern: 'PARABOLIC BREAKOUT',
    agentAction: 'GNN detected NVDA-TSMC-MSFT breakout cascade. Strategist sized into momentum. +142% portfolio.',
    severity: 'OPPORTUNITY',
    color: 'green',
  },
  {
    id: 'flash-crash-2010',
    name: '2010 Flash Crash',
    date: '2010-05-06',
    description: 'Dow fell 1000 points in minutes, recovering almost immediately.',
    drawdown: -9.2,
    recoveryDays: 1,
    pattern: 'CIRCUIT BREAKER',
    agentAction: 'Kill-Switch triggered at -3% threshold. Zero execution. Re-entered as stabilization detected.',
    severity: 'TECHNICAL',
    color: 'gold',
  },
];

// --- Thought Log Entries ---
export const THOUGHT_LOG_ENTRIES = [
  { ts: Date.now() - 8000,  agent: 'Strategist', type: 'ANALYSIS', text: 'Scanning NVDA... RSI(14) = 38.2. Below 40 threshold — oversold territory confirmed.' },
  { ts: Date.now() - 6800,  agent: 'Graph Agent', type: 'CONTAGION', text: 'NVDA-TSMC correlation: 0.91. Monitoring cascade potential. Pulse score: LOW (0.12).' },
  { ts: Date.now() - 5600,  agent: 'Macro Agent', type: 'SENTIMENT', text: 'Fed statement parsed: "patient approach to rate adjustments" — dovish signal. Score: +0.72.' },
  { ts: Date.now() - 4200,  agent: 'Strategist', type: 'SIGNAL',    text: 'MACD histogram flipping positive. Bollinger Lower Band bounce. Entry signal CONFIRMED.' },
  { ts: Date.now() - 3100,  agent: "Devil's Adv.", type: 'AUDIT',   text: 'Checking for liquidity traps... None detected. Volume 2.3x average. Earnings: 17 days out. CLEAR.' },
  { ts: Date.now() - 2000,  agent: 'TMR Engine', type: 'CONSENSUS', text: 'VOTE TALLY: Strategist BUY(0.84) + Macro BULL(0.74) + Graph LOW-RISK(0.77) + Devil NO-VETO → APPROVED ✓' },
  { ts: Date.now() - 800,   agent: 'Risk Auditor', type: 'SAFETY',  text: 'Position size validated: 50 shares × $871.45 = $43,572 (43.6% of portfolio). Within 50% limit.' },
  { ts: Date.now(),         agent: 'TradeMind',   type: 'EXECUTE',  text: 'ORDER SUBMITTED: BUY 50 NVDA @ $871.45 | SL: $845 | TP: $920 | R:R = 1:1.8' },
];

// --- TMR Status ---
export const TMR_STATUS = {
  strategist:  { label: 'RL Strategist',   status: 'GREEN', detail: 'Confidence: 84%',    latency: 12 },
  riskAuditor: { label: 'Risk Auditor',     status: 'GREEN', detail: 'Position: VALID',    latency: 8 },
  sentiment:   { label: 'Sentiment Guard',  status: 'GREEN', detail: 'News: CLEAR',        latency: 45 },
};

// --- Kill Switch Config ---
export const KILL_SWITCH_CONFIG = {
  dailyDrawdownLimit:  -5,
  consecutiveLossLimit: 3,
  blackSwanThreshold:   3,
  maxPositionPct:       50,
  currentDailyPnL:      1.14,
  consecutiveLosses:    0,
  status:               'ARMED',
  lastTriggered:        null,
};

// --- Format helpers ---
export function formatCurrency(val) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);
}
export function formatPct(val) {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}
export function formatTs(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}
