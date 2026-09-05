// ============================================================
// MISTAKES PAGE
// ============================================================

function MistakesPage() {
  const { accountTrades, mistakes, upsertMistake } = useApp();
  const [showAdd, setShowAdd] = React.useState(false);
  const [newM, setNewM] = React.useState({ name: '', description: '' });

  const stats = React.useMemo(() => {
    const closed = accountTrades.filter(t => t.status === 'Closed' && t.mistake);
    const map = {};
    closed.forEach(t => {
      const n = t.mistake;
      if (!map[n]) map[n] = { name: n, count: 0, totalLoss: 0, sessions: {}, setups: {}, losses: [] };
      map[n].count++;
      if ((t.profitLoss || 0) < 0) {
        map[n].totalLoss += Math.abs(t.profitLoss);
        map[n].losses.push(t.profitLoss);
      }
      if (t.session) map[n].sessions[t.session] = (map[n].sessions[t.session] || 0) + 1;
      if (t.setup)   map[n].setups[t.setup]     = (map[n].setups[t.setup]     || 0) + 1;
    });
    const total = closed.length;
    return Object.values(map).map(m => ({
      ...m,
      avgLoss:     m.losses.length ? m.losses.reduce((a, b) => a + b, 0) / m.losses.length : 0,
      pctOfTotal:  total > 0 ? (m.count / total) * 100 : 0,
      topSession:  Object.entries(m.sessions).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
      topSetup:    Object.entries(m.setups).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    })).sort((a, b) => b.totalLoss - a.totalLoss);
  }, [accountTrades]);

  const maxLoss = Math.max(...stats.map(m => m.totalLoss), 1);

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null, h('div', { className: 'page-title' }, 'Mistakes'), h('div', { className: 'page-subtitle' }, 'Identify and eliminate recurring errors')),
      h('button', { className: 'btn btn-secondary', onClick: () => setShowAdd(true) }, 'Add Type')
    ),
    h('div', { className: 'page-body' },
      stats.length === 0
        ? h(UI.EmptyState, { icon: 'mistakes', title: 'No mistakes recorded', desc: 'Record trades with mistakes to see analysis. Every loss is a learning opportunity.' })
        : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 } },
            stats.map((m, i) => h('div', { key: i, className: 'glass-card' },
              h('div', { style: { padding: 15 } },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } },
                  h('div', null,
                    h('div', { style: { fontSize: 14, fontWeight: 650, color: 'var(--t1)', marginBottom: 4 } }, m.name),
                    h('div', { style: { display: 'flex', gap: 10 } },
                      h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, `${m.count} occurrence${m.count !== 1 ? 's' : ''}`),
                      h('span', { style: { fontSize: 11, color: 'var(--t4)' } }, '·'),
                      h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, `${m.pctOfTotal.toFixed(0)}% of mistake trades`)
                    )
                  ),
                  h('div', { style: { textAlign: 'right' } },
                    h('div', { style: { fontSize: 16, fontWeight: 700, color: 'var(--red)', fontFamily: 'var(--mono)' } }, `-${Calc.fmt.currency(m.totalLoss)}`),
                    h('div', { style: { fontSize: 10.5, color: 'var(--t3)', marginTop: 2 } }, `Avg: ${Calc.fmt.currency(m.avgLoss)}`)
                  )
                ),
                h('div', { className: 'mistake-bar' },
                  h('div', { className: 'mistake-fill', style: { width: `${(m.totalLoss / maxLoss) * 100}%` } })
                ),
                h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 } },
                  h('div', { style: { fontSize: 11.5, color: 'var(--t3)' } }, 'Common Session: ', h('span', { style: { color: 'var(--t2)', fontWeight: 500 } }, m.topSession)),
                  h('div', { style: { fontSize: 11.5, color: 'var(--t3)' } }, 'Common Setup: ', h('span', { style: { color: 'var(--t2)', fontWeight: 500 } }, m.topSetup))
                )
              )
            ))
          ),

      h('div', { className: 'section-heading' }, 'All Mistake Types'),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 7 } },
        mistakes.map(m => h('div', { key: m.id, style: { background: 'rgba(8,9,13,0.45)', border: '1px solid var(--border-1)', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
          h('div', null,
            h('div', { style: { fontSize: 12.5, color: 'var(--t1)', fontWeight: 450 } }, m.name),
            m.isDefault && h('span', { className: 'badge badge-gray', style: { marginTop: 3 } }, 'Default')
          ),
          h('span', { style: { fontSize: 11, color: 'var(--t4)', fontFamily: 'var(--mono)' } }, `${stats.find(s => s.name === m.name)?.count || 0}x`)
        ))
      )
    ),
    h(UI.Modal, { open: showAdd, onClose: () => setShowAdd(false), title: 'Add Mistake Type',
      footer: h(React.Fragment, null,
        h('button', { className: 'btn btn-secondary', onClick: () => setShowAdd(false) }, 'Cancel'),
        h('button', { className: 'btn btn-primary', onClick: async () => { if (!newM.name.trim()) return; await upsertMistake({ ...newM, isDefault: false }); setNewM({ name: '', description: '' }); setShowAdd(false); UI.toast('Mistake type added', 'success'); } }, 'Add')
      )
    },
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Name'), h('input', { className: 'input-field', placeholder: 'e.g. Chasing Price', value: newM.name, onChange: e => setNewM(p => ({ ...p, name: e.target.value })) })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Description'), h('textarea', { className: 'textarea-field', value: newM.description, onChange: e => setNewM(p => ({ ...p, description: e.target.value })) }))
    )
  );
}

