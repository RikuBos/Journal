// ============================================================
// ACCOUNTS PAGE
// ============================================================

function AccountForm({ account, onSave, onClose }) {
  const [f, setF] = React.useState(account || {
    name:'', propFirm:'', accountSize:5000, accountType:'', phase:'Phase 1',
    startingBalance:5000, currentBalance:5000, currentEquity:5000,
    profitTarget:500, maxLoss:250, dailyLoss:100, riskPerTrade:1,
    maxTradesPerDay:3, minTradingDays:5, currentTradingDays:0, maxOpenRisk:2,
    status:'Active', startDate: new Date().toISOString().split('T')[0], endDate:'', notes:'', isActive:false,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const fi  = (label, key, type='text', step) =>
    h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, label),
      h('input', { className: 'input-field', type, step, value: f[key], onChange: e => set(key, type === 'number' ? +e.target.value : e.target.value) })
    );
  return h('div', null,
    h('div', { className: 'form-row' },
      fi('Account Name *',  'name'),
      fi('Prop Firm',       'propFirm'),
      fi('Account Type',    'accountType'),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Phase'),
        h('select', { className: 'select-field', value: f.phase, onChange: e => set('phase', e.target.value) }, PHASES.map(p => h('option', { key: p, value: p }, p)))
      ),
      fi('Account Size',    'accountSize',  'number'),
      fi('Starting Balance','startingBalance','number'),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Status'),
        h('select', { className: 'select-field', value: f.status, onChange: e => set('status', e.target.value) },
          ['Active','Passed','Failed','Archived'].map(s => h('option', { key: s, value: s }, s))
        )
      ),
      fi('Start Date', 'startDate', 'date'),
    ),
    h('hr', { className: 'section-divider' }),
    h('div', { className: 'section-heading' }, 'Account Rules'),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0 16px' } },
      fi('Profit Target ($)',   'profitTarget',   'number'),
      fi('Max Drawdown ($)',    'maxLoss',         'number'),
      fi('Daily Loss Limit ($)','dailyLoss',       'number'),
      fi('Risk Per Trade (%)',  'riskPerTrade',    'number', 0.1),
      fi('Max Trades/Day',     'maxTradesPerDay', 'number'),
      fi('Min Trading Days',   'minTradingDays',  'number'),
      fi('Max Open Risk (%)',   'maxOpenRisk',     'number', 0.1),
    ),
    h('div', { className: 'input-group', style: { marginTop: 4 } },
      h('label', { className: 'input-label' }, 'Notes'),
      h('textarea', { className: 'textarea-field', value: f.notes, onChange: e => set('notes', e.target.value), placeholder: 'Additional notes about this account or challenge rules' })
    ),
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 } },
      h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
      h('button', { className: 'btn btn-primary', onClick: () => { if (!f.name.trim()) return UI.toast('Account name required', 'warning'); onSave(f); onClose(); } },
        h(UI.Icon, { name: 'save', size: 13 }), account ? 'Update Account' : 'Create Account'
      )
    )
  );
}

