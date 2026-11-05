var FIN_COLORS = ['#93c5fd', '#34d399', '#fbbf24', '#f87171', '#c4b5fd', '#67e8f9', '#fb923c', '#a3e635', '#f9a8d4'];
var FIN_EXPENSE = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Education', 'Other'];
var FIN_INCOME = ['Salary', 'Trading Payout', 'Business', 'Gift', 'Other'];
var FIN_ACCOUNT_TYPES = ['Cash', 'Bank', 'E-Wallet', 'Savings', 'Other'];

function finMoney(v, cur) {
  var n = Number(v) || 0;
  var sign = n < 0 ? '-' : '';
  if (cur === 'USD') return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sign + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
}

function finShort(v, cur) {
  var a = Math.abs(v);
  if (cur === 'USD') return '$' + (a >= 1000 ? (a / 1000).toFixed(1) + 'k' : a);
  if (a >= 1000000) return (a / 1000000).toFixed(a % 1000000 === 0 ? 0 : 1) + ' jt';
  if (a >= 1000) return Math.round(a / 1000) + ' rb';
  return String(a);
}

function finToday() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function finShiftMonth(ym, delta) {
  var p = ym.split('-');
  var d = new Date(+p[0], +p[1] - 1 + delta, 1);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

function finMonthName(ym, short) {
  var p = ym.split('-');
  return new Date(+p[0], +p[1] - 1, 1).toLocaleString('en-US', short ? { month: 'short' } : { month: 'long', year: 'numeric' });
}

function finTip(cur) {
  return function(props) {
    if (!props.active || !props.payload || !props.payload.length) return null;
    return h('div', { className: 'chart-tip' },
      props.label ? h('div', { className: 'chart-tip-label' }, props.label) : null,
      props.payload.map(function(p, i) {
        return h('div', { key: i, className: 'chart-tip-row' },
          h('span', { className: 'chart-tip-dot', style: { background: p.color || (p.payload && p.payload.fill) } }),
          h('span', null, (p.name || '') + '  ' + finMoney(p.value, cur))
        );
      })
    );
  };
}

function FinTxForm({ tx, accounts, txs, onSave, onClose }) {
  var first = accounts[0] ? accounts[0].id : '';
  var [type, setType] = React.useState(tx && tx.type ? tx.type : 'expense');
  var [amount, setAmount] = React.useState(tx && tx.amount ? String(tx.amount) : '');
  var [date, setDate] = React.useState(tx && tx.date ? tx.date : finToday());
  var [accountId, setAccountId] = React.useState(tx && tx.accountId ? tx.accountId : first);
  var [toAccountId, setToAccountId] = React.useState(tx && tx.toAccountId ? tx.toAccountId : (accounts[1] ? accounts[1].id : ''));
  var [category, setCategory] = React.useState(tx && tx.category ? tx.category : '');
  var [custom, setCustom] = React.useState('');
  var [note, setNote] = React.useState(tx && tx.note ? tx.note : '');

  var base = type === 'income' ? FIN_INCOME : FIN_EXPENSE;
  var used = txs.filter(function(t) { return t.type === type && t.category; }).map(function(t) { return t.category; });
  var cats = base.concat(used.filter(function(c, i) { return base.indexOf(c) < 0 && used.indexOf(c) === i; }));
  var cat = category && (cats.indexOf(category) >= 0 || category === '__custom') ? category : cats[0];

  function save() {
    var amt = parseFloat(amount);
    if (!(amt > 0)) { UI.toast('Enter an amount above 0', 'error'); return; }
    if (!accountId) { UI.toast('Choose an account', 'error'); return; }
    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) { UI.toast('Choose two different accounts', 'error'); return; }
    var finalCat = type === 'transfer' ? '' : (cat === '__custom' ? custom.trim() : cat);
    if (type !== 'transfer' && !finalCat) { UI.toast('Enter a category', 'error'); return; }
    onSave({
      id: tx && tx.id ? tx.id : 'ftx-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      type: type, amount: amt, date: date, accountId: accountId,
      toAccountId: type === 'transfer' ? toAccountId : '',
      category: finalCat, note: note.trim(),
      createdAt: tx && tx.createdAt ? tx.createdAt : new Date().toISOString(),
    });
    onClose();
  }

  var accOptions = accounts.map(function(a) { return { value: a.id, label: a.name }; });

  return h('div', null,
    h('div', { className: 'input-group' },
      h('div', { className: 'toggle-group', style: { display: 'inline-flex' } },
        ['expense', 'income', 'transfer'].map(function(t) {
          return h('div', { key: t, className: 'toggle-opt' + (type === t ? ' active' : ''), onClick: function() { setType(t); } }, t.charAt(0).toUpperCase() + t.slice(1));
        })
      )
    ),
    h('div', { className: 'form-row' },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Amount'),
        h('input', { className: 'input-field', type: 'number', min: 0, step: 'any', placeholder: '0', autoFocus: true, value: amount, onChange: function(e) { setAmount(e.target.value); } })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Date'),
        h('input', { className: 'input-field', type: 'date', value: date, onChange: function(e) { setDate(e.target.value); } })
      )
    ),
    h('div', { className: 'form-row' },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, type === 'transfer' ? 'From' : 'Account'),
        h(UI.CustomDropdown, { value: accountId, onChange: setAccountId, options: accOptions })
      ),
      type === 'transfer'
        ? h('div', { className: 'input-group' },
            h('label', { className: 'input-label' }, 'To'),
            h(UI.CustomDropdown, { value: toAccountId, onChange: setToAccountId, options: accOptions })
          )
        : h('div', { className: 'input-group' },
            h('label', { className: 'input-label' }, 'Category'),
            h(UI.CustomDropdown, {
              value: cat, onChange: setCategory,
              options: cats.map(function(c) { return { value: c, label: c }; }).concat({ value: '__custom', label: 'Custom' }),
            })
          )
    ),
    type !== 'transfer' && cat === '__custom' && h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Custom category'),
      h('input', { className: 'input-field', value: custom, maxLength: 30, onChange: function(e) { setCustom(e.target.value); } })
    ),
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Note'),
      h('input', { className: 'input-field', value: note, maxLength: 80, placeholder: 'Optional', onChange: function(e) { setNote(e.target.value); } })
    ),
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } },
      h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
      h('button', { className: 'btn btn-primary', onClick: save }, tx && tx.id ? 'Update' : 'Save')
    )
  );
}