// ============================================================
// PLAYBOOK PAGE
// ============================================================
function PlaybookPage() {
  const { playbook, upsertPlaybook, deletePlaybook } = useApp();
  const [showForm,   setShowForm]   = React.useState(false);
  const [editSetup,  setEditSetup]  = React.useState(null);
  const [selected,   setSelected]   = React.useState(null);
  const [confirmDel, setConfirmDel] = React.useState(null);
  const [checks,     setChecks]     = React.useState({});

  function SetupForm({ setup, onSave, onClose }) {
    const [f, setF] = React.useState(setup || { name:'', description:'', htfBias:[], poi:[], confirmation:[], entryModel:'', invalidation:'', target:'', riskRules:'', checklist:[], notes:'' });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const tog = (key, val) => set(key, f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val]);
    const [item, setItem] = React.useState('');
    return h('div', null,
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Setup Name *'), h('input', { className: 'input-field', value: f.name, onChange: e => set('name', e.target.value), placeholder: 'e.g. NY Open FVG Reversal' })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Description'), h('textarea', { className: 'textarea-field', value: f.description, onChange: e => set('description', e.target.value) })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'HTF Bias'), h('div', { className: 'pill-selector' }, BIASES.map(b => h('div', { key: b, className: `pill ${f.htfBias.includes(b) ? 'sel' : ''}`, onClick: () => tog('htfBias', b) }, b)))),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'POI'), h('div', { className: 'pill-selector' }, POIS.slice(0,9).map(p => h('div', { key: p, className: `pill ${f.poi.includes(p) ? 'sel' : ''}`, onClick: () => tog('poi', p) }, p)))),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Confirmation'), h('div', { className: 'pill-selector' }, CONFIRMATIONS.map(c => h('div', { key: c, className: `pill ${f.confirmation.includes(c) ? 'sel' : ''}`, onClick: () => tog('confirmation', c) }, c)))),
      h('div', { className: 'form-row' },
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Entry Model'), h('input', { className: 'input-field', value: f.entryModel, onChange: e => set('entryModel', e.target.value) })),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Target'), h('input', { className: 'input-field', value: f.target, onChange: e => set('target', e.target.value) })),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Invalidation'), h('input', { className: 'input-field', value: f.invalidation, onChange: e => set('invalidation', e.target.value) })),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Risk Rules'), h('input', { className: 'input-field', value: f.riskRules, onChange: e => set('riskRules', e.target.value) })),
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Pre-Trade Checklist'),
        h('div', { style: { display: 'flex', gap: 6, marginBottom: 8 } },
          h('input', { className: 'input-field', placeholder: 'Add item and press Enter', value: item, onChange: e => setItem(e.target.value), onKeyDown: e => { if (e.key === 'Enter' && item.trim()) { set('checklist', [...f.checklist, item.trim()]); setItem(''); } } }),
          h('button', { className: 'btn btn-secondary btn-sm', onClick: () => { if (item.trim()) { set('checklist', [...f.checklist, item.trim()]); setItem(''); } } }, h(UI.Icon, { name: 'plus', size: 13 }))
        ),
        f.checklist.map((c, i) => h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(51,65,85,0.22)' } },
          h('span', { style: { flex: 1, fontSize: 12.5, color: 'var(--t2)' } }, c),
          h('button', { style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t4)' }, onClick: () => set('checklist', f.checklist.filter((_, idx) => idx !== i)) }, h(UI.Icon, { name: 'x', size: 11 }))
        ))
      ),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Notes'), h('textarea', { className: 'textarea-field', value: f.notes, onChange: e => set('notes', e.target.value) })),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 } },
        h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
        h('button', { className: 'btn btn-primary', onClick: () => { if (!f.name.trim()) return; onSave(f); onClose(); } }, setup ? 'Update' : 'Save Setup')
      )
    );
  }

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null, h('div', { className: 'page-title' }, 'Playbook'), h('div', { className: 'page-subtitle' }, `${playbook.length} setup${playbook.length !== 1 ? 's' : ''} defined`)),
      h('button', { className: 'btn btn-primary', onClick: () => { setEditSetup(null); setShowForm(true); } }, 'Add Setup')
    ),
    h('div', { className: 'page-body' },
      playbook.length === 0
        ? h(UI.EmptyState, { icon: 'playbook', title: 'No setups defined', desc: 'Build your trading playbook — define setups, conditions, and checklists.', action: h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, 'Add Setup') })
        : h('div', { style: { display: 'grid', gridTemplateColumns: selected ? '280px 1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, transition: 'all 0.2s' } },
            // Left: setup cards
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, maxHeight: selected ? '78vh' : 'none', overflowY: selected ? 'auto' : 'visible' } },
              playbook.map(s => h('div', { key: s.id, className: 'glass-card', style: { cursor: 'pointer', border: selected?.id === s.id ? '1px solid var(--accent)' : undefined }, onClick: () => setSelected(selected?.id === s.id ? null : s) },
                h('div', { style: { padding: 13 } },
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 } },
                    h('div', { style: { fontSize: 13.5, fontWeight: 650, color: 'var(--t1)' } }, s.name),
                    h('div', { style: { display: 'flex', gap: 4 } },
                      h('button', { className: 'btn btn-secondary btn-icon sm', onClick: e => { e.stopPropagation(); setEditSetup(s); setShowForm(true); } }, h(UI.Icon, { name: 'edit', size: 11 })),
                      h('button', { className: 'btn btn-danger  btn-icon sm', onClick: e => { e.stopPropagation(); setConfirmDel(s.id); } }, h(UI.Icon, { name: 'trash', size: 11 }))
                    )
                  ),
                  s.description && h('div', { style: { fontSize: 11.5, color: 'var(--t3)', marginBottom: 8, lineHeight: 1.5 } }, s.description.substring(0, 100) + (s.description.length > 100 ? '…' : '')),
                  h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 4 } },
                    s.poi?.slice(0, 2).map(p => h('span', { key: p, className: 'badge badge-blue' }, p)),
                    s.confirmation?.slice(0, 2).map(c => h('span', { key: c, className: 'badge badge-green' }, c)),
                    s.checklist?.length > 0 && h('span', { className: 'badge badge-gray' }, `${s.checklist.length} checklist`)
                  )
                )
              ))
            ),
            // Right: setup detail
            selected && h('div', { className: 'glass-card' },
              h('div', { className: 'card-header' },
                h('span', { className: 'card-title' }, selected.name),
                h('button', { className: 'modal-close', onClick: () => setSelected(null) }, h(UI.Icon, { name: 'x', size: 13 }))
              ),
              h('div', { className: 'card-body', style: { overflowY: 'auto', maxHeight: 'calc(78vh - 52px)' } },
                selected.description && h('div', { style: { marginBottom: 14 } }, h('div', { className: 'section-heading' }, 'Description'), h('div', { style: { fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 } }, selected.description)),
                selected.htfBias?.length     > 0 && h('div', { style: { marginBottom: 12 } }, h('div', { className: 'section-heading' }, 'HTF Bias'),     h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } }, selected.htfBias.map(b => h('span', { key: b, className: 'badge badge-blue' }, b)))),
                selected.poi?.length         > 0 && h('div', { style: { marginBottom: 12 } }, h('div', { className: 'section-heading' }, 'POI'),           h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } }, selected.poi.map(p => h('span', { key: p, className: 'badge badge-cyan' }, p)))),
                selected.confirmation?.length > 0 && h('div', { style: { marginBottom: 12 } }, h('div', { className: 'section-heading' }, 'Confirmation'), h('div', { style: { display: 'flex', gap: 5, flexWrap: 'wrap' } }, selected.confirmation.map(c => h('span', { key: c, className: 'badge badge-green' }, c)))),
                selected.entryModel  && h('div', { style: { marginBottom: 10 } }, h('div', { className: 'section-heading' }, 'Entry Model'),  h('div', { style: { fontSize: 12.5, color: 'var(--t2)' } }, selected.entryModel)),
                selected.target      && h('div', { style: { marginBottom: 10 } }, h('div', { className: 'section-heading' }, 'Target'),       h('div', { style: { fontSize: 12.5, color: '#2dce89' } }, selected.target)),
                selected.invalidation && h('div', { style: { marginBottom: 10 } }, h('div', { className: 'section-heading' }, 'Invalidation'), h('div', { style: { fontSize: 12.5, color: '#f5365c' } }, selected.invalidation)),
                selected.riskRules   && h('div', { style: { marginBottom: 10 } }, h('div', { className: 'section-heading' }, 'Risk Rules'),   h('div', { style: { fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 } }, selected.riskRules)),
                selected.checklist?.length > 0 && h('div', null,
                  h('div', { className: 'section-heading' }, 'Pre-Trade Checklist'),
                  selected.checklist.map((item, i) => {
                    const key = `${selected.id}-${i}`;
                    const done = !!checks[key];
                    return h('div', { key: i, className: 'check-row' },
                      h('div', { className: `checkbox ${done ? 'checked' : ''}`, onClick: () => setChecks(p => ({ ...p, [key]: !p[key] })) },
                        done && h(UI.Icon, { name: 'check', size: 10, color: '#fff' })
                      ),
                      h('span', { className: `check-label ${done ? 'done' : ''}` }, item)
                    );
                  })
                ),
                selected.notes && h('div', { style: { marginTop: 12 } }, h('div', { className: 'section-heading' }, 'Notes'), h('div', { style: { fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.6 } }, selected.notes))
              )
            )
          )
    ),
    h(UI.Modal, { open: showForm, onClose: () => { setShowForm(false); setEditSetup(null); }, title: editSetup ? 'Edit Setup' : 'New Setup', size: 'lg' },
      h(SetupForm, { setup: editSetup, onSave: async s => { await upsertPlaybook(s); UI.toast(s.id ? 'Setup updated' : 'Setup saved', 'success'); }, onClose: () => { setShowForm(false); setEditSetup(null); } })
    ),
    h(UI.ConfirmModal, { open: !!confirmDel, onClose: () => setConfirmDel(null), onConfirm: async () => { await deletePlaybook(confirmDel); UI.toast('Setup deleted', 'success'); if (selected?.id === confirmDel) setSelected(null); }, title: 'Delete Setup', message: 'Delete this playbook setup? This cannot be undone.' })
  );
}