function AccountsPage() {
  const { accounts, trades, upsertAccount, deleteAccount, switchAccount, activeAccountId } = useApp();
  const [showForm,   setShowForm]   = React.useState(false);
  const [editAcc,    setEditAcc]    = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);

  const getStats = (acc) => {
    const accTrades = trades.filter(t => t.accountId === acc.id && t.status === 'Closed');
    const totalPL   = accTrades.reduce((s, t) => s + (t.profitLoss || 0), 0);
    const wins      = accTrades.filter(t => (t.profitLoss||0) > 0).length;
    const targPct   = acc.profitTarget > 0 ? (Math.max(0, totalPL) / acc.profitTarget) * 100 : 0;
    const ddAmt     = Math.abs(Math.min(0, totalPL));
    const ddPct     = acc.maxLoss > 0 ? (ddAmt / acc.maxLoss) * 100 : 0;
    return { totalPL, balance: acc.startingBalance + totalPL, targPct, ddPct, ddAmt, count: accTrades.length, winRate: accTrades.length ? wins/accTrades.length*100 : 0 };
  };

  const handleSave = async (acc) => { await upsertAccount(acc); UI.toast(acc.id ? 'Account updated' : 'Account created', 'success'); };
  const handleDel  = async (id)  => { await deleteAccount(id); UI.toast('Account deleted', 'success'); };

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null, h('div', { className: 'page-title' }, 'Accounts'), h('div', { className: 'page-subtitle' }, `${accounts.length} account${accounts.length !== 1 ? 's' : ''}`)),
      h('button', { className: 'btn btn-primary', onClick: () => { setEditAcc(null); setShowForm(true); } }, 'New Account')
    ),
    h('div', { className: 'page-body' },
      accounts.length === 0
        ? h(UI.EmptyState, { icon: 'accounts', title: 'No accounts yet', desc: 'Create your first funded account to start tracking.', action: h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, 'Create Account') })
        : h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 16 } },
            accounts.map(acc => {
              const s       = getStats(acc);
              const isActive = acc.id === activeAccountId;
              return h('div', { key: acc.id,
              className: 'account-card' + (isActive ? ' is-active' : ''),
              onDoubleClick: e => {
                UI.showContextMenu(e, [
                  { label: 'Edit Account',   icon: 'edit',    action: () => { setEditAcc(acc); setShowForm(true); } },
                  { label: 'Set as Active',  icon: 'target',  action: () => { switchAccount(acc.id); UI.toast('Account switched', 'success'); } },
                  { label: 'Delete Account', icon: 'trash',   danger: true, action: () => setConfirmDel(acc.id) },
                ]);
              },
            },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 } },
                  h('div', null,
                    h('div', { className: 'account-firm' }, acc.propFirm),
                    h('div', { className: 'account-name' }, acc.name),
                    h('div', { style: { display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' } },
                      h('span', { className: 'badge badge-gray' }, acc.phase),
                      h('span', { className: `badge ${acc.status==='Active'?'badge-green':acc.status==='Passed'?'badge-blue':'badge-red'}` }, acc.status),
                      isActive && h('span', { className: 'badge badge-blue' }, 'Active')
                    )
                  ),
                  h('div', { style: { textAlign: 'right' } },
                    h('div', { style: { fontSize: 18, fontWeight: 700, color: s.totalPL >= 0 ? 'var(--green)' : 'var(--red)', fontFamily: 'var(--mono)' } }, Calc.fmt.currency(s.balance)),
                    h('div', { style: { fontSize: 10, color: 'var(--t3)', marginTop: 2 } }, `Started: ${Calc.fmt.currency(acc.startingBalance)}`)
                  )
                ),
                // Progress bars
                h('div', { style: { marginBottom: 12 } },
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--t3)', marginBottom: 4 } },
                    h('span', null, 'Profit Target'),
                    h('span', null, `${s.targPct.toFixed(0)}% · ${Calc.fmt.currency(s.totalPL)} / ${Calc.fmt.currency(acc.profitTarget)}`)
                  ),
                  h('div', { className: 'progress-track' }, h('div', { className: `progress-fill ${s.targPct >= 100 ? 'green' : 'blue'}`, style: { width: `${Math.min(100, s.targPct)}%` } })),
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--t3)', marginTop: 8, marginBottom: 4 } },
                    h('span', null, 'Drawdown Used'),
                    h('span', { style: { color: s.ddPct > 70 ? 'var(--red)' : 'inherit' } }, `${s.ddPct.toFixed(0)}% · ${Calc.fmt.currency(s.ddAmt)} / ${Calc.fmt.currency(acc.maxLoss)}`)
                  ),
                  h('div', { className: 'progress-track' }, h('div', { className: `progress-fill ${s.ddPct > 70 ? 'red' : s.ddPct > 40 ? 'amber' : 'green'}`, style: { width: `${Math.min(100, s.ddPct)}%` } }))
                ),
                h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 } },
                  [
                    { label: 'P/L',     val: Calc.fmt.currency(s.totalPL), cls: s.totalPL >= 0 ? 'text-pos' : 'text-neg' },
                    { label: 'Trades',  val: s.count },
                    { label: 'Win Rate',val: Calc.fmt.pct(s.winRate) },
                  ].map((x, i) => h('div', { key: i, style: { background: 'rgba(8,9,13,0.55)', border: '1px solid var(--border-1)', borderRadius: 6, padding: '7px 10px', textAlign: 'center' } },
                    h('div', { style: { fontSize: 9.5, color: 'var(--t3)', marginBottom: 3 } }, x.label),
                    h('div', { style: { fontSize: 13, fontWeight: 600, fontFamily: 'var(--mono)' }, className: x.cls || '' }, x.val)
                  ))
                ),
                h('div', { style: { display: 'flex', gap: 6 } },
                  !isActive && h('button', { className: 'btn btn-primary btn-sm', style: { flex: 1 }, onClick: () => { switchAccount(acc.id); UI.toast('Active account switched', 'success'); } }, 'Set Active'),
                  
                )
              );
            })
          )
    ),
    h(UI.Modal, { open: showForm, onClose: () => { setShowForm(false); setEditAcc(null); }, title: editAcc ? 'Edit Account' : 'New Account', size: 'lg' },
      h(AccountForm, { account: editAcc, onSave: handleSave, onClose: () => { setShowForm(false); setEditAcc(null); } })
    ),
    h(UI.ConfirmModal, { open: !!confirmDel, onClose: () => setConfirmDel(null), onConfirm: () => handleDel(confirmDel), title: 'Delete Account', message: 'Delete this account? Trades will remain but the account record will be removed.' })
  );
}