function FinAccountForm({ acc, onSave, onClose }) {
  var [name, setName] = React.useState(acc ? acc.name : '');
  var [type, setType] = React.useState(acc ? acc.type : 'Bank');
  var [opening, setOpening] = React.useState(acc ? String(acc.opening || 0) : '');

  function save() {
    if (!name.trim()) { UI.toast('Enter an account name', 'error'); return; }
    onSave({
      id: acc ? acc.id : 'facc-' + Date.now(),
      name: name.trim(), type: type, opening: parseFloat(opening) || 0,
      createdAt: acc ? acc.createdAt : new Date().toISOString(),
    });
    onClose();
  }

  return h('div', null,
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Account name'),
      h('input', { className: 'input-field', value: name, autoFocus: true, maxLength: 40, placeholder: 'e.g. BCA, Cash, GoPay', onChange: function(e) { setName(e.target.value); } })
    ),
    h('div', { className: 'form-row' },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Type'),
        h(UI.CustomDropdown, { value: type, onChange: setType, options: FIN_ACCOUNT_TYPES.map(function(t) { return { value: t, label: t }; }) })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Opening balance'),
        h('input', { className: 'input-field', type: 'number', step: 'any', placeholder: '0', value: opening, onChange: function(e) { setOpening(e.target.value); } })
      )
    ),
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } },
      h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
      h('button', { className: 'btn btn-primary', onClick: save }, acc ? 'Update' : 'Save')
    )
  );
}