// ============================================================
// REVIEWS PAGE
// ============================================================
function ReviewsPage() {
  const { accountTrades, weeklyReviews, monthlyReviews, saveWeeklyReview, saveMonthlyReview } = useApp();
  const [tab,         setTab]  = React.useState('weekly');
  const [editWeekly,  setEW]   = React.useState(null);
  const [editMonthly, setEM]   = React.useState(null);

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const getWeekRange = (date) => {
    const d   = new Date(date);
    const day = d.getDay();
    const s   = new Date(d); s.setDate(d.getDate() - day);
    const e   = new Date(s); e.setDate(s.getDate() + 6);
    const fmt = x => x.toISOString().split('T')[0];
    return { start: fmt(s), end: fmt(e) };
  };

  const weeks = React.useMemo(() => {
    const map = {};
    accountTrades.filter(t => t.status === 'Closed').forEach(t => {
      const { start, end } = getWeekRange(t.date);
      if (!map[start]) map[start] = { weekStart: start, weekEnd: end, trades: [], pl: 0, wins: 0 };
      map[start].trades.push(t);
      map[start].pl += (t.profitLoss || 0);
      if ((t.profitLoss || 0) > 0) map[start].wins++;
    });
    return Object.values(map).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  }, [accountTrades]);

  const months = React.useMemo(() => {
    const map = {};
    accountTrades.filter(t => t.status === 'Closed').forEach(t => {
      const [y, m] = t.date.split('-');
      const k = `${y}-${m}`;
      if (!map[k]) map[k] = { year: +y, month: +m, key: k, trades: [], pl: 0, wins: 0 };
      map[k].trades.push(t);
      map[k].pl += (t.profitLoss || 0);
      if ((t.profitLoss || 0) > 0) map[k].wins++;
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  }, [accountTrades]);

  function WeekForm({ wk, existing, onSave, onClose }) {
    const trs = wk.trades;
    const wr  = trs.length ? (wk.wins / trs.length) * 100 : 0;
    const totalR = trs.reduce((s, t) => s + (t.rMultiple || 0), 0);
    const best  = trs.reduce((b, t) => !b || (t.profitLoss||0) > (b.profitLoss||0) ? t : b, null);
    const worst = trs.reduce((w, t) => !w || (t.profitLoss||0) < (w.profitLoss||0) ? t : w, null);
    const misMap = trs.filter(t => t.mistake).reduce((m, t) => { m[t.mistake] = (m[t.mistake]||0)+1; return m; }, {});
    const topMistake = Object.entries(misMap).sort((a,b) => b[1]-a[1])[0]?.[0] || '—';
    const [f, setF] = React.useState({ whatWorked: existing?.whatWorked||'', whatFailed: existing?.whatFailed||'', needsImprovement: existing?.needsImprovement||'', nextWeekFocus: existing?.nextWeekFocus||'' });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    return h('div', null,
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 } },
        [
          { l: 'Trades',  v: trs.length },
          { l: 'Win Rate', v: Calc.fmt.pct(wr),     cls: wr >= 50 ? 'text-pos' : 'text-neg' },
          { l: 'Total R',  v: Calc.fmt.r(totalR),   cls: totalR >= 0 ? 'text-pos' : 'text-neg' },
          { l: 'P/L',      v: Calc.fmt.currency(wk.pl), cls: wk.pl >= 0 ? 'text-pos' : 'text-neg' },
        ].map((x, i) => h('div', { key: i, className: 'calc-display' }, h('div', { className: 'label' }, x.l), h('div', { className: `value ${x.cls||''}` }, x.v)))
      ),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 } },
        [
          { l: 'Best Trade',     v: best  ? `${best.instrument} ${Calc.fmt.currency(best.profitLoss||0)}`  : '—', cls: 'text-pos' },
          { l: 'Worst Trade',    v: worst ? `${worst.instrument} ${Calc.fmt.currency(worst.profitLoss||0)}` : '—', cls: 'text-neg' },
          { l: 'Top Mistake',    v: topMistake },
          { l: 'Rule Compliance', v: Calc.fmt.pct(Calc.ruleCompliance(trs)) },
        ].map((x, i) => h('div', { key: i, className: 'metric-row' },
          h('span', { className: 'metric-name' }, x.l),
          h('span', { className: `metric-val ${x.cls||''}` }, x.v)
        ))
      ),
      h('hr', { className: 'section-divider' }),
      ...[
        { k: 'whatWorked',        label: 'What Worked',            ph: 'What went well this week?' },
        { k: 'whatFailed',        label: 'What Failed',            ph: 'What went wrong this week?' },
        { k: 'needsImprovement',  label: 'Needs Improvement',      ph: 'What specific area needs work?' },
        { k: 'nextWeekFocus',     label: 'Next Week Focus',        ph: 'Primary focus for next week?' },
      ].map(x => h('div', { key: x.k, className: 'input-group' },
        h('label', { className: 'input-label' }, x.label),
        h('textarea', { className: 'textarea-field', value: f[x.k], onChange: e => set(x.k, e.target.value), placeholder: x.ph })
      )),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 } },
        h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
        h('button', { className: 'btn btn-primary', onClick: () => { onSave({ ...f, id: existing?.id, weekStart: wk.weekStart, weekEnd: wk.weekEnd, totalTrades: trs.length, winRate: wr, totalR, totalPL: wk.pl }); onClose(); } }, 'Save Review')
      )
    );
  }

  function MonthForm({ mo, existing, onSave, onClose }) {
    const trs = mo.trades;
    const wr  = trs.length ? (mo.wins / trs.length) * 100 : 0;
    const totalR = trs.reduce((s, t) => s + (t.rMultiple || 0), 0);
    const [reflection, setRef] = React.useState(existing?.reflection || '');
    return h('div', null,
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 } },
        [{ l:'Trades', v:trs.length }, { l:'Win Rate', v:Calc.fmt.pct(wr), cls:wr>=50?'text-pos':'text-neg' }, { l:'Total R', v:Calc.fmt.r(totalR), cls:totalR>=0?'text-pos':'text-neg' }, { l:'P/L', v:Calc.fmt.currency(mo.pl), cls:mo.pl>=0?'text-pos':'text-neg' }]
        .map((x, i) => h('div', { key: i, className: 'calc-display' }, h('div', { className: 'label' }, x.l), h('div', { className: `value ${x.cls||''}` }, x.v)))
      ),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Monthly Reflection'), h('textarea', { className: 'textarea-field', style: { minHeight: 150 }, value: reflection, onChange: e => setRef(e.target.value), placeholder: 'Summarize the month: lessons, emotional state, what to carry forward...' })),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 } },
        h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
        h('button', { className: 'btn btn-primary', onClick: () => { onSave({ id: existing?.id, reflection, month: mo.month, year: mo.year, totalPL: mo.pl, winRate: wr, totalR, profitFactor: Calc.profitFactor(trs) }); onClose(); } }, 'Save Review')
      )
    );
  }

  return h('div', null,
    h('div', { className: 'page-header' }, h('div', null, h('div', { className: 'page-title' }, 'Reviews'), h('div', { className: 'page-subtitle' }, 'Weekly and monthly performance reviews'))),
    h('div', { className: 'page-tabs' },
      [{ id:'weekly', label:'Weekly Reviews' }, { id:'monthly', label:'Monthly Reviews' }].map(t =>
        h('div', { key: t.id, className: `page-tab ${tab === t.id ? 'active' : ''}`, onClick: () => setTab(t.id) }, t.label)
      )
    ),
    h('div', { className: 'page-body' },
      tab === 'weekly' && (weeks.length === 0
        ? h(UI.EmptyState, { icon: 'reviews', title: 'No trading weeks yet', desc: 'Record trades to start generating weekly reviews.' })
        : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
            weeks.map(wk => {
              const ex  = weeklyReviews.find(r => r.weekStart === wk.weekStart);
              const wr  = wk.trades.length ? (wk.wins / wk.trades.length) * 100 : 0;
              const totalR = wk.trades.reduce((s, t) => s + (t.rMultiple||0), 0);
              return h('div', { key: wk.weekStart, className: 'glass-card' },
                h('div', { style: { padding: 15 } },
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
                    h('div', null,
                      h('div', { style: { fontSize: 14, fontWeight: 650, color: 'var(--t1)' } }, `Week of ${wk.weekStart}`),
                      h('div', { style: { fontSize: 11, color: 'var(--t3)', marginTop: 2 } }, `${wk.weekStart} — ${wk.weekEnd}`)
                    ),
                    h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                      ex ? h('span', { className: 'badge badge-green' }, 'Reviewed') : h('span', { className: 'badge badge-gray' }, 'Not reviewed'),
                      h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setEW(wk) }, ex ? 'Edit' : 'Write Review')
                    )
                  ),
                  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 } },
                    [
                      { l:'Trades',  v:wk.trades.length },
                      { l:'Win Rate', v:Calc.fmt.pct(wr), cls:wr>=50?'text-pos':'text-neg' },
                      { l:'Total R',  v:Calc.fmt.r(totalR), cls:totalR>=0?'text-pos':'text-neg' },
                      { l:'P/L',      v:Calc.fmt.currency(wk.pl), cls:wk.pl>=0?'text-pos':'text-neg' },
                      { l:'Compliance', v:Calc.fmt.pct(Calc.ruleCompliance(wk.trades)) },
                    ].map((x, i) => h('div', { key: i, style: { textAlign: 'center' } },
                      h('div', { style: { fontSize: 10, color: 'var(--t3)', marginBottom: 3 } }, x.l),
                      h('div', { style: { fontSize: 14, fontWeight: 650, fontFamily: 'var(--mono)' }, className: x.cls||'' }, x.v)
                    ))
                  ),
                  ex && h('div', { style: { marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } },
                    ex.whatWorked && h('div', null, h('div', { style: { fontSize: 9.5, color: '#2dce89', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 } }, 'What Worked'), h('div', { style: { fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 } }, ex.whatWorked)),
                    ex.whatFailed && h('div', null, h('div', { style: { fontSize: 9.5, color: '#f5365c', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 } }, 'What Failed'), h('div', { style: { fontSize: 12, color: 'var(--t2)', lineHeight: 1.5 } }, ex.whatFailed))
                  )
                )
              );
            })
          )
      ),

      tab === 'monthly' && (months.length === 0
        ? h(UI.EmptyState, { icon: 'reviews', title: 'No monthly data yet', desc: 'Record trades across different months to generate monthly reviews.' })
        : h('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
            months.map(mo => {
              const ex  = monthlyReviews.find(r => r.year === mo.year && r.month === mo.month);
              const wr  = mo.trades.length ? (mo.wins / mo.trades.length) * 100 : 0;
              const totalR = mo.trades.reduce((s, t) => s + (t.rMultiple||0), 0);
              return h('div', { key: mo.key, className: 'glass-card' },
                h('div', { style: { padding: 15 } },
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
                    h('div', { style: { fontSize: 15, fontWeight: 650, color: 'var(--t1)' } }, `${MONTHS[mo.month-1]} ${mo.year}`),
                    h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
                      ex ? h('span', { className: 'badge badge-green' }, 'Reviewed') : h('span', { className: 'badge badge-gray' }, 'Not reviewed'),
                      h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setEM(mo) }, ex ? 'Edit' : 'Write Review')
                    )
                  ),
                  h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 } },
                    [
                      { l:'Trades', v:mo.trades.length },
                      { l:'Win Rate', v:Calc.fmt.pct(wr), cls:wr>=50?'text-pos':'text-neg' },
                      { l:'Total R',  v:Calc.fmt.r(totalR), cls:totalR>=0?'text-pos':'text-neg' },
                      { l:'P/L',      v:Calc.fmt.currency(mo.pl), cls:mo.pl>=0?'text-pos':'text-neg' },
                      { l:'P-Factor', v:isFinite(Calc.profitFactor(mo.trades)) ? Calc.profitFactor(mo.trades).toFixed(2) : '—' },
                    ].map((x, i) => h('div', { key: i, style: { textAlign: 'center' } },
                      h('div', { style: { fontSize: 10, color: 'var(--t3)', marginBottom: 3 } }, x.l),
                      h('div', { style: { fontSize: 14, fontWeight: 650, fontFamily: 'var(--mono)' }, className: x.cls||'' }, x.v)
                    ))
                  ),
                  ex?.reflection && h('div', { style: { marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-1)' } },
                    h('div', { style: { fontSize: 9.5, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 5 } }, 'Reflection'),
                    h('div', { style: { fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 } }, ex.reflection)
                  )
                )
              );
            })
          )
      )
    ),
    h(UI.Modal, { open: !!editWeekly,  onClose: () => setEW(null),  title: `Weekly Review — ${editWeekly?.weekStart  || ''}`, size: 'lg' }, editWeekly  && h(WeekForm,  { wk: editWeekly,  existing: weeklyReviews.find(r => r.weekStart === editWeekly.weekStart),                              onSave: async d => { await saveWeeklyReview(d);  UI.toast('Weekly review saved',  'success'); }, onClose: () => setEW(null) })),
    h(UI.Modal, { open: !!editMonthly, onClose: () => setEM(null),  title: `Monthly Review — ${editMonthly ? MONTHS[editMonthly.month-1]+' '+editMonthly.year : ''}`, size: 'lg' }, editMonthly && h(MonthForm, { mo: editMonthly, existing: monthlyReviews.find(r => r.year === editMonthly.year && r.month === editMonthly.month), onSave: async d => { await saveMonthlyReview(d); UI.toast('Monthly review saved', 'success'); }, onClose: () => setEM(null) }))
  );
}

