// ============================================================
// CALCULATION ENGINE — Pure utility functions
// ============================================================

// Point value per instrument (dollar value per 1 point move, per 1 contract/lot)
// Futures: per contract. Forex: per standard lot (100,000 units). Crypto: varies.
var POINT_VALUES = {
  // US Equity Futures (CME)
  'NQ':   10,      // Nasdaq-100 E-mini: $20 per point
  'MNQ':   2,      // Micro Nasdaq-100: $2 per point
  'ES':   50,      // S&P 500 E-mini: $50 per point
  'MES':   5,      // Micro S&P 500: $5 per point
  'YM':    5,      // Dow Jones E-mini: $5 per point
  'MYM':   0.50,   // Micro Dow: $0.50 per point
  'RTY':  50,      // Russell 2000 E-mini: $50 per point
  // Commodities
  'CL':  1000,     // Crude Oil: $1000 per point ($10 per tick of 0.01)
  'GC':   100,     // Gold: $100 per point ($10 per tick of 0.10)
  'SI':  5000,     // Silver: $5000 per point
  // Forex (per standard lot, pip value approx)
  'EURUSD': 10,    // $10 per pip per standard lot
  'GBPUSD': 10,
  'USDJPY': 10,
  'GBPJPY': 10,
  'USDCAD': 10,
  'AUDUSD': 10,
  'NZDUSD': 10,
  'USDCHF': 10,
  // Metals spot
  'XAUUSD': 100,   // Gold spot: ~$100 per $1 move per lot
  'XAGUSD': 5000,
  // Crypto (per coin, treat size as number of coins)
  'BTCUSD': 1,
  'ETHUSD': 1,
};

function getPointValue(instrument) {
  if (!instrument) return 1;
  var upper = instrument.toUpperCase();
  return POINT_VALUES[upper] || 1;
}

window.POINT_VALUES = POINT_VALUES;
window.getPointValue = getPointValue;