// ============================================================
// CALENDAR PAGE
// ============================================================
function CalendarPage() {
  const { accountTrades } = useApp();
  const [cur, setCur] = React.useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selDay, setSelDay] = React.useState(null);
  const { year, month } = cur;
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today       = new Date().toISOString().split('T')[0];
  const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const dailyMap = React.useMemo(() => {
    const map = {};
    accountTrades.filter(t => t.status === 'Closed').forEach(t => {
      if (!map[t.date]) map[t.date] = { pl: 0, trades: 0, wins: 0 };
      map[t.date].pl     += (t.profitLoss || 0);
      map[t.date].trades += 1;
      if ((t.profitLoss||0) > 0) map[t.date].wins++;
    });
    return map;
  }, [accountTrades]);

  const maxAbs = Math.max(...Object.values(dailyMap).map(d => Math.abs(d.pl)), 1);
  const selTrades = selDay ? accountTrades.filter(t => t.date === selDay && t.status === 'Closed') : [];

  const dayClass = (d) => {
    if (!d) return 'cal-empty';
    const s = dailyMap[d]; if (!s) return 'cal-neutral';
    const intensity = Math.abs(s.pl) / maxAbs;
    if (s.pl > 0) return intensity > 0.55 ? 'cal-pos-str' : 'cal-pos';
    return intensity > 0.55 ? 'cal-neg-str' : 'cal-neg';
  };

  const monthTrades = accountTrades.filter(t => { const [y,m] = (t.date||'').split('-'); return +y === year && +m === month+1 && t.status === 'Closed'; });
  const monthPL     = monthTrades.reduce((s,t) => s + (t.profitLoss||0), 0);
  const monthWR     = monthTrades.length ? monthTrades.filter(t => (t.profitLoss||0) > 0).length / monthTrades.length * 100 : 0;
  const tradingDays = [...new Set(monthTrades.map(t => t.date))].length;

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null, h('div', { className: 'page-title' }, 'Calendar'), h('div', { className: 'page-subtitle' }, 'Daily performance heatmap')),
      h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setCur(p => { const d = new Date(p.year, p.month-1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }) }, h(UI.Icon, { name: 'chevronL', size: 13 })),
        h('span', { style: { fontSize: 13, fontWeight: 550, color: 'var(--t1)', minWidth: 130, textAlign: 'center' } }, `${MONTHS[month]} ${year}`),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setCur(p => { const d = new Date(p.year, p.month+1, 1); return { year: d.getFullYear(), month: d.getMonth() }; }) }, h(UI.Icon, { name: 'chevronR', size: 13 })),
        h('button', { className: 'btn btn-secondary btn-sm', onClick: () => { const d = new Date(); setCur({ year: d.getFullYear(), month: d.getMonth() }); } }, 'Today')
      )
    ),
    h('div', { className: 'page-body' },
      h('div', { className: 'grid-2', style: { gap: 20 } },
        h('div', null,
          // Day headers
          h('div', { className: 'cal-grid', style: { marginBottom: 5 } },
            ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => h('div', { key: d, className: 'cal-day-header' }, d))
          ),
          // Days
          h('div', { className: 'cal-grid' },
            Array.from({ length: firstDay }).map((_, i) => h('div', { key: `e${i}`, className: 'cal-day cal-empty' })),
            Array.from({ length: daysInMonth }).map((_, i) => {
              const day  = i + 1;
              const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const s    = dailyMap[dStr];
              const isT  = dStr === today;
              return h('div', {
                key: day, className: `cal-day ${dayClass(dStr)} ${isT ? 'today' : ''} ${selDay === dStr ? 'selected' : ''}`,
                onClick: () => s && setSelDay(selDay === dStr ? null : dStr), title: s ? `${Calc.fmt.currency(s.pl)} · ${s.trades} trades` : '',
              },
                h('div', { className: 'cal-day-num' }, day),
                s && h('div', { className: 'cal-day-pl', style: { color: s.pl >= 0 ? 'var(--green)' : 'var(--red)' } }, Calc.fmt.currency(s.pl)),
                s && h('div', { className: 'cal-day-count' }, `${s.trades}T`)
              );
            })
          ),
          // Monthly summary
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginTop: 16 } },
            [
              { label: 'Month P/L',    val: Calc.fmt.currency(monthPL), cls: monthPL >= 0 ? 'text-pos' : 'text-neg' },
              { label: 'Total Trades', val: monthTrades.length },
              { label: 'Win Rate',     val: Calc.fmt.pct(monthWR) },
              { label: 'Trading Days', val: tradingDays },
            ].map((x, i) => h('div', { key: i, style: { background: 'rgba(8,9,13,0.5)', border: '1px solid var(--border-1)', borderRadius: 8, padding: '9px 12px', textAlign: 'center' } },
              h('div', { style: { fontSize: 10, color: 'var(--t3)', marginBottom: 3 } }, x.label),
              h('div', { style: { fontSize: 14, fontWeight: 650, fontFamily: 'var(--mono)' }, className: x.cls || '' }, x.val)
            ))
          )
        ),
        // Selected day trades
        selDay
          ? h('div', null,
              h('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 } }, `Trades on ${selDay}`),
              selTrades.length === 0
                ? h('div', { style: { color: 'var(--t3)', fontSize: 12.5 } }, 'No closed trades on this day')
                : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
                    selTrades.map(t => h('div', { key: t.id, style: { background: 'rgba(8,9,13,0.5)', border: '1px solid var(--border-1)', borderRadius: 8, padding: 12 } },
                      h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 } },
                        h('div', null,
                          h('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--t1)' } }, `${t.instrument} ${t.direction}`),
                          h('div', { style: { fontSize: 11, color: 'var(--t3)', marginTop: 2 } }, `${t.time||''} · ${t.session}`)
                        ),
                        h('div', { style: { textAlign: 'right' } },
                          h(UI.PLText, { value: t.profitLoss }),
                          h('div', { style: { marginTop: 3 } }, h(UI.RText, { value: t.rMultiple }))
                        )
                      ),
                      h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } },
                        t.setup && h('span', { className: 'badge badge-blue' }, t.setup),
                        h(UI.GradeBadge, { grade: t.tradeGrade }),
                        t.mistake && h('span', { className: 'badge badge-red' }, t.mistake)
                      )
                    ))
                  )
            )
          : h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, color: 'var(--t3)', gap: 10 } },
              h(UI.Icon, { name: 'calendar', size: 36, color: 'var(--t4)' }),
              h('div', { style: { fontSize: 12 } }, 'Click a colored day to see its trades')
            )
      )
    )
  );
}