// ============================================================
// DAILY JOURNAL PAGE
// ============================================================
function JournalPage() {
  const { journals, accountTrades, upsertJournal, activeAccountId } = useApp();
  const [selDate, setSelDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = React.useState(false);

  const current   = journals.find(j => j.date === selDate && j.accountId === activeAccountId);
  const dayTrades = accountTrades.filter(t => t.date === selDate && t.status === 'Closed');
  const dayPL     = dayTrades.reduce((s, t) => s + (t.profitLoss || 0), 0);

  const recentDates = [...new Set([...journals.map(j => j.date), ...accountTrades.map(t => t.date)])].sort().reverse().slice(0, 14);

  function JournalForm({ existing, onSave, onClose }) {
    const [f, setF] = React.useState({
      marketBias: existing?.marketBias || '', plan: existing?.plan || '',
      importantLevels: existing?.importantLevels || '', expectedScenario: existing?.expectedScenario || '',
      actualMarketBehavior: existing?.actualMarketBehavior || '', emotionalState: existing?.emotionalState || 'Calm',
      lessons: existing?.lessons || '', tomorrowPlan: existing?.tomorrowPlan || '',
    });
    const set = (k, v) => setF(p => ({ ...p, [k]: v }));
    const ta = (label, key, ph) => h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, label), h('textarea', { className: 'textarea-field', placeholder: ph, value: f[key], onChange: e => set(key, e.target.value) }));
    return h('div', null,
      h('div', { className: 'form-row' },
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Market Bias'), h('input', { className: 'input-field', placeholder: 'Bullish / Bearish / Ranging', value: f.marketBias, onChange: e => set('marketBias', e.target.value) })),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Emotional State'), h('select', { className: 'select-field', value: f.emotionalState, onChange: e => set('emotionalState', e.target.value) }, EMOTIONS.map(em => h('option', { key: em, value: em }, em)))),
      ),
      ta('Trading Plan',         'plan',                 'What is the plan? What setups are you looking for?'),
      ta('Important Levels',     'importantLevels',      'Key price levels, POIs, liquidity zones'),
      ta('Expected Scenario',    'expectedScenario',     'What price action scenario are you expecting?'),
      ta('Actual Market Behavior','actualMarketBehavior','What actually happened? How did price behave?'),
      ta('Lessons Learned',      'lessons',              "Key lessons from today's session"),
      ta("Tomorrow's Plan",      'tomorrowPlan',         'Focus and plan for tomorrow'),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 } },
        h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
        h('button', { className: 'btn btn-primary', onClick: () => { onSave({ ...f, id: existing?.id, date: selDate, accountId: activeAccountId, dailyPL: dayPL, tradesTaken: dayTrades.map(t => t.id) }); onClose(); } }, 'Save Journal')
      )
    );
  }

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null, h('div', { className: 'page-title' }, 'Daily Journal'), h('div', { className: 'page-subtitle' }, 'Pre and post session notes')),
      h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, current ? 'Edit Entry' : 'New Entry')
    ),
    h('div', { className: 'page-body' },
      h('div', { style: { display: 'grid', gridTemplateColumns: '188px 1fr', gap: 20 } },
        // Left: date nav
        h('div', null,
          h('div', { style: { marginBottom: 10 } }, h('input', { type: 'date', className: 'input-field', value: selDate, onChange: e => setSelDate(e.target.value) })),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
            recentDates.map(date => {
              const j  = journals.find(j => j.date === date);
              const dt = accountTrades.filter(t => t.date === date && t.status === 'Closed');
              const pl = dt.reduce((s, t) => s + (t.profitLoss||0), 0);
              return h('div', { key: date, onClick: () => setSelDate(date), style: { padding: '7px 11px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${selDate === date ? 'var(--accent)' : 'var(--border-1)'}`, background: selDate === date ? 'rgba(91,141,238,0.07)' : 'rgba(8,9,13,0.4)', transition: 'all 0.15s' } },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                  h('span', { style: { fontSize: 11.5, color: selDate === date ? 'var(--accent)' : 'var(--t2)' } }, date),
                  j && h('div', { style: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' } })
                ),
                dt.length > 0 && h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 3 } },
                  h('span', { style: { fontSize: 10, color: 'var(--t4)' } }, `${dt.length}T`),
                  h('span', { style: { fontSize: 10, fontFamily: 'var(--mono)', color: pl >= 0 ? 'var(--green)' : 'var(--red)' } }, Calc.fmt.currency(pl))
                )
              );
            })
          )
        ),
        // Right: journal content
        h('div', null,
          // Day stats
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 } },
            [
              { l:'Trades',  v: dayTrades.length },
              { l:'Wins',    v: dayTrades.filter(t => (t.profitLoss||0) > 0).length, cls: 'text-pos' },
              { l:'Losses',  v: dayTrades.filter(t => (t.profitLoss||0) < 0).length, cls: 'text-neg' },
              { l:'Day P/L', v: Calc.fmt.currency(dayPL), cls: dayPL >= 0 ? 'text-pos' : 'text-neg' },
            ].map((x, i) => h('div', { key: i, style: { background: 'rgba(8,9,13,0.5)', border: '1px solid var(--border-1)', borderRadius: 8, padding: '9px 13px', textAlign: 'center' } },
              h('div', { style: { fontSize: 10, color: 'var(--t3)', marginBottom: 4 } }, x.l),
              h('div', { style: { fontSize: 16, fontWeight: 650, fontFamily: 'var(--mono)' }, className: x.cls||'' }, x.v)
            ))
          ),
          // Journal content or empty
          current
            ? h('div', { className: 'glass-card', style: { marginBottom: 16 } },
                h('div', { className: 'card-header' },
                  h('span', { className: 'card-title' }, `Journal — ${selDate}`),
                  h('button', { className: 'btn btn-secondary btn-sm', onClick: () => setShowForm(true) }, h(UI.Icon, { name: 'edit', size: 12 }), 'Edit')
                ),
                h('div', { className: 'card-body' },
                  h('div', { style: { display: 'flex', flexDirection: 'column', gap: 13 } },
                    [
                      { l:'Market Bias', v:current.marketBias }, { l:'Emotional State', v:current.emotionalState },
                      { l:'Trading Plan', v:current.plan }, { l:'Important Levels', v:current.importantLevels },
                      { l:'Expected Scenario', v:current.expectedScenario }, { l:'Actual Market Behavior', v:current.actualMarketBehavior },
                      { l:'Lessons Learned', v:current.lessons }, { l:"Tomorrow's Plan", v:current.tomorrowPlan },
                    ].filter(x => x.v).map((x, i) =>
                      h('div', { key: i },
                        h('div', { style: { fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 5 } }, x.l),
                        h('div', { style: { fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.65, background: 'rgba(8,9,13,0.35)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-1)' } }, x.v)
                      )
                    )
                  )
                )
              )
            : h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 52, background: 'rgba(8,9,13,0.3)', border: '1px dashed var(--border-1)', borderRadius: 12, marginBottom: 16 } },
                h(UI.Icon, { name: 'journal', size: 38, color: 'var(--t4)' }),
                h('div', { style: { fontSize: 13.5, color: 'var(--t2)', marginTop: 12, marginBottom: 6, fontWeight: 500 } }, 'No journal entry for this date'),
                h('div', { style: { fontSize: 12, color: 'var(--t3)', marginBottom: 16 } }, 'Document your plan, bias, and end-of-day reflections'),
                h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, 'Write Entry')
              ),
          // Day's trades
          dayTrades.length > 0 && h('div', null,
            h('div', { className: 'section-heading' }, `Trades on ${selDate}`),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
              dayTrades.map(t => h('div', { key: t.id, style: { background: 'rgba(8,9,13,0.45)', border: '1px solid var(--border-1)', borderRadius: 8, padding: '9px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: 9 } },
                  h(UI.DirBadge, { dir: t.direction }),
                  h('span', { style: { fontSize: 13, fontWeight: 550, color: 'var(--t1)' } }, t.instrument),
                  t.setup && h('span', { className: 'badge badge-blue' }, t.setup),
                  h(UI.GradeBadge, { grade: t.tradeGrade })
                ),
                h('div', { style: { display: 'flex', gap: 12, alignItems: 'center' } },
                  h(UI.RText,  { value: t.rMultiple }),
                  h(UI.PLText, { value: t.profitLoss })
                )
              ))
            )
          )
        )
      )
    ),
    h(UI.Modal, { open: showForm, onClose: () => setShowForm(false), title: `Daily Journal — ${selDate}`, size: 'lg' },
      h(JournalForm, { existing: current, onSave: async j => { await upsertJournal(j); UI.toast('Journal saved', 'success'); setShowForm(false); }, onClose: () => setShowForm(false) })
    )
  );
}

