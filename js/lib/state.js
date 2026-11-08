var createContext = React.createContext;
var useContext = React.useContext;
var useState = React.useState;
var useCallback = React.useCallback;
var useEffect = React.useEffect;

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function AppProvider({ children }) {
  const [accounts,       setAccounts]       = useState([]);
  const [trades,         setTrades]         = useState([]);
  const [journals,       setJournals]       = useState([]);
  const [weeklyReviews,  setWeeklyReviews]  = useState([]);
  const [monthlyReviews, setMonthlyReviews] = useState([]);
  const [playbook,       setPlaybook]       = useState([]);
  const [mistakes,       setMistakes]       = useState([]);
  const [settings,       setSettings]       = useState(DEFAULT_SETTINGS);
  const [activeAccountId, setActiveId]      = useState(null);
  const [loading,        setLoading]        = useState(true);

  const loadAll = useCallback(async () => {
    try {
      await initSampleData();
      const [accs, trs, jrns, wrs, mrs, pb, mis, sett] = await Promise.all([
        DB.getAll(STORES.accounts),
        DB.getAll(STORES.trades),
        DB.getAll(STORES.journals),
        DB.getAll(STORES.weeklyReviews),
        DB.getAll(STORES.monthlyReviews),
        DB.getAll(STORES.playbook),
        DB.getAll(STORES.mistakes),
        DB.get(STORES.settings, 'settings'),
      ]);
      setAccounts(accs || []);
      setTrades(trs || []);
      setJournals(jrns || []);
      setWeeklyReviews(wrs || []);
      setMonthlyReviews(mrs || []);
      setPlaybook(pb || []);
      setMistakes((mis && mis.length) ? mis : DEFAULT_MISTAKES);
      if (sett) setSettings(sett);
      const active = accs.find(a => a.isActive) || accs[0];
      setActiveId(active ? active.id : null);
    } catch (e) { console.error('loadAll:', e); }
    setLoading(false);

    try {
      var allT = await DB.getAll(STORES.trades);
      var allA = await DB.getAll(STORES.accounts);
      var sett = await DB.get(STORES.settings, 'settings') || {};
      if (window.DiscordScheduler) {
        await window.DiscordScheduler.checkScheduledReports(allT, allA, sett);
      }
    } catch(e) { }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0] || null;
  const accountTrades = trades.filter(t => t.accountId === activeAccountId);

  const upsertAccount = async (acc) => {
    const now  = new Date().toISOString();
    const item = { ...acc, id: acc.id || genId(), createdAt: acc.createdAt || now, updatedAt: now };
    await DB.put(STORES.accounts, item);
    setAccounts(p => [...p.filter(a => a.id !== item.id), item]);
    return item;
  };
  const deleteAccount = async (id) => {
    await DB.delete(STORES.accounts, id);
    setAccounts(p => p.filter(a => a.id !== id));
  };
  const switchAccount = (id) => {
    setActiveId(id);
    setAccounts(p => p.map(a => ({ ...a, isActive: a.id === id })));
  };

  const advancePhase = async (item) => {
    if (item.status !== 'Closed') return;
    const acc = accounts.find(a => a.id === item.accountId);
    if (!acc || acc.isBroker || (acc.phase !== 'Phase 1' && acc.phase !== 'Phase 2')) return;
    const target = acc.phase === 'Phase 2' ? (acc.phase2Target || acc.profitTarget) : (acc.phase1Target || acc.profitTarget);
    if (!(target > 0)) return;
    const closedAll = trades.filter(t => t.accountId === acc.id && t.status === 'Closed' && t.id !== item.id).concat(item);
    const total = closedAll.reduce((s, t) => s + (t.profitLoss || 0), 0);
    if (total - (acc.phasePLBase || 0) < target) return;
    const lastStamp = closedAll.map(t => Calc.tradeStamp(t)).sort().pop();
    const model = getPropFirmModel(acc.propFirm, acc.modelName, acc.startingBalance);
    const next  = (acc.phase === 'Phase 1' && model && model.phases >= 2) ? 'Phase 2' : 'Funded';
    const patch = {
      phase: next, phasePLBase: total, phaseChangedAt: lastStamp,
      phaseHistory: (acc.phaseHistory || []).concat({ from: acc.phase, to: next, at: lastStamp }),
    };
    if (next === 'Funded') patch.cycleStartBalance = acc.startingBalance;
    await upsertAccount({ ...acc, ...patch });
    UI.toast(acc.name + ': target reached, moved to ' + next + ', balance back to ' + Calc.fmt.currency(acc.startingBalance), 'success');
  };

  const upsertTrade = async (trade) => {
    const now  = new Date().toISOString();
    const item = { ...trade, id: trade.id || genId(), createdAt: trade.createdAt || now, updatedAt: now };
    if (item.entryPrice && item.stopLoss && item.positionSize) {
      item.riskAmount     = Calc.pointRisk(+item.entryPrice, +item.stopLoss, +item.positionSize, item.instrument);
      const riskAcc = accounts.find(a => a.id === item.accountId) || activeAccount;
      if (riskAcc && riskAcc.startingBalance)
        item.riskPercentage = +(item.riskAmount / riskAcc.startingBalance * 100).toFixed(2);
    }
    if (item.exitPrice && item.entryPrice && item.positionSize) {
      item.profitLoss = Calc.pl(+item.entryPrice, +item.exitPrice, +item.positionSize, item.direction, item.instrument);
      if (item.riskAmount > 0)
        item.rMultiple = +(item.profitLoss / item.riskAmount).toFixed(2);
      item.status = 'Closed';
    }
    item.executionQuality = Calc.executionQuality(item);

    if (item.status === 'Closed') {
      var eq = item.executionQuality || 0;
      var rm = item.rMultiple || 0;
      var score = (eq / 10) * 0.6 + Math.min(Math.max(rm / 3, 0), 1) * 0.4;
      if      (score >= 0.90) item.autoGrade = 'A+';
      else if (score >= 0.78) item.autoGrade = 'A';
      else if (score >= 0.62) item.autoGrade = 'B';
      else if (score >= 0.46) item.autoGrade = 'C';
      else if (score >= 0.30) item.autoGrade = 'D';
      else                    item.autoGrade = 'F';
      if (!item.tradeGradeManual) item.tradeGrade = item.autoGrade;
    }
    await DB.put(STORES.trades, item);
    setTrades(p => [...p.filter(t => t.id !== item.id), item]);
    await advancePhase(item);
    if (item.status === 'Closed' && typeof DiscordWebhook !== 'undefined') {
      var sett = await DB.get(STORES.settings, 'settings') || DEFAULT_SETTINGS;
      if (sett.discordEnabled && sett.discordSendOnTrade) {
        var acc = accounts.find(function(a) { return a.id === item.accountId; });
        DiscordWebhook.sendTrade(item, acc || null, sett).catch(function(e){ console.warn('Discord send failed:', e); });
      }
    }
    return item;
  };
  const deleteTrade = async (id) => {
    await DB.delete(STORES.trades, id);
    setTrades(p => p.filter(t => t.id !== id));
  };

  const upsertJournal = async (j) => {
    const now  = new Date().toISOString();
    const item = { ...j, id: j.id || genId(), createdAt: j.createdAt || now, updatedAt: now };
    await DB.put(STORES.journals, item);
    setJournals(p => [...p.filter(x => x.id !== item.id), item]);
    if (typeof DiscordWebhook !== 'undefined') {
      var sett = await DB.get(STORES.settings, 'settings') || DEFAULT_SETTINGS;
      if (sett.discordEnabled && sett.discordSendOnJournal) {
        var allTrades = await DB.getAll(STORES.trades);
        var dayTrades = allTrades.filter(function(t) { return t.date === item.date && t.accountId === item.accountId && t.status === 'Closed'; });
        DiscordWebhook.sendJournal(item, dayTrades, sett).catch(function(){});
      }
    }
    return item;
  };

  const upsertPlaybook = async (setup) => {
    const now  = new Date().toISOString();
    const item = { ...setup, id: setup.id || genId(), createdAt: setup.createdAt || now, updatedAt: now };
    await DB.put(STORES.playbook, item);
    setPlaybook(p => [...p.filter(x => x.id !== item.id), item]);
    return item;
  };
  const deletePlaybook = async (id) => {
    await DB.delete(STORES.playbook, id);
    setPlaybook(p => p.filter(x => x.id !== id));
  };

  const upsertMistake = async (m) => {
    const now  = new Date().toISOString();
    const item = { ...m, id: m.id || genId(), createdAt: m.createdAt || now };
    await DB.put(STORES.mistakes, item);
    setMistakes(p => [...p.filter(x => x.id !== item.id), item]);
    return item;
  };

  const saveSettings = async (s) => {
    var existing = await DB.get(STORES.settings, 'settings') || {};
    var merged = Object.assign({}, DEFAULT_SETTINGS, existing, s, { id: 'settings' });
    if (merged.discordWebhookUrl && merged.discordWebhookUrl.indexOf('discord.com/api/webhooks') >= 0) {
      if (merged.discordEnabled === undefined) merged.discordEnabled = true;
    }
    await DB.put(STORES.settings, merged);
    setSettings(merged);
  };

  const saveWeeklyReview = async (review) => {
    const now  = new Date().toISOString();
    const item = { ...review, id: review.id || genId(), createdAt: review.createdAt || now, updatedAt: now };
    await DB.put(STORES.weeklyReviews, item);
    setWeeklyReviews(p => [...p.filter(x => x.id !== item.id), item]);
    if (typeof DiscordWebhook !== 'undefined') {
      var sett = await DB.get(STORES.settings, 'settings') || DEFAULT_SETTINGS;
      if (sett.discordEnabled && sett.discordSendOnWeeklyReview) {
        DiscordWebhook.sendWeeklyReview(item, sett).catch(function(){});
      }
    }
    return item;
  };
  const saveMonthlyReview = async (review) => {
    const now  = new Date().toISOString();
    const item = { ...review, id: review.id || genId(), createdAt: review.createdAt || now, updatedAt: now };
    await DB.put(STORES.monthlyReviews, item);
    setMonthlyReviews(p => [...p.filter(x => x.id !== item.id), item]);
    return item;
  };

  const exportData = () => {
    const data = { accounts, trades, journals, weeklyReviews, monthlyReviews, playbook, mistakes, settings, exportDate: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `ftj-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const importData = async (jsonStr) => {
    const d = JSON.parse(jsonStr);
    if (d.accounts) { await DB.clear(STORES.accounts); for (const i of d.accounts) await DB.put(STORES.accounts, i); setAccounts(d.accounts); }
    if (d.trades)   { await DB.clear(STORES.trades);   for (const i of d.trades)   await DB.put(STORES.trades, i);   setTrades(d.trades); }
    if (d.journals) { await DB.clear(STORES.journals); for (const i of d.journals) await DB.put(STORES.journals, i); setJournals(d.journals); }
    if (d.playbook) { await DB.clear(STORES.playbook); for (const i of d.playbook) await DB.put(STORES.playbook, i); setPlaybook(d.playbook); }
    if (d.mistakes) { await DB.clear(STORES.mistakes); for (const i of d.mistakes) await DB.put(STORES.mistakes, i); setMistakes(d.mistakes); }
    if (d.weeklyReviews)  { await DB.clear(STORES.weeklyReviews);  for (const i of d.weeklyReviews)  await DB.put(STORES.weeklyReviews, i);  setWeeklyReviews(d.weeklyReviews); }
    if (d.monthlyReviews) { await DB.clear(STORES.monthlyReviews); for (const i of d.monthlyReviews) await DB.put(STORES.monthlyReviews, i); setMonthlyReviews(d.monthlyReviews); }
    if (d.settings) { await DB.put(STORES.settings, { ...d.settings, id: 'settings' }); setSettings(d.settings); }
  };
  const resetData = async () => {
    await Promise.all(Object.values(STORES).map(s => DB.clear(s)));
    await loadAll();
  };

  const value = {
    accounts, trades, journals, weeklyReviews, monthlyReviews, playbook, mistakes, settings,
    activeAccount, activeAccountId, accountTrades, loading,
    upsertAccount, deleteAccount, upsertAccount, switchAccount,
    upsertTrade,   deleteTrade,
    upsertJournal,
    upsertPlaybook, deletePlaybook,
    upsertMistake,
    saveSettings,
    saveWeeklyReview, saveMonthlyReview,
    setWeeklyReviews, setMonthlyReviews,
    exportData, importData, resetData, reload: loadAll,
  };

  return React.createElement(AppCtx.Provider, { value }, children);
}

window.useApp      = useApp;
window.AppProvider = AppProvider;
