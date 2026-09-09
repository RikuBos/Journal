// ============================================================
// SAMPLE DATA — Realistic demo trading data
// ============================================================
window.SAMPLE_ACCOUNT = {
  id: 'acc-demo-001',
  name: 'Demo — Phase 1 (5K)',
  propFirm: 'FundedNext',
  accountSize: 5000,
  accountType: 'Stellar Lite',
  phase: 'Phase 1',
  startingBalance: 5000,
  currentBalance: 5000,
  currentEquity: 5000,
  profitTarget: 500,
  maxLoss: 250,
  dailyLoss: 100,
  riskPerTrade: 1,
  maxTradesPerDay: 3,
  minTradingDays: 5,
  currentTradingDays: 14,
  maxOpenRisk: 2,
  status: 'Active',
  startDate: '2026-08-01',
  endDate: '',
  notes: '[SAMPLE DATA] Phase 1 challenge on FundedNext 5K Stellar Lite account.',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function makeSampleTrades(accountId) {
  const raw = [
    { date:'2026-08-04', inst:'NQ',     dir:'Short', entry:21050, sl:21075, tp:21000, exit:21000, size:1,     session:'New York Open', setup:'FVG',                  conf:'MSS',          grade:'A+', mistake:null,                pl: 62.50,  rm: 2.5  },
    { date:'2026-08-05', inst:'ES',     dir:'Long',  entry:5420,  sl:5408,  tp:5445,  exit:5445,  size:2,     session:'London',        setup:'Order Block',          conf:'Displacement', grade:'A',  mistake:null,                pl:100.00,  rm: 2.08 },
    { date:'2026-08-06', inst:'EURUSD', dir:'Long',  entry:1.0920,sl:1.0900,tp:1.0955,exit:1.0955,size:10000, session:'London Open',   setup:'Liquidity Sweep',      conf:'CISD',         grade:'A',  mistake:null,                pl:350.00,  rm: 1.75 },
    { date:'2026-08-07', inst:'NQ',     dir:'Short', entry:21100, sl:21116, tp:21052, exit:21052, size:1,     session:'New York',      setup:'SMT',                  conf:'MSS',          grade:'A',  mistake:null,                pl: 60.00,  rm: 3.0  },
    { date:'2026-08-11', inst:'NQ',     dir:'Long',  entry:21250, sl:21225, tp:21320, exit:21218, size:1,     session:'New York',      setup:'CISD',                 conf:'FVG',          grade:'C',  mistake:'Early Entry',        pl:-40.00,  rm:-1.6  },
    { date:'2026-08-12', inst:'ES',     dir:'Long',  entry:5445,  sl:5433,  tp:5475,  exit:5475,  size:2,     session:'London',        setup:'Market Structure Shift',conf:'Displacement', grade:'A+', mistake:null,                pl:150.00,  rm: 2.5  },
    { date:'2026-08-13', inst:'GBPUSD', dir:'Short', entry:1.2710,sl:1.2728,tp:1.2670,exit:1.2728,size:8000, session:'London Open',   setup:'FVG',                  conf:'SMT',          grade:'D',  mistake:'Moving Stop Loss',   pl:-144.00, rm:-1.0  },
    { date:'2026-08-14', inst:'NQ',     dir:'Long',  entry:21080, sl:21062, tp:21130, exit:21130, size:1,     session:'New York Open', setup:'Order Block',          conf:'BOS',          grade:'A',  mistake:null,                pl: 62.50,  rm: 2.78 },
    { date:'2026-08-18', inst:'NQ',     dir:'Short', entry:21340, sl:21358, tp:21295, exit:21295, size:1,     session:'New York',      setup:'Breaker',              conf:'CHoCH',        grade:'A+', mistake:null,                pl: 56.25,  rm: 2.5  },
    { date:'2026-08-19', inst:'EURUSD', dir:'Long',  entry:1.0945,sl:1.0930,tp:1.0975,exit:1.0958,size:8000, session:'London',        setup:'FVG',                  conf:'Displacement', grade:'B',  mistake:'Closing Too Early',   pl:104.00,  rm: 0.87 },
    { date:'2026-08-20', inst:'ES',     dir:'Short', entry:5480,  sl:5492,  tp:5448,  exit:5448,  size:2,     session:'New York Open', setup:'SMT',                  conf:'MSS',          grade:'A',  mistake:null,                pl:128.00,  rm: 2.67 },
    { date:'2026-08-21', inst:'NQ',     dir:'Long',  entry:21290, sl:21272, tp:21344, exit:21310, size:1,     session:'New York',      setup:'OTE',                  conf:'FVG',          grade:'B',  mistake:null,                pl: 25.00,  rm: 1.11 },
  ];

  let balance = 5000;
  return raw.map((r, i) => {
    const riskAmt = Math.abs(r.entry - r.sl) * r.size;
    const riskPct = +(riskAmt / 5000 * 100).toFixed(2);
    balance += r.pl;
    return {
      id:               `trade-demo-${String(i+1).padStart(3,'0')}`,
      accountId,
      date:             r.date,
      time:             '09:45',
      session:          r.session,
      instrument:       r.inst,
      direction:        r.dir,
      status:           'Closed',
      entryPrice:       r.entry,
      stopLoss:         r.sl,
      takeProfit:       r.tp,
      exitPrice:        r.exit,
      positionSize:     r.size,
      riskAmount:       +riskAmt.toFixed(2),
      riskPercentage:   riskPct,
      profitLoss:       r.pl,
      rMultiple:        r.rm,
      tradeDuration:    '1h 30m',
      setup:            r.setup,
      marketCondition:  'Trending Up',
      timeframe:        '15m',
      entryModel:       'ICT Judas Swing',
      confirmation:     r.conf,
      poi:              'FVG',
      liquidity:        r.dir === 'Long' ? 'Sell Side Liquidity' : 'Buy Side Liquidity',
      htfBias:          r.dir === 'Long' ? 'Bullish' : 'Bearish',
      dailyBias:        r.dir === 'Long' ? 'Bullish' : 'Bearish',
      sessionBias:      'Aligned',
      liquidityObjective: r.dir === 'Long' ? 'Previous Day High' : 'Previous Day Low',
      expectedDraw:     r.dir === 'Long' ? 'Premium Array' : 'Discount Array',
      newsRisk:         false,
      killzone:         'New York Open Killzone',
      htfPOI:           'Daily FVG',
      ltfConfirmation:  'MSS on 5m',
      emotionBefore:    'Calm',
      emotionDuring:    'Calm',
      emotionAfter:     r.pl > 0 ? 'Confident' : 'Frustrated',
      mistake:          r.mistake || '',
      mistakeSeverity:  r.mistake ? 'Minor' : '',
      ruleFollowed:     !r.mistake,
      ruleViolated:     r.mistake ? `Violated execution rule: ${r.mistake}` : '',
      executionQuality: r.pl > 0 ? 8 : 4,
      tradeGrade:       r.grade,
      notes:            `[SAMPLE] ${r.setup} trade on ${r.inst}. ${r.pl > 0 ? 'Followed plan, took full TP.' : 'Did not follow entry criteria.'}`,
      whatWentRight:    r.pl > 0 ? 'Waited for confirmation, respected POI, followed the plan' : 'Initial bias was correct',
      whatWentWrong:    r.pl < 0 ? r.mistake || 'Missed entry criteria' : 'Nothing significant',
      lessonsLearned:   'Always wait for full confirmation before entering. Patience is part of the edge.',
      balanceAfter:     +balance.toFixed(2),
      screenshots:      [],
      createdAt:        new Date().toISOString(),
      updatedAt:        new Date().toISOString(),
    };
  });
}

async function initSampleData() {
  // Only seed mistakes and settings on first run - NO sample trades or accounts
  const existingMistakes = await DB.getAll(STORES.mistakes);
  if (existingMistakes.length === 0) {
    for (const m of DEFAULT_MISTAKES) await DB.put(STORES.mistakes, m);
  }
  var sett = await DB.get(STORES.settings, 'settings');
  if (!sett) {
    await DB.put(STORES.settings, { ...DEFAULT_SETTINGS });
  }
}

window.initSampleData = initSampleData;
