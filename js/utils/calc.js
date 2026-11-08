var POINT_VALUES = {
  'NQ':   100,
  'MNQ':   1,
  'ES':   50,
  'MES':   5,
  'YM':    5,
  'MYM':   0.50,
  'RTY':  50,
  'CL':  1000,
  'GC':   100,
  'SI':  5000,
  'EURUSD': 10,
  'GBPUSD': 10,
  'USDJPY': 10,
  'GBPJPY': 10,
  'USDCAD': 10,
  'AUDUSD': 10,
  'NZDUSD': 10,
  'USDCHF': 10,
  'XAUUSD': 100,
  'XAGUSD': 5000,
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
    var peak = equityCurve[0], maxDD = 0, maxDDPct = 0;
    for (var i = 0; i < equityCurve.length; i++) {
      var val = equityCurve[i];
      if (val > peak) peak = val;
      var dd    = peak - val;
      var ddPct = peak > 0 ? (dd / peak) * 100 : 0;
      if (dd > maxDD) { maxDD = dd; maxDDPct = ddPct; }
    }
    return { amount: +maxDD.toFixed(2), pct: +maxDDPct.toFixed(2) };
  },

  currentDrawdown(equityCurve, startingBalance) {
    if (!equityCurve || !equityCurve.length) return { amount: 0, pct: 0 };
    var peak = startingBalance || equityCurve[0];
    for (var i = 0; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) peak = equityCurve[i];
    }
    var current = equityCurve[equityCurve.length - 1];
    var dd    = Math.max(0, peak - current);
    var ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    return { amount: +dd.toFixed(2), pct: +ddPct.toFixed(2), peak: +peak.toFixed(2) };
  },

  tradeStamp(t) { return (t.date || '') + 'T' + (t.time || '00:00'); },

  currentMonthKey() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  },

  monthLabel(ym) {
    var p = ym.split('-');
    return new Date(+p[0], +p[1] - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  },

  monthsWithTrades(trades) {
    var seen = {};
    trades.forEach(function(t) { if (t.status === 'Closed' && t.date) seen[t.date.slice(0, 7)] = true; });
    return Object.keys(seen).sort().reverse();
  },

  accountBase(acc) {
    if (!acc) return 0;
    var base = acc.startingBalance || 0;
    if (acc.isBroker && acc.depositHistory && acc.depositHistory.length > 1) {
      base -= acc.depositHistory.slice(1).reduce(function(s, d) { return s + (d.amount || 0); }, 0);
    }
    return base;
  },

  phaseResets(acc, trades) {
    if (!acc || acc.isBroker) return [];
    if (acc.phaseHistory && acc.phaseHistory.length) return acc.phaseHistory.map(function(x) { return x.at; });
    if (!(acc.phasePLBase > 0)) return [];
    var closed = (trades || []).filter(function(t) { return t.status === 'Closed' && t.date; })
      .sort(function(a, b) { return Calc.tradeStamp(a).localeCompare(Calc.tradeStamp(b)); });
    var sum = 0;
    for (var i = 0; i < closed.length; i++) {
      sum += closed[i].profitLoss || 0;
      if (sum >= acc.phasePLBase - 0.005) return [Calc.tradeStamp(closed[i])];
    }
    return [];
  },

  phaseStart(acc, trades) {
    var r = Calc.phaseResets(acc, trades);
    return r.length ? r[r.length - 1] : null;
  },

  accountEvents(acc, trades) {
    var events = [];
    (trades || []).forEach(function(t) {
      if (t.status !== 'Closed' || !t.date) return;
      events.push({ stamp: Calc.tradeStamp(t), order: 0, type: 'trade', delta: t.profitLoss || 0, pl: t.profitLoss || 0 });
    });
    if (acc) {
      (acc.payoutHistory || []).forEach(function(p) {
        var out = acc.isBroker ? (p.amount || 0) : (p.withdrawn !== undefined ? p.withdrawn : 0);
        if (!p.date || !out) return;
        events.push({ stamp: p.date + 'T' + (p.time || '23:59'), order: 1, type: 'out', delta: -out });
      });
      if (acc.isBroker && acc.depositHistory) {
        acc.depositHistory.slice(1).forEach(function(d) {
          if (!d.date) return;
          events.push({ stamp: d.date + 'T' + (d.time || '00:00'), order: 1, type: 'in', delta: d.amount || 0 });
        });
      }
      Calc.phaseResets(acc, trades).forEach(function(at) { events.push({ stamp: at, order: 2, type: 'reset' }); });
    }
    return events.sort(function(a, b) { return a.stamp.localeCompare(b.stamp) || a.order - b.order; });
  },

  monthSeries(trades, acc, ym) {
    var base = Calc.accountBase(acc);
    var bal = base, startBal = base, pl = 0, count = 0, wins = 0;
    var points = [];
    Calc.accountEvents(acc, trades).forEach(function(ev) {
      var month = ev.stamp.slice(0, 7);
      if (month > ym) return;
      if (ev.type === 'reset') bal = base; else bal += ev.delta;
      if (month < ym) { startBal = bal; return; }
      if (!points.length) points.push({ label: 'Start', balance: +startBal.toFixed(2) });
      if (ev.type === 'trade') { pl += ev.pl; count++; if (ev.pl > 0) wins++; }
      points.push({ label: ev.stamp.slice(5, 10), balance: +bal.toFixed(2) });
    });
    if (!points.length) points.push({ label: 'Start', balance: +startBal.toFixed(2) });
    return { points: points, startBal: startBal, endBal: bal, pl: pl, count: count, wins: wins };
  },

  lastDays(trades, n) {
    var byDate = {};
    trades.forEach(function(t) { if (t.status === 'Closed' && t.date) byDate[t.date] = (byDate[t.date] || 0) + (t.profitLoss || 0); });
    var out = [], now = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      out.push({ date: key.slice(5), pl: +(byDate[key] || 0).toFixed(2) });
    }
    return out;
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

  executionQuality(trade) {
    var score = 10;

    if (!trade.ruleFollowed) score -= 2.5;

    if (trade.mistake) {
      var sev = trade.mistakeSeverity;
      if (sev === 'Critical') score -= 3;
      else if (sev === 'Major')    score -= 2;
      else if (sev === 'Moderate') score -= 1.5;
      else                          score -= 1;
    }

    if (trade.status === 'Closed' && trade.entryPrice && trade.stopLoss && trade.takeProfit && trade.exitPrice) {
      var plannedRR = Math.abs(+trade.takeProfit - +trade.entryPrice) /
                     Math.abs(+trade.entryPrice - +trade.stopLoss);
      var actualRR  = trade.rMultiple || 0;
      if (plannedRR > 0) {
        var capture = actualRR / plannedRR;
        if (capture < 0)    score -= 2;
        else if (capture < 0.5) score -= 1.5;
        else if (capture < 1.0) score -= 0.5;
      }
    }

    if (trade.newsRisk) score -= 1;

    if (!trade.setup)        score -= 0.5;
    if (!trade.confirmation) score -= 0.5;

    return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
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
    currency(val, currency, compact) {
      if (val == null) return '—';
      currency = currency || 'USD';
      var prefix = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', CAD: 'C$' }[currency] || '';
      var abs = Math.abs(val);
      var str = (compact && abs >= 1000) ? (abs / 1000).toFixed(2) + 'k' : abs.toFixed(2);
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

function accountBalance(acc, totalPL) {
  if (!acc) return 0;
  return (acc.startingBalance || 0) + ((totalPL || 0) - (acc.phasePLBase || 0)) - (acc.totalWithdrawn || 0);
}
window.accountBalance = accountBalance;
