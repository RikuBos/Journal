// ============================================================
// PROP FIRM DATA — Account templates, rules, sizes
// ============================================================

// ── FUNDEDNEXT CFD MODELS ──────────────────────────────────
var FUNDEDNEXT_CFD = {
  'Stellar 2-Step': {
    type: 'cfd', phases: 2, drawdownType: 'static',
    rewardShare: 95, minTradingDays: 5, newsAllowed: true,
    consistencyRule: null,
    sizes: {
      6000:   { dailyLoss: 300,  maxLoss: 600,   phase1Target: 480,   phase2Target: 300 },
      15000:  { dailyLoss: 750,  maxLoss: 1500,  phase1Target: 1200,  phase2Target: 750 },
      25000:  { dailyLoss: 1250, maxLoss: 2500,  phase1Target: 2000,  phase2Target: 1250 },
      50000:  { dailyLoss: 2500, maxLoss: 5000,  phase1Target: 4000,  phase2Target: 2500 },
      100000: { dailyLoss: 5000, maxLoss: 10000, phase1Target: 8000,  phase2Target: 5000 },
      200000: { dailyLoss: 10000,maxLoss: 20000, phase1Target: 16000, phase2Target: 10000 },
    },
  },
  'Stellar 1-Step': {
    type: 'cfd', phases: 1, drawdownType: 'static',
    rewardShare: 95, minTradingDays: 2, newsAllowed: true,
    consistencyRule: null,
    sizes: {
      6000:   { dailyLoss: 180,  maxLoss: 360,  profitTarget: 600 },
      15000:  { dailyLoss: 450,  maxLoss: 900,  profitTarget: 1500 },
      25000:  { dailyLoss: 750,  maxLoss: 1500, profitTarget: 2500 },
      50000:  { dailyLoss: 1500, maxLoss: 3000, profitTarget: 5000 },
      100000: { dailyLoss: 3000, maxLoss: 6000, profitTarget: 10000 },
      200000: { dailyLoss: 6000, maxLoss: 12000,profitTarget: 20000 },
    },
  },
  'Stellar Lite': {
    type: 'cfd', phases: 2, drawdownType: 'static',
    rewardShare: 95, minTradingDays: 5, newsAllowed: true,
    consistencyRule: null,
    sizes: {
      5000:   { dailyLoss: 200,  maxLoss: 400,  phase1Target: 400,   phase2Target: 200 },
      10000:  { dailyLoss: 400,  maxLoss: 800,  phase1Target: 800,   phase2Target: 400 },
      25000:  { dailyLoss: 1000, maxLoss: 2000, phase1Target: 2000,  phase2Target: 1000 },
      50000:  { dailyLoss: 2000, maxLoss: 4000, phase1Target: 4000,  phase2Target: 2000 },
      100000: { dailyLoss: 4000, maxLoss: 8000, phase1Target: 8000,  phase2Target: 4000 },
      200000: { dailyLoss: 8000, maxLoss: 16000,phase1Target: 16000, phase2Target: 8000 },
    },
  },
  'Stellar Instant': {
    type: 'cfd', phases: 0, drawdownType: 'trailing',
    rewardShare: 80, minTradingDays: 0, newsAllowed: true,
    consistencyRule: null, instantFunding: true,
    sizes: {
      2000:  { dailyLoss: null, maxLoss: 120,  profitTarget: null },
      5000:  { dailyLoss: null, maxLoss: 300,  profitTarget: null },
      10000: { dailyLoss: null, maxLoss: 600,  profitTarget: null },
      20000: { dailyLoss: null, maxLoss: 1200, profitTarget: null },
    },
  },
};

// ── FUNDEDNEXT FUTURES MODELS ──────────────────────────────
var FUNDEDNEXT_FUTURES = {
  'Futures Legacy': {
    type: 'futures', phases: 1, drawdownType: 'eod_trailing',
    rewardShare: 90, newsAllowed: true, consistencyRule: 40,
    mllLocksAt: 'initial',
    sizes: {
      25000:  { profitTarget: 1250, maxLoss: 1000, dailyLoss: null, startingDD: 24000, contractLimit: '2 Minis / 20 Micros', consistency: 40 },
      50000:  { profitTarget: 3000, maxLoss: 2000, dailyLoss: null, startingDD: 48000, contractLimit: '3 Minis / 30 Micros', consistency: 40 },
      100000: { profitTarget: 6000, maxLoss: 3000, dailyLoss: null, startingDD: 97000, contractLimit: '5 Minis / 50 Micros', consistency: 40 },
    },
  },
  'Futures Flex': {
    type: 'futures', phases: 1, drawdownType: 'eod_trailing',
    rewardShare: 95, newsAllowed: true, consistencyRule: 40,
    sizes: {
      50000:  { profitTarget: 2500, maxLoss: 1500, dailyLoss: null, startingDD: 48500,  mllLock: 50100,  consistency: 40 },
      100000: { profitTarget: 5000, maxLoss: 2500, dailyLoss: null, startingDD: 97500,  mllLock: 100100, consistency: 40 },
      150000: { profitTarget: 8000, maxLoss: 4000, dailyLoss: null, startingDD: 146000, mllLock: 150100, consistency: 40 },
    },
  },
  'Futures Rapid Pro': {
    type: 'futures', phases: 1, drawdownType: 'eod_trailing',
    rewardShare: 90, newsAllowed: true, consistencyRule: 40,
    rewardEvery: '3 days', onDemandPayout: true,
    sizes: {
      25000:  { profitTarget: 1500, maxLoss: 1000, dailyLoss: null, mllLock: 25100,  contractLimit: '2 Minis / 20 Micros' },
      50000:  { profitTarget: 3000, maxLoss: 2000, dailyLoss: null, mllLock: 50100,  contractLimit: '4 Minis / 40 Micros' },
      100000: { profitTarget: 5000, maxLoss: 2500, dailyLoss: null, mllLock: 100100, contractLimit: '6 Minis / 60 Micros' },
    },
  },
  'Futures Rapid Daily': {
    type: 'futures', phases: 1, drawdownType: 'eod_trailing',
    rewardShare: 90, newsAllowed: true, consistencyRule: null,
    bufferRule: true, onDemandPayout: true,
    sizes: {
      25000:  { profitTarget: 1500, maxLoss: 1000, dailyLoss: 500,  mllLock: 25100,  contractLimit: '2 Minis / 20 Micros' },
      50000:  { profitTarget: 3000, maxLoss: 2000, dailyLoss: 1000, mllLock: 50100,  contractLimit: '4 Minis / 40 Micros' },
      100000: { profitTarget: 5000, maxLoss: 2500, dailyLoss: 1250, mllLock: 100100, contractLimit: '6 Minis / 60 Micros' },
    },
  },
};