// ============================================================
// SETTINGS PAGE
// ============================================================
function SettingsPage() {
  const { settings, saveSettings, exportData, importData, resetData, mistakes } = useApp();
  const [f,            setF]    = React.useState({ ...DEFAULT_SETTINGS });
  const [tab,          setTab]  = React.useState('general');
  const [confirmReset, setCR]   = React.useState(false);
  const [newSetup,     setNS]   = React.useState('');
  const [newConf,      setNC]   = React.useState('');
  const [newPOI,       setNP]   = React.useState('');
  const [loaded,       setLoaded] = React.useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Sync form state from context whenever settings loads or changes
  // This fixes the bug where webhook URL resets on page navigation
  React.useEffect(function() {
    if (settings && settings.id) {
      setF(Object.assign({}, DEFAULT_SETTINGS, settings));
      setLoaded(true);
    }
  }, [settings]);

  const addCustom = (key, val, clear) => {
    if (!val.trim()) return;
    const list = f[key] || [];
    if (!list.includes(val.trim())) set(key, [...list, val.trim()]);
    clear('');
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try { await importData(ev.target.result); UI.toast('Data imported successfully', 'success'); }
      catch { UI.toast('Import failed: invalid file', 'error'); }
    };
    reader.readAsText(file);
  };

  const PillList = ({ listKey, all, color }) =>
    h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 5 } },
      all.map((item, i) => {
        const isCustom = (f[listKey] || []).includes(item);
        return h('div', { key: i, style: { display: 'flex', alignItems: 'center', gap: 4, background: `${color}14`, border: `1px solid ${color}28`, borderRadius: 4, padding: '3px 8px' } },
          h('span', { style: { fontSize: 11.5, color } }, item),
          isCustom && h('span', { style: { cursor: 'pointer', color: 'var(--t4)' }, onClick: () => set(listKey, (f[listKey]||[]).filter(x => x !== item)) }, h(UI.Icon, { name: 'x', size: 10 }))
        );
      })
    );

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null, h('div', { className: 'page-title' }, 'Settings'), h('div', { className: 'page-subtitle' }, 'Configure your trading journal')),
      h('button', { className: 'btn btn-primary', onClick: async () => { await saveSettings(f); UI.toast('Settings saved', 'success'); } }, 'Save Settings')
    ),
    h('div', { className: 'page-tabs' },
      [{ id:'general', label:'General' }, { id:'trading', label:'Trading Concepts' }, { id:'data', label:'Data Management' }, { id:'discord', label:'Discord Webhook' }].map(t =>
        h('div', { key: t.id, className: `page-tab ${tab === t.id ? 'active' : ''}`, onClick: () => setTab(t.id) }, t.label)
      )
    ),
    h('div', { className: 'page-body' },

      tab === 'general' && h('div', { className: 'grid-2', style: { gap: 20, alignItems: 'flex-start' } },
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Preferences')),
          h('div', { className: 'card-body' },
            h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Currency'), h('select', { className: 'select-field', value: f.currency, onChange: e => set('currency', e.target.value) }, CURRENCIES.map(c => h('option', { key: c, value: c }, c)))),
            h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Timezone'), h('select', { className: 'select-field', value: f.timezone, onChange: e => set('timezone', e.target.value) }, ['America/New_York','America/Chicago','Europe/London','Europe/Zurich','Asia/Tokyo','Asia/Singapore','Australia/Sydney'].map(tz => h('option', { key: tz, value: tz }, tz)))),
            h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Default Risk %'), h('input', { className: 'input-field', type: 'number', step: 0.1, value: f.defaultRisk, onChange: e => set('defaultRisk', +e.target.value) })),
            h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Default Instrument'), h('select', { className: 'select-field', value: f.defaultInstrument, onChange: e => set('defaultInstrument', e.target.value) }, INSTRUMENTS.map(i => h('option', { key: i, value: i }, i))))
          )
        ),
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'About')),
          h('div', { className: 'card-body' },
            [{ l:'Application', v:'Funded Trading Journal' }, { l:'Version', v:'1.0.0' }, { l:'Storage', v:'IndexedDB (local browser)' }, { l:'Charts', v:'Recharts' }].map((x, i) =>
              h('div', { key: i, className: 'metric-row' }, h('span', { className: 'metric-name' }, x.l), h('span', { className: 'metric-val' }, x.v))
            ),
            h('div', { className: 'alert alert-info', style: { marginTop: 14 } }, h(UI.Icon, { name: 'info', size: 13 }), 'All data is stored locally. Export regularly to prevent data loss.')
          )
        )
      ),

      tab === 'trading' && h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } },
        ...[
          { title: 'Custom Setups',        key: 'customSetups',         all: [...SETUPS, ...(f.customSetups||[])],         val: newSetup, setVal: setNS, color: '#7aaff5' },
          { title: 'Custom Confirmations', key: 'customConfirmations',  all: [...CONFIRMATIONS, ...(f.customConfirmations||[])], val: newConf, setVal: setNC, color: '#2dce89' },
          { title: 'Custom POIs',          key: 'customPOIs',           all: [...POIS, ...(f.customPOIs||[])],             val: newPOI,  setVal: setNP, color: 'var(--cyan)' },
          { title: 'Mistake Types',        key: null,                   all: mistakes.map(m => m.name),                    val: null,    setVal: null,  color: '#f5365c' },
        ].map(({ title, key, all, val, setVal, color }) =>
          h('div', { key: title, className: 'glass-card' },
            h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, title), h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, `${all.length} total`)),
            h('div', { className: 'card-body' },
              key && h('div', { style: { display: 'flex', gap: 6, marginBottom: 10 } },
                h('input', { className: 'input-field', placeholder: `Add custom ${title.toLowerCase().replace('custom ', '')}…`, value: val, onChange: e => setVal(e.target.value), onKeyDown: e => e.key === 'Enter' && addCustom(key, val, setVal) }),
                h('button', { className: 'btn btn-secondary btn-sm', onClick: () => addCustom(key, val, setVal) }, h(UI.Icon, { name: 'plus', size: 13 }))
              ),
              h(PillList, { listKey: key || '', all, color })
            )
          )
        )
      ),

      tab === 'data' && h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' } },
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Export & Backup')),
          h('div', { className: 'card-body' },
            h('div', { style: { fontSize: 12.5, color: 'var(--t2)', marginBottom: 10, lineHeight: 1.55 } }, 'Export all trades, accounts, journals, and settings as a JSON backup file.'),
            h('button', { className: 'btn btn-secondary', style: { width: '100%', justifyContent: 'center', marginBottom: 14 }, onClick: exportData }, h(UI.Icon, { name: 'download', size: 14 }), 'Export JSON Backup'),
            h('hr', { className: 'section-divider' }),
            h('div', { style: { fontSize: 12.5, color: 'var(--t2)', marginBottom: 10, lineHeight: 1.55 } }, 'Import a previously exported JSON backup file.'),
            h('label', { htmlFor: 'import-file' },
              h('div', { className: 'btn btn-secondary', style: { width: '100%', justifyContent: 'center', cursor: 'pointer' } }, h(UI.Icon, { name: 'upload', size: 14 }), 'Import JSON Backup')
            ),
            h('input', { id: 'import-file', type: 'file', accept: '.json', style: { display: 'none' }, onChange: handleImport })
          )
        ),
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Danger Zone')),
          h('div', { className: 'card-body' },
            h('div', { className: 'alert alert-danger', style: { marginBottom: 14 } }, h(UI.Icon, { name: 'alert', size: 13 }), 'These actions are irreversible. Export a backup before proceeding.'),
            h('button', { className: 'btn btn-danger', style: { width: '100%', justifyContent: 'center' }, onClick: () => setCR(true) }, h(UI.Icon, { name: 'trash', size: 14 }), 'Reset All Data')
          )
        )
      ),
      tab === 'discord' && h('div', null,
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Discord Integration')),
          h('div', { className: 'card-body' },
            h(DiscordSettings, {
              settings: f,
              onChange: async function(updated) {
                setF(updated);
                // Auto-persist webhook settings to DB immediately so they survive navigation
                await saveSettings(updated);
              },
            })
          )
        )
      )
    ),
    h(UI.ConfirmModal, { open: confirmReset, onClose: () => setCR(false), onConfirm: async () => { await resetData(); UI.toast('All data has been reset', 'success'); }, title: 'Reset All Data', message: 'This will permanently delete all trades, accounts, journals, playbook entries, and reviews. This cannot be undone. Are you absolutely sure?' })
  );
}

window.MistakesPage  = MistakesPage;
window.PlaybookPage  = PlaybookPage;
window.ReviewsPage   = ReviewsPage;
window.JournalPage   = JournalPage;
window.SettingsPage  = SettingsPage;