// ============================================================
// ANALYTICS PAGE
// ============================================================
function AnalyticsPage() {
  const { accountTrades } = useApp();
  const [filterSession, setFS] = React.useState('');
  const [filterSetup,   setFSt] = React.useState('');
  const [filterDir,     setFD] = React.useState('');
  const [tab,           setTab] = React.useState('overview');

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } = window.Recharts;

  const filtered = React.useMemo(() => {
    let list = accountTrades.filter(t => t.status === 'Closed');
    if (filterSession) list = list.filter(t => t.session === filterSession);
    if (filterSetup)   list = list.filter(t => t.setup === filterSetup);
    if (filterDir)     list = list.filter(t => t.direction === filterDir);
    return list;
  }, [accountTrades, filterSession, filterSetup, filterDir]);

  const metrics = React.useMemo(() => Calc.metrics(filtered), [filtered]);

  const groupBy = (key, labelKey, all) => {
    const map = {};
    (all || filtered).forEach(t => {
      const k = t[key] || 'Unknown';
      if (!map[k]) map[k] = { label: k, trades: 0, wins: 0, pl: 0, r: 0 };
      map[k].trades++;
      if ((t.profitLoss||0) > 0) map[k].wins++;
      map[k].pl += (t.profitLoss || 0);
      map[k].r  += (t.rMultiple  || 0);
    });
    return Object.values(map).map(g => ({ ...g, winRate: g.trades ? g.wins/g.trades*100 : 0, avgR: g.trades ? g.r/g.trades : 0, pl: +g.pl.toFixed(2) })).sort((a,b) => b.pl - a.pl);
  };

  const bySession   = groupBy('session');
  const bySetup     = groupBy('setup');
  const byGrade     = GRADES.map(g => { const group = groupBy('tradeGrade').find(x => x.label === g) || { label: g, trades: 0, pl: 0, avgR: 0 }; return { ...group, label: g }; });
  const byDir       = groupBy('direction');

  const compFollow  = filtered.filter(t => t.ruleFollowed);
  const compBroken  = filtered.filter(t => !t.ruleFollowed);
  const mF = Calc.metrics(compFollow);
  const mB = Calc.metrics(compBroken);

  const BarCard = ({ title, data, count }) =>
    h('div', { className: 'glass-card' },
      h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, title), h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, `${count ?? data.length} groups`)),
      h('div', { style: { padding: '8px 4px 4px' } },
        data.length === 0
          ? h('div', { style: { height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12 } }, 'No data')
          : h(ResponsiveContainer, { width: '100%', height: 180 },
              h(BarChart, { data, margin: { left: 0, right: 10, top: 4, bottom: 20 } },
                h(CartesianGrid, { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }),
                h(XAxis, { dataKey: 'label', tick: { fontSize: 9.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false, angle: -25, textAnchor: 'end' }),
                h(YAxis, { tick: { fontSize: 9.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false, tickFormatter: v => `$${v}`, width: 56 }),
                h(Tooltip, { content: UI.ChartTooltip }),
                h(Bar, { dataKey: 'pl', radius: [3,3,0,0], maxBarSize: 44, name: 'P/L' },
                  data.map((d, i) => h(Cell, { key: i, fill: d.pl >= 0 ? 'rgba(45,206,137,0.62)' : 'rgba(245,54,92,0.62)' }))
                )
              )
            )
      )
    );

  const StatsTable = ({ data, cols }) =>
    h('div', { className: 'table-wrap', style: { marginTop: 14 } },
      h('table', { className: 'data-table' },
        h('thead', null, h('tr', null, cols.map(c => h('th', { key: c.key }, c.label)))),
        h('tbody', null, data.map((row, i) => h('tr', { key: i },
          cols.map(c => h('td', { key: c.key, className: c.cls ? '' : undefined }, c.render ? c.render(row) : (row[c.key] ?? ' ')))
        )))
      )
    );

  const uniqueSetups = [...new Set(accountTrades.map(t => t.setup).filter(Boolean))];

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null, h('div', { className: 'page-title' }, 'Analytics'), h('div', { className: 'page-subtitle' }, `${filtered.length} trades analyzed`)),
      h('div', { style: { display: 'flex', gap: 8, flexWrap: 'wrap' } },
        h('select', { className: 'select-field filter-select', style: { width: 130 }, value: filterSession, onChange: e => setFS(e.target.value) }, h('option', { value: '' }, 'All Sessions'), SESSIONS.map(s => h('option', { key: s, value: s }, s))),
        h('select', { className: 'select-field filter-select', style: { width: 120 }, value: filterSetup,   onChange: e => setFSt(e.target.value) }, h('option', { value: '' }, 'All Setups'),   uniqueSetups.map(s => h('option', { key: s, value: s }, s))),
        h('select', { className: 'select-field filter-select', style: { width: 100 }, value: filterDir,     onChange: e => setFD(e.target.value) }, h('option', { value: '' }, 'Direction'), ['Long','Short'].map(d => h('option', { key: d, value: d }, d))),
        (filterSession||filterSetup||filterDir) && h('button', { className: 'btn btn-ghost btn-sm', onClick: () => { setFS(''); setFSt(''); setFD(''); } }, 'Clear')
      )
    ),
    h('div', { className: 'page-tabs' },
      [
        { id: 'overview',   label: 'Overview' },
        { id: 'session',    label: 'By Session' },
        { id: 'setup',      label: 'By Setup' },
        { id: 'dayofweek',  label: 'Day of Week' },
        { id: 'compliance', label: 'Rule Compliance' },
      ].map(t => h('div', { key: t.id, className: `page-tab ${tab === t.id ? 'active' : ''}`, onClick: () => setTab(t.id) }, t.label))
    ),
    h('div', { className: 'page-body' },

      tab === 'overview' && h('div', null,
        h('div', { className: 'grid-4 mb-16' },
          h(UI.StatBlock, { label: 'Win Rate',      value: Calc.fmt.pct(metrics.winRate),      cls: metrics.winRate >= 50 ? 'positive' : 'negative' }),
          h(UI.StatBlock, { label: 'Profit Factor', value: isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : 'Perfect', cls: metrics.profitFactor >= 1.5 ? 'positive' : metrics.profitFactor >= 1 ? '' : 'negative' }),
          h(UI.StatBlock, { label: 'Expectancy',    value: Calc.fmt.r(metrics.expectancy),     cls: metrics.expectancy >= 0 ? 'positive' : 'negative' }),
          h(UI.StatBlock, { label: 'Total R',       value: Calc.fmt.r(metrics.totalR),         cls: metrics.totalR >= 0 ? 'positive' : 'negative' }),
        ),
        h('div', { className: 'grid-2 mb-16' },
          h(BarCard, { title: 'P/L by Grade', data: byGrade }),
          h('div', { className: 'glass-card' },
            h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Direction Breakdown')),
            h('div', { className: 'card-body', style: { padding: '6px 14px' } },
              byDir.map((d, i) => h('div', { key: i, className: 'metric-row' },
                h('div', null, h(UI.DirBadge, { dir: d.label }), h('span', { style: { fontSize: 11, color: 'var(--t3)', marginLeft: 8 } }, `${d.trades} trades`)),
                h('div', { style: { textAlign: 'right' } },
                  h(UI.PLText, { value: d.pl, size: 'sm' }),
                  h('div', { style: { fontSize: 10, color: 'var(--t3)', marginTop: 2 } }, `WR: ${Calc.fmt.pct(d.winRate)}`)
                )
              ))
            )
          )
        )
      ),

      tab === 'session' && h('div', null,
        h(BarCard, { title: 'P/L by Session', data: bySession, count: bySession.length }),
        h(StatsTable, { data: bySession, cols: [
          { key: 'label',   label: 'Session',      render: r => h('span', { style: { fontFamily: 'inherit', color: 'var(--t1)' } }, r.label) },
          { key: 'trades',  label: 'Trades' },
          { key: 'winRate', label: 'Win Rate',     render: r => h('span', { className: r.winRate >= 50 ? 'text-pos' : 'text-neg' }, Calc.fmt.pct(r.winRate)) },
          { key: 'pl',      label: 'Total P/L',   render: r => h(UI.PLText, { value: r.pl, size: 'sm' }) },
          { key: 'avgR',    label: 'Avg R',        render: r => h(UI.RText,  { value: r.avgR }) },
        ]})
      ),

      tab === 'setup' && h('div', null,
        h(BarCard, { title: 'P/L by Setup', data: bySetup, count: bySetup.length }),
        h(StatsTable, { data: bySetup, cols: [
          { key: 'label',   label: 'Setup',        render: r => h('span', { className: 'badge badge-blue' }, r.label) },
          { key: 'trades',  label: 'Trades' },
          { key: 'winRate', label: 'Win Rate',     render: r => h('span', { className: r.winRate >= 50 ? 'text-pos' : 'text-neg' }, Calc.fmt.pct(r.winRate)) },
          { key: 'pl',      label: 'Total P/L',   render: r => h(UI.PLText, { value: r.pl, size: 'sm' }) },
          { key: 'avgR',    label: 'Avg R',        render: r => h(UI.RText,  { value: r.avgR }) },
        ]})
      ),

      tab === 'dayofweek' && h('div', null, (() => {
        const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        const dayData = days.map(day => {
          const dayTrades = filtered.filter(t => t.date && new Date(t.date).getDay() === days.indexOf(day));
          const pl  = dayTrades.reduce((s,t) => s + (t.profitLoss||0), 0);
          const wins = dayTrades.filter(t => (t.profitLoss||0) > 0).length;
          return { label: day.substring(0,3), pl: +pl.toFixed(2), trades: dayTrades.length, winRate: dayTrades.length ? wins/dayTrades.length*100 : 0 };
        });
        return h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'P/L by Day of Week')),
          h('div', { style: { padding: '8px 4px 4px' } },
            h(ResponsiveContainer, { width: '100%', height: 200 },
              h(BarChart, { data: dayData, margin: { left: 0, right: 10, top: 4, bottom: 0 } },
                h(CartesianGrid, { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }),
                h(XAxis, { dataKey: 'label', tick: { fontSize: 10.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false }),
                h(YAxis, { tick: { fontSize: 9.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false, tickFormatter: v => `$${v}`, width: 56 }),
                h(Tooltip, { content: UI.ChartTooltip }),
                h(Bar, { dataKey: 'pl', radius: [3,3,0,0], maxBarSize: 48, name: 'P/L' },
                  dayData.map((d, i) => h(Cell, { key: i, fill: d.pl >= 0 ? 'rgba(45,206,137,0.62)' : 'rgba(245,54,92,0.62)' }))
                )
              )
            )
          )
        );
      })()),

      tab === 'compliance' && h('div', null,
        h('div', { className: 'grid-2 mb-14' },
          ...[
            { label: 'Following the Plan', metrics: mF, count: compFollow.length, color: 'var(--green)' },
            { label: 'Breaking the Plan',  metrics: mB, count: compBroken.length, color: 'var(--red)' },
          ].map(({ label, metrics: m, count, color }) =>
            h('div', { key: label, className: 'glass-card' },
              h('div', { className: 'card-header' },
                h('span', { className: 'card-title' }, label),
                h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, `${count} trades`)
              ),
              h('div', { className: 'card-body', style: { padding: '6px 14px' } },
                [
                  { l: 'Win Rate',      v: Calc.fmt.pct(m.winRate) },
                  { l: 'Avg R',         v: Calc.fmt.r(m.averageR) },
                  { l: 'Total P/L',     v: Calc.fmt.currency(m.totalPL) },
                  { l: 'Profit Factor', v: isFinite(m.profitFactor) ? m.profitFactor.toFixed(2) : ' ' },
                ].map((x, i) => h('div', { key: i, className: 'metric-row' },
                  h('span', { className: 'metric-name' }, x.l),
                  h('span', { className: 'metric-val', style: { color } }, x.v)
                ))
              )
            )
          )
        ),
        h('div', { className: 'alert alert-info' }, h(UI.Icon, { name: 'info', size: 13 }), `Overall rule compliance: ${Calc.fmt.pct(Calc.ruleCompliance(accountTrades))} of trades followed the plan.`)
      )
    )
  );
}

window.AccountsPage  = AccountsPage;
window.CalendarPage  = CalendarPage;
window.AnalyticsPage = AnalyticsPage;