// ── E8 MARKETS ─────────────────────────────────────────────
var E8_MARKETS = {
  'E8 Track (CFD)': {
    type: 'cfd', phases: 2, drawdownType: 'static',
    rewardShare: 80, newsAllowed: true, consistencyRule: null,
    sizes: {
      25000:  { dailyLoss: 1250, maxLoss: 2000, phase1Target: 2500, phase2Target: 1250 },
      50000:  { dailyLoss: 2500, maxLoss: 4000, phase1Target: 5000, phase2Target: 2500 },
      100000: { dailyLoss: 5000, maxLoss: 8000, phase1Target: 10000,phase2Target: 5000 },
      200000: { dailyLoss:10000, maxLoss:16000, phase1Target:20000, phase2Target:10000 },
    },
  },
  'E8 Evaluation (Futures)': {
    type: 'futures', phases: 2, drawdownType: 'static',
    rewardShare: 80, newsAllowed: true, consistencyRule: null,
    sizes: {
      25000:  { dailyLoss: 1250, maxLoss: 2000, phase1Target: 2500, phase2Target: 1250 },
      50000:  { dailyLoss: 2500, maxLoss: 4000, phase1Target: 5000, phase2Target: 2500 },
      100000: { dailyLoss: 5000, maxLoss: 8000, phase1Target:10000, phase2Target: 5000 },
    },
  },
};

// ── TOPSTEP ─────────────────────────────────────────────────
var TOPSTEP = {
  'TopStep Express (Futures)': {
    type: 'futures', phases: 1, drawdownType: 'trailing',
    rewardShare: 90, newsAllowed: true, consistencyRule: null,
    sizes: {
      50000:  { dailyLoss: 1000, maxLoss: 2000, profitTarget: 3000 },
      100000: { dailyLoss: 2000, maxLoss: 3000, profitTarget: 6000 },
      150000: { dailyLoss: 3000, maxLoss: 4500, profitTarget: 9000 },
    },
  },
  'TopStep Pro (Futures)': {
    type: 'futures', phases: 2, drawdownType: 'trailing',
    rewardShare: 90, newsAllowed: true, consistencyRule: null,
    sizes: {
      50000:  { dailyLoss: 1000, maxLoss: 2000, phase1Target: 3000, phase2Target: 2000 },
      100000: { dailyLoss: 2000, maxLoss: 3000, phase1Target: 6000, phase2Target: 3000 },
      150000: { dailyLoss: 3000, maxLoss: 4500, phase1Target: 9000, phase2Target: 4500 },
    },
  },
};

// ── AGGREGATED LOOKUP ──────────────────────────────────────
var PROP_FIRMS = {
  'FundedNext': {
    cfd:     FUNDEDNEXT_CFD,
    futures: FUNDEDNEXT_FUTURES,
  },
  'E8 Markets': {
    cfd:     E8_MARKETS,
    futures: null,
  },
  'TopStep': {
    cfd:     null,
    futures: TOPSTEP,
  },
};

// Helper: get model data for a given firm/model/size
function getPropFirmModel(firm, modelName, size) {
  var firmData = PROP_FIRMS[firm];
  if (!firmData) return null;
  var allModels = Object.assign({}, firmData.cfd || {}, firmData.futures || {});
  var model = allModels[modelName];
  if (!model) return null;
  var sizeData = model.sizes[size];
  if (!sizeData) return null;
  return Object.assign({}, model, { sizeData: sizeData, size: size });
}

window.PROP_FIRMS         = PROP_FIRMS;
window.FUNDEDNEXT_CFD     = FUNDEDNEXT_CFD;
window.FUNDEDNEXT_FUTURES = FUNDEDNEXT_FUTURES;
window.E8_MARKETS         = E8_MARKETS;
window.TOPSTEP            = TOPSTEP;
window.getPropFirmModel   = getPropFirmModel;
