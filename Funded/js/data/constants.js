// ============================================================
// CONSTANTS — Trading concepts, options, defaults
// ============================================================
window.SETUPS = [
  'FVG','IFVG','Order Block','Breaker','SMT','CISD',
  'Liquidity Sweep','Turtle Soup','Market Structure Shift',
  'Change of Character','Displacement','OTE','Premium','Discount',
];
window.CONFIRMATIONS = ['MSS','BOS','CHoCH','Displacement','SMT','CISD','FVG','Liquidity Sweep','Other'];
window.POIS = [
  'FVG','IFVG','Order Block','Breaker','Liquidity',
  'Previous High','Previous Low','Session High','Session Low',
  'Daily Open','Weekly Open','Monthly Open','Other',
];
window.SESSIONS    = ['Asian','London','New York','London Open','New York Open','Overlap','Pre-Market','After-Hours'];
window.TIMEFRAMES  = ['1m','3m','5m','15m','30m','1H','4H','Daily','Weekly'];
window.INSTRUMENTS = ['NQ','ES','YM','RTY','CL','GC','EURUSD','GBPUSD','USDJPY','GBPJPY','XAUUSD','BTCUSD','ETHUSD'];
window.EMOTIONS    = ['Calm','Confident','Anxious','Frustrated','Fearful','Greedy','Neutral','Excited','Bored','Revenge'];
window.MARKET_CONDITIONS = ['Trending Up','Trending Down','Ranging','High Volatility','Low Volatility','News Driven'];
window.GRADES      = ['A+','A','B','C','D','F'];
window.SEVERITIES  = ['Minor','Moderate','Major','Critical'];
window.BIASES      = ['Bullish','Bearish','Neutral','Unclear'];
window.PHASES      = ['Phase 1','Phase 2','Funded','Challenge','Evaluation'];
window.CURRENCIES  = ['USD','EUR','GBP','JPY','AUD','CAD','CHF'];

window.DEFAULT_SETTINGS = {
  id: 'settings',
  currency: 'USD',
  timezone: 'America/New_York',
  defaultRisk: 1,
  defaultInstrument: 'NQ',
  customSetups: [],
  customConfirmations: [],
  customPOIs: [],
  customMistakes: [],
  // Discord Webhook
  discordWebhookUrl: '',
  discordEnabled: false,
  discordSendOnTrade: true,
  discordSendOnJournal: true,
  discordSendOnWeeklyReview: true,
  discordSendOnDailyPL: false,
  discordFormat: 'embed',   // 'embed' | 'plain'
  discordUsername: 'Trading Journal',
};

window.DEFAULT_MISTAKES = [
  { id: 'mis-001', name: 'Overtrading',           description: 'Taking too many trades beyond session/daily limit', isDefault: true },
  { id: 'mis-002', name: 'Revenge Trading',        description: 'Entering trades to recover from a loss emotionally', isDefault: true },
  { id: 'mis-003', name: 'FOMO',                   description: 'Entering due to fear of missing out', isDefault: true },
  { id: 'mis-004', name: 'Early Entry',            description: 'Entering before confirmation is present', isDefault: true },
  { id: 'mis-005', name: 'Late Entry',             description: 'Entering after the optimal entry point', isDefault: true },
  { id: 'mis-006', name: 'Moving Stop Loss',       description: 'Widening stop loss to avoid being stopped out', isDefault: true },
  { id: 'mis-007', name: 'Moving Take Profit',     description: 'Exiting before the planned take profit', isDefault: true },
  { id: 'mis-008', name: 'Oversizing',             description: 'Taking too large a position relative to account rules', isDefault: true },
  { id: 'mis-009', name: 'Breaking Daily Loss',    description: 'Continuing to trade after hitting the daily loss limit', isDefault: true },
  { id: 'mis-010', name: 'Breaking Trading Plan',  description: 'Deviating from the predefined trading plan', isDefault: true },
  { id: 'mis-011', name: 'Trading During News',    description: 'Entering during high-impact news events', isDefault: true },
  { id: 'mis-012', name: 'No Confirmation',        description: 'Entering without a valid entry confirmation signal', isDefault: true },
  { id: 'mis-013', name: 'Poor Risk Reward',       description: 'Taking trades with substandard risk:reward ratio', isDefault: true },
  { id: 'mis-014', name: 'Emotional Entry',        description: 'Entering based on emotion rather than analysis', isDefault: true },
  { id: 'mis-015', name: 'Entering Outside Session', description: 'Trading during unplanned or low-liquidity sessions', isDefault: true },
  { id: 'mis-016', name: 'Closing Too Early',      description: 'Exiting before the planned take profit target', isDefault: true },
  { id: 'mis-017', name: 'Holding Too Long',       description: 'Not taking profit at the planned target level', isDefault: true },
  { id: 'mis-018', name: 'No Stop Loss',           description: 'Entering a trade without a predefined stop loss', isDefault: true },
].map(m => ({ ...m, createdAt: new Date().toISOString() }));