function FinancePage() {
  var R = window.Recharts;
  var [loaded, setLoaded] = React.useState(false);
  var [accounts, setAccounts] = React.useState([]);
  var [txs, setTxs] = React.useState([]);
  var [cur, setCur] = React.useState('IDR');
  var [month, setMonth] = React.useState(Calc.currentMonthKey());
  var [view, setView] = React.useState('expense');
  var [txModal, setTxModal] = React.useState(null);
  var [accModal, setAccModal] = React.useState(null);
  var [delTx, setDelTx] = React.useState(null);
  var [delAcc, setDelAcc] = React.useState(null);

  React.useEffect(function() {
    var live = true;
    Promise.all([
      DB.getAll('finance_accounts'),
      DB.getAll('finance_tx'),
      DB.get('finance_prefs', 'prefs').catch(function() { return null; }),
    ]).then(function(r) {
      if (!live) return;
      setAccounts(r[0] || []);
      setTxs(r[1] || []);
      if (r[2] && r[2].currency) setCur(r[2].currency);
      setLoaded(true);
    }).catch(function() { if (live) setLoaded(true); });
    return function() { live = false; };
  }, []);

  React.useEffect(function() {
    function onAdd() {
      if (accounts.length === 0) setAccModal({});
      else setTxModal({});
    }
    window.addEventListener('openFinanceTx', onAdd);
    return function() { window.removeEventListener('openFinanceTx', onAdd); };
  }, [accounts.length]);

  async function changeCurrency(v) {
    setCur(v);
    await DB.put('finance_prefs', { id: 'prefs', currency: v });
  }

  async function saveTx(tx) {
    await DB.put('finance_tx', tx);
    setTxs(function(prev) { return prev.filter(function(t) { return t.id !== tx.id; }).concat(tx); });
  }

  async function removeTx(id) {
    await DB.delete('finance_tx', id);
    setTxs(function(prev) { return prev.filter(function(t) { return t.id !== id; }); });
    setDelTx(null);
  }

  async function saveAccount(a) {
    await DB.put('finance_accounts', a);
    setAccounts(function(prev) { return prev.filter(function(x) { return x.id !== a.id; }).concat(a); });
  }

  async function removeAccount(id) {
    var related = txs.filter(function(t) { return t.accountId === id || t.toAccountId === id; });
    await Promise.all(related.map(function(t) { return DB.delete('finance_tx', t.id); }));
    await DB.delete('finance_accounts', id);
    setTxs(function(prev) { return prev.filter(function(t) { return t.accountId !== id && t.toAccountId !== id; }); });
    setAccounts(function(prev) { return prev.filter(function(a) { return a.id !== id; }); });
    setDelAcc(null);
  }

  var balances = React.useMemo(function() {
    var map = {};
    accounts.forEach(function(a) { map[a.id] = a.opening || 0; });
    txs.forEach(function(t) {
      if (t.type === 'income' && map[t.accountId] !== undefined) map[t.accountId] += t.amount;
      if (t.type === 'expense' && map[t.accountId] !== undefined) map[t.accountId] -= t.amount;
      if (t.type === 'transfer') {
        if (map[t.accountId] !== undefined) map[t.accountId] -= t.amount;
        if (map[t.toAccountId] !== undefined) map[t.toAccountId] += t.amount;
      }
    });
    return map;
  }, [accounts, txs]);

  var totalBalance = accounts.reduce(function(s, a) { return s + (balances[a.id] || 0); }, 0);

  function sumFor(ym, type) {
    return txs.filter(function(t) { return t.type === type && t.date && t.date.slice(0, 7) === ym; })
      .reduce(function(s, t) { return s + t.amount; }, 0);
  }

  var income = sumFor(month, 'income');
  var expense = sumFor(month, 'expense');
  var net = income - expense;

  var monthTxs = txs.filter(function(t) { return t.date && t.date.slice(0, 7) === month; })
    .sort(function(a, b) { return (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')); });

  var breakdown = React.useMemo(function() {
    var by = {};
    txs.forEach(function(t) {
      if (t.type !== view || !t.date || t.date.slice(0, 7) !== month) return;
      by[t.category || 'Other'] = (by[t.category || 'Other'] || 0) + t.amount;
    });
    return Object.keys(by).map(function(k) { return { name: k, value: by[k] }; })
      .sort(function(a, b) { return b.value - a.value; });
  }, [txs, view, month]);
  var breakdownTotal = breakdown.reduce(function(s, d) { return s + d.value; }, 0);

  var trend = [];
  for (var i = 5; i >= 0; i--) {
    var ym = finShiftMonth(month, -i);
    trend.push({ month: finMonthName(ym, true), Income: sumFor(ym, 'income'), Expense: sumFor(ym, 'expense') });
  }

  var accName = function(id) { var a = accounts.find(function(x) { return x.id === id; }); return a ? a.name : ''; };
  var tip = finTip(cur);

  if (!loaded) return h('div', { className: 'page-body', style: { paddingTop: 80, display: 'flex', justifyContent: 'center' } }, h('div', { className: 'spinner' }));

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null,
        h('div', { className: 'page-title' }, 'Finance'),
        h('div', { className: 'page-subtitle' }, 'Income, expenses and balances')
      ),
      h('div', { className: 'toggle-group' },
        ['IDR', 'USD'].map(function(c) {
          return h('div', { key: c, className: 'toggle-opt' + (cur === c ? ' active' : ''), onClick: function() { changeCurrency(c); } }, c === 'IDR' ? 'Rupiah' : 'USD');
        })
      )
    ),

    h('div', { className: 'page-body' },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 } },
        h('button', { className: 'btn btn-secondary btn-icon', onClick: function() { setMonth(finShiftMonth(month, -1)); } },
          h(UI.Icon, { name: 'chevronL', size: 14 })),
        h('div', { style: { fontSize: 15, fontWeight: 600, minWidth: 150, textAlign: 'center' } }, finMonthName(month)),
        h('button', { className: 'btn btn-secondary btn-icon', onClick: function() { setMonth(finShiftMonth(month, 1)); } },
          h(UI.Icon, { name: 'chevronR', size: 14 }))
      ),

      h('div', { className: 'grid-stats mb-24' },
        h('div', { className: 'stat-block' },
          h('div', { className: 'stat-label' }, 'Total Balance'),
          h('div', { className: 'stat-value' }, finMoney(totalBalance, cur)),
          h('div', { className: 'stat-sub' }, accounts.length + (accounts.length === 1 ? ' account' : ' accounts'))
        ),
        h('div', { className: 'stat-block' },
          h('div', { className: 'stat-label' }, 'Income'),
          h('div', { className: 'stat-value positive' }, finMoney(income, cur)),
          h('div', { className: 'stat-sub' }, finMonthName(month))
        ),
        h('div', { className: 'stat-block' },
          h('div', { className: 'stat-label' }, 'Expense'),
          h('div', { className: 'stat-value negative' }, finMoney(expense, cur)),
          h('div', { className: 'stat-sub' }, finMonthName(month))
        ),
        h('div', { className: 'stat-block' },
          h('div', { className: 'stat-label' }, 'Net'),
          h('div', { className: 'stat-value ' + (net >= 0 ? 'positive' : 'negative') }, finMoney(Math.abs(net), cur)),
          h('div', { className: 'stat-sub' }, net >= 0 ? 'Saved this month' : 'Overspent this month')
        )
      ),

      h('div', { className: 'grid-2 mb-24', style: { alignItems: 'flex-start' } },
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' },
            h('span', { className: 'card-title' }, 'By category'),
            h('div', { className: 'toggle-group' },
              ['expense', 'income'].map(function(v) {
                return h('div', { key: v, className: 'toggle-opt' + (view === v ? ' active' : ''), style: { padding: '4px 12px', fontSize: 11.5 }, onClick: function() { setView(v); } }, v === 'expense' ? 'Expense' : 'Income');
              })
            )
          ),
          h('div', { className: 'card-body' },
            breakdown.length === 0
              ? h('div', { style: { height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12.5 } }, 'No ' + view + ' recorded this month')
              : h('div', { style: { display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' } },
                  h('div', { style: { width: 190, height: 190, flexShrink: 0 } },
                    h(R.ResponsiveContainer, { width: '100%', height: '100%' },
                      h(R.PieChart, null,
                        h(R.Pie, { data: breakdown, dataKey: 'value', nameKey: 'name', innerRadius: 55, outerRadius: 88, paddingAngle: 2, stroke: 'none' },
                          breakdown.map(function(d, i) { return h(R.Cell, { key: d.name, fill: FIN_COLORS[i % FIN_COLORS.length] }); })
                        ),
                        h(R.Tooltip, { content: tip })
                      )
                    )
                  ),
                  h('div', { style: { flex: 1, minWidth: 160 } },
                    breakdown.map(function(d, i) {
                      return h('div', { key: d.name, style: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', fontSize: 12.5 } },
                        h('span', { style: { width: 9, height: 9, borderRadius: 3, background: FIN_COLORS[i % FIN_COLORS.length], flexShrink: 0 } }),
                        h('span', { style: { flex: 1, color: 'var(--t2)' } }, d.name),
                        h('span', { style: { color: 'var(--t1)', fontWeight: 600 } }, finMoney(d.value, cur)),
                        h('span', { style: { color: 'var(--t3)', width: 38, textAlign: 'right' } }, Math.round((d.value / breakdownTotal) * 100) + '%')
                      );
                    })
                  )
                )
          )
        ),

        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' },
            h('span', { className: 'card-title' }, 'Accounts'),
            h('button', { className: 'btn btn-ghost btn-sm', onClick: function() { setAccModal({}); } }, 'Add account')
          ),
          h('div', { className: 'card-body' },
            accounts.length === 0
              ? h('div', { style: { height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12.5 } }, 'Add an account to start recording')
              : accounts.slice().sort(function(a, b) { return (balances[b.id] || 0) - (balances[a.id] || 0); }).map(function(a) {
                  return h('div', { key: a.id, className: 'metric-row',
                    onContextMenu: function(e) {
                      UI.showContextMenu(e, [
                        { label: 'Edit Account', action: function() { setAccModal(a); } },
                        { label: 'Delete Account', danger: true, action: function() { setDelAcc(a.id); } },
                      ]);
                    } },
                    h('div', null,
                      h('div', { style: { fontSize: 13.5, color: 'var(--t1)', fontWeight: 500 } }, a.name),
                      h('div', { style: { fontSize: 11, color: 'var(--t3)', marginTop: 2 } }, a.type)
                    ),
                    h('span', { className: 'metric-val', style: { color: (balances[a.id] || 0) < 0 ? 'var(--red)' : 'var(--t1)' } }, finMoney(balances[a.id] || 0, cur))
                  );
                })
          )
        )
      ),

      h('div', { className: 'grid-2', style: { alignItems: 'flex-start' } },
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Cash flow'), h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, 'Last 6 months')),
          h('div', { style: { padding: '14px 8px 8px' } },
            h(R.ResponsiveContainer, { width: '100%', height: 240 },
              h(R.BarChart, { data: trend, margin: { left: 0, right: 12, top: 4, bottom: 0 } },
                h(R.CartesianGrid, { stroke: 'rgba(255,255,255,0.06)', vertical: false }),
                h(R.XAxis, { dataKey: 'month', tick: { fontSize: 11, fill: 'var(--t3)' }, tickLine: false, axisLine: false }),
                h(R.YAxis, { tick: { fontSize: 10, fill: 'var(--t4)' }, tickLine: false, axisLine: false, width: 52, tickFormatter: function(v) { return finShort(v, cur); } }),
                h(R.Tooltip, { content: tip, cursor: { fill: 'rgba(255,255,255,0.04)' } }),
                h(R.Bar, { dataKey: 'Income', fill: '#34d399', radius: [4, 4, 0, 0], maxBarSize: 22 }),
                h(R.Bar, { dataKey: 'Expense', fill: '#f87171', radius: [4, 4, 0, 0], maxBarSize: 22 })
              )
            )
          )
        ),

        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Transactions'), h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, monthTxs.length + ' this month')),
          h('div', { className: 'card-body', style: { paddingTop: 6, paddingBottom: 10, maxHeight: 320, overflowY: 'auto' } },
            monthTxs.length === 0
              ? h('div', { style: { height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12.5 } }, 'No transactions this month')
              : monthTxs.map(function(t) {
                  var isTransfer = t.type === 'transfer';
                  return h('div', { key: t.id, className: 'metric-row',
                    onContextMenu: function(e) {
                      UI.showContextMenu(e, [
                        { label: 'Edit', action: function() { setTxModal(t); } },
                        { label: 'Delete', danger: true, action: function() { setDelTx(t.id); } },
                      ]);
                    } },
                    h('div', { style: { minWidth: 0 } },
                      h('div', { style: { fontSize: 13, color: 'var(--t1)' } }, isTransfer ? 'Transfer' : t.category),
                      h('div', { style: { fontSize: 11, color: 'var(--t3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                        t.date.slice(5) + '   ' + (isTransfer ? accName(t.accountId) + ' to ' + accName(t.toAccountId) : accName(t.accountId)) + (t.note ? '   ' + t.note : ''))
                    ),
                    h('span', { className: 'metric-val', style: { color: isTransfer ? 'var(--t2)' : (t.type === 'income' ? 'var(--green)' : 'var(--red)') } }, finMoney(t.amount, cur))
                  );
                })
          )
        )
      )
    ),

    txModal && h(UI.Modal, { open: true, onClose: function() { setTxModal(null); }, title: txModal.id ? 'Edit Transaction' : 'New Transaction' },
      h(FinTxForm, { tx: txModal, accounts: accounts, txs: txs, onSave: saveTx, onClose: function() { setTxModal(null); } })
    ),
    accModal && h(UI.Modal, { open: true, onClose: function() { setAccModal(null); }, title: accModal.id ? 'Edit Account' : 'New Account' },
      h(FinAccountForm, { acc: accModal.id ? accModal : null, onSave: saveAccount, onClose: function() { setAccModal(null); } })
    ),
    h(UI.ConfirmModal, { open: !!delTx, onClose: function() { setDelTx(null); }, onConfirm: function() { removeTx(delTx); }, title: 'Delete transaction', message: 'This transaction will be removed and the account balance is recalculated.' }),
    h(UI.ConfirmModal, { open: !!delAcc, onClose: function() { setDelAcc(null); }, onConfirm: function() { removeAccount(delAcc); }, title: 'Delete account', message: 'The account and every transaction recorded on it will be deleted.' })
  );
}

window.FinancePage = FinancePage;