var Calc = {

  pointRisk(entry, sl, size, instrument) {
    if (!entry || !sl || !size) return 0;
    var dist = Math.abs(entry - sl);
    var pv   = getPointValue(instrument);
    return +(dist * size * pv).toFixed(2);
  },

  riskAmount(balance, riskPct) {
    return balance * (riskPct / 100);
  },

  riskPct(riskAmt, balance) {
    return balance > 0 ? (riskAmt / balance) * 100 : 0;
  },

  rr(entry, sl, tp) {
    if (!entry || !sl || !tp) return 0;
    const risk   = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    return risk > 0 ? +(reward / risk).toFixed(2) : 0;
  },

  pl(entry, exit, size, direction, instrument) {
    if (!exit) return null;
    var diff = direction === 'Long' ? exit - entry : entry - exit;
    var pv   = getPointValue(instrument);
    return +(diff * size * pv).toFixed(2);
  },

  rMultiple(pl, riskAmt) {
    return riskAmt > 0 ? +(pl / riskAmt).toFixed(2) : 0;
  },

  winRate(trades) {
    const closed = trades.filter(t => t.status === 'Closed');
    if (!closed.length) return 0;
    const wins = closed.filter(t => (t.profitLoss ?? 0) > 0).length;
    return +((wins / closed.length) * 100).toFixed(1);
  },

  profitFactor(trades) {
    const closed = trades.filter(t => t.status === 'Closed' && t.profitLoss != null);
    const gross  = closed.filter(t => t.profitLoss > 0).reduce((s, t) => s + t.profitLoss, 0);
    const loss   = Math.abs(closed.filter(t => t.profitLoss < 0).reduce((s, t) => s + t.profitLoss, 0));
    if (loss === 0) return gross > 0 ? Infinity : 0;
    return +(gross / loss).toFixed(2);
  },

  expectancy(trades) {
    const closed = trades.filter(t => t.status === 'Closed' && t.rMultiple != null);
    if (!closed.length) return 0;
    const sum = closed.reduce((s, t) => s + (t.rMultiple ?? 0), 0);
    return +(sum / closed.length).toFixed(2);
  },

  maxDrawdown(equityCurve) {
    if (!equityCurve.length) return { amount: 0, pct: 0 };
    let peak = equityCurve[0], maxDD = 0, maxDDPct = 0;
    for (const val of equityCurve) {
      if (val > peak) peak = val;
      const dd    = peak - val;
      const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct; }
    }
    return { amount: +maxDD.toFixed(2), pct: +maxDDPct.toFixed(2) };
  },

  dailyDrawdown(trades) {
    const today = new Date().toISOString().split('T')[0];
    const todayLosses = trades
      .filter(t => t.date === today && t.status === 'Closed' && (t.profitLoss ?? 0) < 0)
      .reduce((s, t) => s + (t.profitLoss ?? 0), 0);
    return Math.abs(todayLosses);
  },

  streak(trades) {
    const sorted = [...trades.filter(t => t.status === 'Closed')]
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    let best = 0, worst = 0, tmpW = 0, tmpL = 0;
    for (const t of sorted) {
      if ((t.profitLoss ?? 0) > 0) { tmpW++; tmpL = 0; if (tmpW > best) best = tmpW; }
      else                          { tmpL++; tmpW = 0; if (tmpL > worst) worst = tmpL; }
    }
    let current = 0, type = 'none';
    if (sorted.length) {
      const last = sorted[sorted.length - 1];
      if ((last.profitLoss ?? 0) > 0) { current = tmpW; type = 'win'; }
      else                             { current = tmpL; type = 'loss'; }
    }
    return { current, type, best, worst };
  },

  equityCurve(trades, startBalance) {
    const sorted = [...trades.filter(t => t.status === 'Closed')]
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
    let balance = startBalance;
    const curve = [{ date: 'Start', balance, index: 0 }];
    sorted.forEach((t, i) => {
      balance += (t.profitLoss ?? 0);
      curve.push({ date: t.date, balance: +balance.toFixed(2), instrument: t.instrument || '', index: i + 1 });
    });
    return curve;
  },

  dailyPL(trades) {
    const map = {};
    trades.filter(t => t.status === 'Closed').forEach(t => {
      if (!map[t.date]) map[t.date] = { date: t.date, pl: 0, trades: 0, wins: 0 };
      map[t.date].pl += (t.profitLoss ?? 0);
      map[t.date].trades++;
      if ((t.profitLoss ?? 0) > 0) map[t.date].wins++;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, pl: +d.pl.toFixed(2) }));
  },

  metrics(trades) {
    const closed  = trades.filter(t => t.status === 'Closed');
    const wins    = closed.filter(t => (t.profitLoss ?? 0) > 0);
    const losses  = closed.filter(t => (t.profitLoss ?? 0) < 0);
    const totalPL = +closed.reduce((s, t) => s + (t.profitLoss ?? 0), 0).toFixed(2);
    const totalR  = +closed.reduce((s, t) => s + (t.rMultiple ?? 0), 0).toFixed(2);
    return {
      totalTrades:   closed.length,
      winningTrades: wins.length,
      losingTrades:  losses.length,
      winRate:       closed.length ? +((wins.length / closed.length) * 100).toFixed(1) : 0,
      totalPL, totalR,
      averageR:      closed.length ? +(totalR / closed.length).toFixed(2) : 0,
      profitFactor:  Calc.profitFactor(trades),
      expectancy:    Calc.expectancy(trades),
      averageWin:    wins.length   ? +(wins.reduce((s, t) => s + t.profitLoss, 0) / wins.length).toFixed(2) : 0,
      averageLoss:   losses.length ? +(losses.reduce((s, t) => s + t.profitLoss, 0) / losses.length).toFixed(2) : 0,
      largestWin:    wins.length   ? +Math.max(...wins.map(t => t.profitLoss)).toFixed(2) : 0,
      largestLoss:   losses.length ? +Math.min(...losses.map(t => t.profitLoss)).toFixed(2) : 0,
    };
  },

  ruleCompliance(trades) {
    const closed = trades.filter(t => t.status === 'Closed');
    if (!closed.length) return 100;
    return +((closed.filter(t => t.ruleFollowed).length / closed.length) * 100).toFixed(1);
  },

  duration(startDate, startTime, endDate, endTime) {
    if (!endDate) return null;
    const start = new Date(`${startDate}T${startTime || '00:00'}`);
    const end   = new Date(`${endDate}T${endTime || '00:00'}`);
    const ms    = end - start;
    if (ms < 0) return null;
    const mins  = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  },

  fmt: {
    currency(val, currency) {
      if (val == null) return '—';
      currency = currency || 'USD';
      var prefix = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$' }[currency] || '';
      var abs = Math.abs(val);
      var str = abs >= 1000 ? (abs / 1000).toFixed(2) + 'k' : abs.toFixed(2);
      return prefix + str;
    },
    r(val) {
      if (val == null) return '—';
      return Math.abs(val).toFixed(2) + 'R';
    },
    pct(val) {
      if (val == null) return '—';
      return Math.abs(val).toFixed(1) + '%';
    },
    date(str) {
      if (!str) return '—';
      return str;
    },
  },
};

window.Calc = Calc;
