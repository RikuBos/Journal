function finTip(cur, labelOf) {
  return function(props) {
    if (!props.active || !props.payload || !props.payload.length) return null;
    var label = labelOf ? labelOf(props.payload[0]) : props.label;
    return h('div', { className: 'chart-tip' },
      label ? h('div', { className: 'chart-tip-label' }, label) : null,
      props.payload.map(function(p, i) {
        return h('div', { key: i, className: 'chart-tip-row' },
          h('span', { className: 'chart-tip-dot', style: { background: p.color || (p.payload && p.payload.fill) || '#93c5fd' } }),
          h('span', null, (p.name || '') + '   ' + finMoney(p.value, cur))
        );
      })
    );
  };
}

function FinDelta({ change, invert, text }) {
  if (text) return h('div', { className: 'fin-delta ' + text.cls }, text.label);
  if (change === null || change === undefined) return h('div', { className: 'fin-delta flat' }, 'No data for last month');
  var up = change >= 0;
  var good = invert ? !up : up;
  var cls = Math.abs(change) < 0.05 ? 'flat' : (good ? 'up' : 'down');
  return h('div', { className: 'fin-delta ' + cls }, (up ? 'Up ' : 'Down ') + Math.abs(change).toFixed(1) + '% vs last month');
}

function FinStats({ rows, accounts, cur }) {
  var o = finOverview(rows, accounts);
  var rateText = null;
  if (o.savingsDelta !== null) {
    rateText = { cls: Math.abs(o.savingsDelta) < 0.05 ? 'flat' : (o.savingsDelta >= 0 ? 'up' : 'down'),
      label: (o.savingsDelta >= 0 ? 'Up ' : 'Down ') + Math.abs(o.savingsDelta).toFixed(1) + ' pts vs last month' };
  } else {
    rateText = { cls: 'flat', label: 'No data for last month' };
  }
  return h('div', { className: 'grid-stats mb-24' },
    h('div', { className: 'stat-block fin-stat' },
      h('div', { className: 'stat-label' }, 'Total Net Worth'),
      h('div', { className: 'stat-value ' + (o.netWorth < 0 ? 'negative' : '') }, finMoney(o.netWorth, cur)),
      o.hasAccounts ? h(FinDelta, { change: o.netChange }) : h(FinDelta, { text: { cls: 'flat', label: 'Add an account to track net worth' } })
    ),
    h('div', { className: 'stat-block fin-stat' },
      h('div', { className: 'stat-label' }, 'Total Income'),
      h('div', { className: 'stat-value positive' }, finMoney(o.income, cur)),
      h(FinDelta, { change: o.incomeChange })
    ),
    h('div', { className: 'stat-block fin-stat' },
      h('div', { className: 'stat-label' }, 'Total Expenses'),
      h('div', { className: 'stat-value negative' }, finMoney(o.expense, cur)),
      h(FinDelta, { change: o.expenseChange, invert: true })
    ),
    h('div', { className: 'stat-block fin-stat' },
      h('div', { className: 'stat-label' }, 'Savings Rate'),
      h('div', { className: 'stat-value ' + (o.savingsRate < 0 ? 'negative' : '') }, o.savingsRate.toFixed(1) + '%'),
      h(FinDelta, { text: rateText })
    )
  );
}

function FinTrend({ rows, accounts, cur }) {
  var R = window.Recharts;
  var [range, setRange] = React.useState('1M');
  var points = React.useMemo(function() { return finTrend(rows, range, accounts); }, [rows, accounts, range]);
  var vals = points.map(function(p) { return p.value; });
  var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
  var pad = Math.max((max - min) * 0.2, Math.abs(max) * 0.02, 1);
  var up = points.length ? points[points.length - 1].value >= points[0].value : true;
  var color = up ? '#60a5fa' : '#f87171';
  var gid = 'finTrend' + (up ? 'Up' : 'Down');
  return h('div', { className: 'glass-card fin-card' },
    h('div', { className: 'card-header' },
      h('span', { className: 'card-title' }, 'Net Worth Trend'),
      h('div', { className: 'toggle-group' },
        ['1W', '1M', '3M', '6M', '1Y', 'ALL'].map(function(r) {
          return h('div', { key: r, className: 'toggle-opt' + (range === r ? ' active' : ''), style: { padding: '4px 11px', fontSize: 11.5 }, onClick: function() { setRange(r); } }, r);
        })
      )
    ),
    h('div', { className: 'fin-chart-fill' },
      h('div', { className: 'fin-chart-inner' },
      h(R.ResponsiveContainer, { width: '100%', height: '100%' },
        h(R.AreaChart, { data: points, margin: { left: 0, right: 16, top: 8, bottom: 0 } },
          h('defs', null,
            h('linearGradient', { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 },
              h('stop', { offset: '0%', stopColor: color, stopOpacity: 0.32 }),
              h('stop', { offset: '100%', stopColor: color, stopOpacity: 0 })
            )
          ),
          h(R.CartesianGrid, { stroke: 'rgba(255,255,255,0.06)', vertical: false }),
          h(R.XAxis, { dataKey: 'label', tick: { fontSize: 10.5, fill: 'var(--t3)' }, tickLine: false, axisLine: false, minTickGap: 32 }),
          h(R.YAxis, { domain: [Math.floor(min - pad), Math.ceil(max + pad)], tick: { fontSize: 10.5, fill: 'var(--t3)' }, tickLine: false, axisLine: false, width: 58, tickFormatter: function(v) { return finShort(v, cur); } }),
          h(R.Tooltip, { content: finTip(cur, function(p) { return p.payload && p.payload.key ? finDateLabel(p.payload.key) : ''; }) }),
          h(R.Area, { type: 'monotone', dataKey: 'value', name: 'Net worth', stroke: color, strokeWidth: 2.5, fill: 'url(#' + gid + ')', dot: false, activeDot: { r: 4, strokeWidth: 0, fill: color } })
        )
      )
      )
    )
  );
}

function FinBreakdown({ rows, cur }) {
  var R = window.Recharts;
  var [period, setPeriod] = React.useState('this_month');
  var data = React.useMemo(function() { return finBreakdown(rows, period); }, [rows, period]);
  var options = [
    { value: 'this_month', label: 'This month' }, { value: 'last_month', label: 'Last month' },
    { value: 'last_3', label: 'Last 3 months' }, { value: 'this_year', label: 'This year' }, { value: 'all', label: 'All time' },
  ];
  return h('div', { className: 'glass-card fin-card' },
    h('div', { className: 'card-header' },
      h('span', { className: 'card-title' }, 'Expense Breakdown'),
      h(UI.CustomDropdown, { value: period, onChange: setPeriod, options: options })
    ),
    h('div', { className: 'card-body' },
      data.list.length === 0
        ? h('div', { className: 'fin-empty-chart' }, 'No expenses in this period')
        : h('div', null,
            h('div', { style: { height: 190 } },
              h(R.ResponsiveContainer, { width: '100%', height: '100%' },
                h(R.PieChart, null,
                  h(R.Pie, { data: data.list, dataKey: 'value', nameKey: 'name', innerRadius: 58, outerRadius: 90, paddingAngle: 2, stroke: 'none' },
                    data.list.map(function(d, i) { return h(R.Cell, { key: d.name, fill: finCategoryColor(d.name, i) }); })
                  ),
                  h(R.Tooltip, { content: finTip(cur) })
                )
              )
            ),
            h('div', { className: 'fin-legend' },
              data.list.map(function(d, i) {
                return h('div', { key: d.name, className: 'fin-legend-row' },
                  h('span', { className: 'fin-dot', style: { background: finCategoryColor(d.name, i) } }),
                  h('span', { className: 'fin-legend-name' }, d.name),
                  h('span', { className: 'fin-legend-amount' }, finMoney(d.value, cur)),
                  h('span', { className: 'fin-legend-pct' }, ((d.value / data.total) * 100).toFixed(1) + '%')
                );
              })
            )
          )
    )
  );
}

function FinMonthly({ rows, cur }) {
  var R = window.Recharts;
  var [count, setCount] = React.useState(6);
  var data = React.useMemo(function() { return finMonthly(rows, count); }, [rows, count]);
  return h('div', { className: 'glass-card fin-card' },
    h('div', { className: 'card-header' },
      h('span', { className: 'card-title' }, 'Monthly Summary'),
      h('div', { className: 'toggle-group' },
        [6, 12].map(function(n) {
          return h('div', { key: n, className: 'toggle-opt' + (count === n ? ' active' : ''), style: { padding: '4px 11px', fontSize: 11.5 }, onClick: function() { setCount(n); } }, n + 'M');
        })
      )
    ),
    h('div', { style: { padding: '14px 6px 8px' } },
      h(R.ResponsiveContainer, { width: '100%', height: 300 },
        h(R.BarChart, { data: data, margin: { left: 0, right: 12, top: 4, bottom: 0 } },
          h(R.CartesianGrid, { stroke: 'rgba(255,255,255,0.06)', vertical: false }),
          h(R.XAxis, { dataKey: 'label', tick: { fontSize: 11, fill: 'var(--t3)' }, tickLine: false, axisLine: false }),
          h(R.YAxis, { tick: { fontSize: 10.5, fill: 'var(--t3)' }, tickLine: false, axisLine: false, width: 58, tickFormatter: function(v) { return finShort(v, cur); } }),
          h(R.Tooltip, { content: finTip(cur, function(p) { return p.payload && p.payload.key ? finMonthLabel(p.payload.key) : ''; }), cursor: { fill: 'rgba(255,255,255,0.04)' } }),
          h(R.Bar, { dataKey: 'Income', fill: '#34d399', radius: [4, 4, 0, 0], maxBarSize: 22 }),
          h(R.Bar, { dataKey: 'Expenses', fill: '#f87171', radius: [4, 4, 0, 0], maxBarSize: 22 })
        )
      )
    )
  );
}

function FinRecent({ rows, cur, onViewAll, onEdit, onDelete }) {
  var recent = rows.slice(0, 10);
  return h('div', { className: 'glass-card fin-card fin-recent-card' },
    h('div', { className: 'card-header' },
      h('span', { className: 'card-title' }, 'Recent Transactions'),
      h('button', { className: 'btn btn-ghost btn-sm', onClick: onViewAll }, 'View All')
    ),
    h('div', { className: 'fin-recent-wrap' },
      h('div', { className: 'fin-recent-scroll card-body' },
        recent.length === 0
          ? h('div', { className: 'fin-empty-chart' }, 'No transactions yet')
          : recent.map(function(r) {
              return h('div', { key: r.id, className: 'fin-recent-row',
                onContextMenu: function(e) {
                  UI.showContextMenu(e, [
                    { label: 'Edit', action: function() { onEdit(r); } },
                    { label: 'Delete', danger: true, action: function() { onDelete(r); } },
                  ]);
                } },
                h('div', { style: { minWidth: 0 } },
                  h('div', { className: 'fin-recent-name' }, r.category),
                  h('div', { className: 'fin-recent-sub' }, finDateLabel(r.transaction_date) + (finTimeOf(r) ? '   ' + finTimeOf(r) : ''))
                ),
                h('span', { className: 'fin-amount ' + (r.type === 'income' ? 'income' : 'expense') }, finMoney(r.amount, cur))
              );
            })
      )
    )
  );
}


var FIN_WALLET = { top: 22, step: 46, cardH: 170, pocket: 104, width: 340, minStage: 300 };

function FinAccountModal({ account, owner, onClose, onSave, onDelete, nextColor }) {
  var editing = !!(account && account.id);
  var [name, setName] = React.useState(account ? account.name : '');
  var [balance, setBalance] = React.useState(account ? String(account.initial_balance) : '0');
  var [asOf, setAsOf] = React.useState(account ? account.balance_as_of : finToday());
  var [color, setColor] = React.useState(account ? account.color : nextColor);
  var [errors, setErrors] = React.useState({});
  var [serverError, setServerError] = React.useState('');
  var [busy, setBusy] = React.useState(false);
  var nameOptions = FIN_ACCOUNT_NAMES.concat(account && FIN_ACCOUNT_NAMES.indexOf(account.name) < 0 ? [account.name] : []).map(function(n) { return { value: n, label: n }; });

  async function submit() {
    var e = {};
    var n = name.trim();
    var b = Number(balance);
    if (!n) e.name = 'Choose an account';
    if (balance === '' || !isFinite(b) || b < 0) e.balance = 'Enter 0 or more';
    else if (b >= 1e12) e.balance = 'Amount is too large';
    if (!asOf || isNaN(finParse(asOf).getTime())) e.asOf = 'Choose a date';
    else if (asOf > finToday()) e.asOf = 'The date cannot be in the future';
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    setServerError('');
    try {
      await onSave({ name: n, initial_balance: Math.round(b * 100) / 100, balance_as_of: asOf, color: color }, editing ? account.id : null);
      onClose();
    } catch (err) {
      var m = err && err.message ? err.message : 'Could not save the account';
      setServerError(/balance_as_of/.test(m) ? m + '. Run supabase/migrations/20261122_finance_balance_logic.sql in the Supabase SQL Editor.' : m);
      setBusy(false);
    }
  }

  return h(UI.Modal, { open: true, onClose: onClose, title: editing ? 'Edit Account' : 'Add Account' },
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Account name'),
      h(UI.CustomDropdown, { value: name, onChange: setName, placeholder: 'Select account', options: nameOptions }),
      errors.name && h('div', { className: 'input-hint', style: { color: 'var(--red)' } }, errors.name)
    ),
    h('div', { className: 'form-row' },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Account holder'),
        h('input', { className: 'input-field', value: owner, disabled: true, readOnly: true }),
        h('div', { className: 'input-hint' }, 'Taken from your profile username.')
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Initial balance'),
        h('input', { className: 'input-field', type: 'number', min: 0, step: 'any', value: balance, onChange: function(e) { setBalance(e.target.value); } }),
        errors.balance && h('div', { className: 'input-hint', style: { color: 'var(--red)' } }, errors.balance)
      )
    ),
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Balance as of'),
      h('input', { className: 'input-field', type: 'date', max: finToday(), value: asOf, onChange: function(e) { setAsOf(e.target.value); } }),
      errors.asOf ? h('div', { className: 'input-hint', style: { color: 'var(--red)' } }, errors.asOf) : h('div', { className: 'input-hint' }, 'Only transactions on or after this date change the balance.')
    ),
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Card color'),
      h('div', { className: 'fin-swatches' },
        FIN_ACCOUNT_COLORS.map(function(c) {
          return h('button', { key: c, type: 'button', 'aria-label': c, className: 'fin-swatch' + (color === c ? ' active' : ''), style: { background: c }, onClick: function() { setColor(c); } });
        })
      )
    ),
    serverError && h('div', { className: 'alert alert-danger' }, serverError),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: 8 } },
      editing ? h('button', { className: 'btn btn-danger', onClick: function() { onDelete(account); }, disabled: busy }, 'Delete') : h('span'),
      h('div', { style: { display: 'flex', gap: 8 } },
        h('button', { className: 'btn btn-secondary', onClick: onClose, disabled: busy }, 'Cancel'),
        h('button', { className: 'btn btn-primary', onClick: submit, disabled: busy }, busy ? 'Saving…' : (editing ? 'Save changes' : 'Add account'))
      )
    )
  );
}

function FinWallet({ accounts, rows, cur, owner, onAdd, onEdit, onDelete }) {
  var R = window.Recharts;
  var [selectedId, setSelectedId] = React.useState(null);
  var W = FIN_WALLET;
  var n = accounts.length;
  var stats = React.useMemo(function() {
    var m = {};
    accounts.forEach(function(a) { m[a.id] = finAccountStats(a, rows); });
    return m;
  }, [accounts, rows]);
  var total = accounts.reduce(function(sum, a) { return sum + stats[a.id].balance; }, 0);
  var visibleLast = 90, pocketMin = 100;
  var height = Math.max(W.minStage, W.top + (n - 1) * W.step + visibleLast + pocketMin);
  var step = n > 1 ? Math.min(62, Math.max(W.step, (height - W.top - visibleLast - pocketMin) / (n - 1))) : W.step;
  var pocketTop = W.top + (n - 1) * step + visibleLast;
  var pocketH = height - pocketTop;
  var active = accounts.filter(function(a) { return a.id === selectedId; })[0] || null;
  var activeStats = active ? stats[active.id] : null;
  var breakdown = React.useMemo(function() {
    if (!active) return null;
    return finBreakdown(rows.filter(function(r) { return r.account_id === active.id; }), 'this_month');
  }, [active, rows]);

  return h('div', { className: 'glass-card fin-card' },
    h('div', { className: 'card-header' },
      h('div', null,
        h('span', { className: 'card-title' }, 'Accounts'),
        n > 0 && h('div', { className: 'fin-wallet-total' }, 'Total balance  ', h('b', { className: total < 0 ? 'fin-amount expense' : 'fin-amount' }, finMoney(total, cur)))
      ),
      h('button', { className: 'btn btn-primary btn-sm', onClick: onAdd, disabled: n >= FIN_MAX_ACCOUNTS, title: n >= FIN_MAX_ACCOUNTS ? 'Maximum ' + FIN_MAX_ACCOUNTS + ' accounts' : '' }, 'Add Account')
    ),
    n === 0
      ? h('div', { className: 'empty-state' },
          h('div', { className: 'empty-title' }, 'No accounts yet'),
          h('div', { className: 'empty-desc' }, 'Add your bank or e-wallet accounts, then choose one every time you record a transaction.'),
          h('button', { className: 'btn btn-primary', onClick: onAdd }, 'Add Account')
        )
      : h('div', { className: 'fin-wallet-stage', style: { '--fin-h': height + 'px' } },
          h('div', { className: 'fin-wallet', style: { width: W.width, height: height } },
            h('div', { className: 'fin-wallet-back', style: { top: W.top + 8 } }),
            accounts.map(function(a, i) {
              var st = stats[a.id];
              return h('div', { key: a.id, className: 'fin-wcard' + (active && active.id === a.id ? ' lifted' : ''),
                style: { top: W.top + i * step, height: W.cardH, zIndex: i + 1, background: 'linear-gradient(135deg, ' + a.color + ', ' + a.color + 'aa 60%, #0b1220 150%)' } },
                h('div', { className: 'fin-wcard-top' },
                  h('span', { className: 'fin-wcard-name' }, a.name),
                  h('span', { className: 'fin-wcard-chip' })
                ),
                h('div', { className: 'fin-wcard-owner' }, owner),
                h('div', { className: 'fin-wcard-balance' }, finMoney(st.balance, cur))
              );
            }),
            h('div', { className: 'fin-wallet-pocket', style: { top: pocketTop, height: pocketH, zIndex: n + 5 } }),
            accounts.map(function(a, i) {
              var hitH = i < n - 1 ? step : visibleLast;
              return h('div', { key: 'hit' + a.id, className: 'fin-whit', tabIndex: 0, role: 'button', 'aria-label': a.name,
                style: { top: W.top + i * step, height: hitH, zIndex: n + 10 },
                onKeyDown: function(e) { if (e.key === 'Enter') setSelectedId(selectedId === a.id ? null : a.id); },
                onClick: function() { setSelectedId(selectedId === a.id ? null : a.id); },
                onContextMenu: function(e) {
                  UI.showContextMenu(e, [
                    { label: 'Edit', action: function() { onEdit(a); } },
                    { label: 'Delete', danger: true, action: function() { onDelete(a); } },
                  ]);
                } });
            })
          ),
          h('div', { className: 'fin-wallet-side' },
            active && h('div', { className: 'fin-wpanel' },
              h('div', { className: 'fin-wpanel-head' }, h('span', { className: 'fin-dot', style: { background: active.color } }), active.name),
              h('div', { className: 'fin-wpanel-row' }, h('span', null, 'Account holder'), h('b', null, owner)),
              h('div', { className: 'fin-wpanel-row' }, h('span', null, 'Balance'), h('b', { className: 'fin-amount ' + (activeStats.balance < 0 ? 'expense' : 'income') }, finMoney(activeStats.balance, cur))),
              h('div', { className: 'fin-wpanel-row' }, h('span', null, 'Initial balance'), h('b', null, finMoney(active.initial_balance, cur))),
              h('div', { className: 'fin-wpanel-row' }, h('span', null, 'Balance as of'), h('b', null, finDateLabel(active.balance_as_of))),
              h('div', { className: 'fin-wpanel-row' }, h('span', null, 'Income this month'), h('b', { className: 'fin-amount income' }, finMoney(activeStats.monthIncome, cur))),
              h('div', { className: 'fin-wpanel-row' }, h('span', null, 'Expenses this month'), h('b', { className: 'fin-amount expense' }, finMoney(activeStats.monthExpense, cur))),
              h('div', { className: 'fin-wpanel-row' }, h('span', null, 'Transactions this month'), h('b', null, activeStats.monthCount))
            ),
            active && h('div', { className: 'fin-wpanel fin-wpanel-expenses' },
              h('div', { className: 'fin-wpanel-head' }, 'Expenses · ' + finMonthLabel(finMonthOf(new Date()))),
              breakdown.list.length === 0
                ? h('div', { className: 'fin-empty-chart', style: { flex: 1, height: 'auto' } }, 'No expenses this month')
                : h(React.Fragment, null,
                    h('div', { className: 'fin-wpanel-pie' },
                      h(R.ResponsiveContainer, { width: '100%', height: '100%' },
                        h(R.PieChart, null,
                          h(R.Pie, { data: breakdown.list, dataKey: 'value', nameKey: 'name', innerRadius: 38, outerRadius: 62, paddingAngle: 2, stroke: 'none' },
                            breakdown.list.map(function(d, i) { return h(R.Cell, { key: d.name, fill: finCategoryColor(d.name, i) }); })
                          ),
                          h(R.Tooltip, { content: finTip(cur) })
                        )
                      )
                    ),
                    h('div', { className: 'fin-legend fin-wpanel-legend' },
                      breakdown.list.map(function(d, i) {
                        return h('div', { key: d.name, className: 'fin-legend-row' },
                          h('span', { className: 'fin-dot', style: { background: finCategoryColor(d.name, i) } }),
                          h('span', { className: 'fin-legend-name' }, d.name),
                          h('span', { className: 'fin-legend-amount' }, finMoney(d.value, cur)),
                          h('span', { className: 'fin-legend-pct' }, ((d.value / breakdown.total) * 100).toFixed(1) + '%')
                        );
                      })
                    )
                  )
            )
          )
        )
  );
}

function FinTxModal({ tx, accounts, rows, cur, onClose, onSave, onGoAccounts }) {
  var editing = !!(tx && tx.id);
  var [type, setType] = React.useState(tx && tx.type ? tx.type : 'expense');
  var [category, setCategory] = React.useState(tx ? tx.category || '' : '');
  var [amount, setAmount] = React.useState(tx && tx.amount ? String(tx.amount) : '');
  var [date, setDate] = React.useState(tx && tx.transaction_date ? tx.transaction_date : finToday());
  var [accountId, setAccountId] = React.useState(tx && tx.account_id && accounts.some(function(a) { return a.id === tx.account_id; }) ? tx.account_id : '');
  var [errors, setErrors] = React.useState({});
  var [serverError, setServerError] = React.useState('');
  var [busy, setBusy] = React.useState(false);

  var cats = finCategoriesFor(type, editing && tx.type === type ? tx.category : '');
  var cat = cats.indexOf(category) >= 0 ? category : cats[0];

  async function submit() {
    var e = {};
    var a = Number(amount);
    if (amount === '' || !isFinite(a) || a <= 0) e.amount = 'Enter an amount above 0';
    else if (a >= 1e12) e.amount = 'Amount is too large';
    if (!date || isNaN(finParse(date).getTime())) e.date = 'Choose a date';
    if (!cat) e.category = 'Choose a category';
    if (!accountId) e.account = 'Choose an account';
    setErrors(e);
    if (Object.keys(e).length) return;
    var candidate = { id: editing ? tx.id : '__new__', account_id: accountId, type: type, amount: a, transaction_date: date };
    var after = rows.filter(function(r) { return !editing || r.id !== tx.id; }).concat(candidate);
    var ids = [accountId].concat(editing && tx.account_id && tx.account_id !== accountId ? [tx.account_id] : []);
    var guard = finGuardMessage(accounts, after, ids);
    if (guard) {
      var acc = accounts.find(function(x) { return x.id === accountId; });
      var without = rows.filter(function(r) { return !editing || r.id !== tx.id; });
      var avail = acc ? finBalanceAt(acc, without, date) : null;
      var friendly = type === 'expense' && acc && avail !== null && avail >= 0 && guard.indexOf(acc.name) >= 0;
      setErrors({ amount: friendly ? 'Not enough balance in ' + acc.name + '. Available on ' + finDateLabel(date) + ': ' + finMoney(avail, cur) : guard });
      return;
    }
    var keepName = editing && tx.transaction_name && tx.transaction_name !== tx.category;
    setBusy(true);
    setServerError('');
    try {
      await onSave({
        transaction_name: keepName ? tx.transaction_name : cat, type: type, category: cat,
        amount: Math.round(a * 100) / 100, transaction_date: date, notes: editing ? (tx.notes || '') : '', account_id: accountId,
      }, editing ? tx.id : null);
      onClose();
    } catch (err) {
      setServerError(err && err.message ? err.message : 'Could not save the transaction');
      setBusy(false);
    }
  }

  var field = function(label, key, control) {
    return h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, label),
      control,
      errors[key] && h('div', { className: 'input-hint', style: { color: 'var(--red)' } }, errors[key])
    );
  };

  var noAccounts = accounts.length === 0;

  return h(UI.Modal, { open: true, onClose: onClose, title: editing ? 'Edit Transaction' : 'Add Transaction' },
    noAccounts
      ? h('div', { className: 'alert alert-danger' }, 'Create an account first, then choose it here. ',
          h('button', { className: 'btn btn-ghost btn-sm', onClick: onGoAccounts }, 'Go to Account'))
      : field('Account', 'account', h(UI.CustomDropdown, { value: accountId, onChange: setAccountId, placeholder: 'Select account', options: accounts.map(function(a) { return { value: a.id, label: a.name }; }) })),
    h('div', { className: 'form-row' },
      field('Amount', 'amount', h('input', { className: 'input-field', type: 'number', min: 0, step: 'any', placeholder: '0', autoFocus: true, value: amount, onChange: function(e) { setAmount(e.target.value); } })),
      field('Category', 'category', h(UI.CustomDropdown, { value: cat, onChange: setCategory, options: cats.map(function(c) { return { value: c, label: c }; }) }))
    ),
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Type'),
      h('div', { className: 'toggle-group', style: { display: 'inline-flex' } },
        ['expense', 'income'].map(function(t) {
          return h('div', { key: t, className: 'toggle-opt' + (type === t ? ' active' : ''), onClick: function() { setType(t); setCategory(''); } }, t === 'income' ? 'Income' : 'Expense');
        })
      )
    ),
    field('Date', 'date', h('input', { className: 'input-field', type: 'date', value: date, onChange: function(e) { setDate(e.target.value); } })),
    serverError && h('div', { className: 'alert alert-danger' }, serverError),
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8 } },
      h('button', { className: 'btn btn-secondary', onClick: onClose, disabled: busy }, 'Cancel'),
      h('button', { className: 'btn btn-primary', onClick: submit, disabled: busy || noAccounts }, busy ? 'Saving…' : (editing ? 'Save changes' : 'Add transaction'))
    )
  );
}

function FinTransactions({ rows, accounts, cur, onAdd, onEdit, onDelete }) {
  var accountName = React.useMemo(function() {
    var m = {};
    accounts.forEach(function(a) { m[a.id] = a.name; });
    return m;
  }, [accounts]);
  var [type, setType] = React.useState('all');
  var [category, setCategory] = React.useState('all');
  var [from, setFrom] = React.useState('');
  var [to, setTo] = React.useState('');
  var [month, setMonth] = React.useState('all');
  var [year, setYear] = React.useState('all');
  var [sort, setSort] = React.useState('newest');
  var [page, setPage] = React.useState(1);

  React.useEffect(function() { setPage(1); }, [type, category, from, to, month, year, sort]);

  var years = React.useMemo(function() {
    var seen = {};
    rows.forEach(function(r) { seen[r.transaction_date.slice(0, 4)] = true; });
    return Object.keys(seen).sort().reverse();
  }, [rows]);

  var categories = React.useMemo(function() {
    var seen = {};
    FIN_EXPENSE_CATEGORIES.concat(FIN_INCOME_CATEGORIES).forEach(function(c) { seen[c] = true; });
    rows.forEach(function(r) { seen[r.category] = true; });
    return Object.keys(seen);
  }, [rows]);

  var filtered = React.useMemo(function() {
    var list = rows.filter(function(r) {
      if (type !== 'all' && r.type !== type) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (from && r.transaction_date < from) return false;
      if (to && r.transaction_date > to) return false;
      if (year !== 'all' && r.transaction_date.slice(0, 4) !== year) return false;
      if (month !== 'all' && r.transaction_date.slice(5, 7) !== month) return false;
      return true;
    });
    if (sort === 'oldest') list.sort(function(a, b) { return (a.transaction_date + (a.created_at || '')).localeCompare(b.transaction_date + (b.created_at || '')); });
    else if (sort === 'highest') list.sort(function(a, b) { return b.amount - a.amount; });
    else if (sort === 'lowest') list.sort(function(a, b) { return a.amount - b.amount; });
    return list;
  }, [rows, type, category, from, to, month, year, sort]);

  var totals = finTotals(filtered);
  var pages = Math.max(1, Math.ceil(filtered.length / FIN_PAGE_SIZE));
  var current = Math.min(page, pages);
  var slice = filtered.slice((current - 1) * FIN_PAGE_SIZE, current * FIN_PAGE_SIZE);
  var active = type !== 'all' || category !== 'all' || from || to || month !== 'all' || year !== 'all';

  function reset() { setType('all'); setCategory('all'); setFrom(''); setTo(''); setMonth('all'); setYear('all'); }

  var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  var monthOptions = [{ value: 'all', label: 'All months' }].concat(months.map(function(m) { return { value: m, label: finMonthLabel('2000-' + m, true) }; }));

  return h('div', null,
    h('div', { className: 'fin-toolbar' },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Type'),
        h(UI.CustomDropdown, { value: type, onChange: setType, options: [{ value: 'all', label: 'All types' }, { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' }] })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Category'),
        h(UI.CustomDropdown, { value: category, onChange: setCategory, options: [{ value: 'all', label: 'All categories' }].concat(categories.map(function(c) { return { value: c, label: c }; })) })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Month'),
        h(UI.CustomDropdown, { value: month, onChange: setMonth, options: monthOptions })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Year'),
        h(UI.CustomDropdown, { value: year, onChange: setYear, options: [{ value: 'all', label: 'All years' }].concat(years.map(function(y) { return { value: y, label: y }; })) })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'From'),
        h('input', { className: 'input-field', type: 'date', value: from, onChange: function(e) { setFrom(e.target.value); } })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'To'),
        h('input', { className: 'input-field', type: 'date', value: to, onChange: function(e) { setTo(e.target.value); } })
      ),
      h('div', { className: 'input-group fin-sort' },
        h('label', { className: 'input-label' }, 'Sort by'),
        h(UI.CustomDropdown, { value: sort, onChange: setSort, options: [
          { value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' },
          { value: 'highest', label: 'Highest amount' }, { value: 'lowest', label: 'Lowest amount' },
        ] })
      ),
      active && h('div', { className: 'fin-toolbar-actions' },
        h('button', { className: 'btn btn-ghost', onClick: reset }, 'Reset filters')
      )
    ),

    h('div', { className: 'fin-totals' },
      h('div', null, h('span', null, 'Total income'), h('b', { className: 'fin-amount income' }, finMoney(totals.income, cur))),
      h('div', null, h('span', null, 'Total expenses'), h('b', { className: 'fin-amount expense' }, finMoney(totals.expense, cur))),
      h('div', null, h('span', null, 'Net amount'), h('b', { className: 'fin-amount ' + (totals.net >= 0 ? 'income' : 'expense') }, finMoney(totals.net, cur))),
      h('div', null, h('span', null, 'Results'), h('b', null, filtered.length))
    ),

    filtered.length === 0
      ? h('div', { className: 'empty-state' },
          h('div', { className: 'empty-title' }, rows.length === 0 ? 'No transactions yet' : 'No transactions match your filters'),
          h('div', { className: 'empty-desc' }, rows.length === 0 ? 'Add your first income or expense to get started.' : 'Try different filters.'),
          rows.length === 0
            ? h('button', { className: 'btn btn-primary', onClick: onAdd }, 'Add Transaction')
            : h('button', { className: 'btn btn-secondary', onClick: reset }, 'Reset filters')
        )
      : h('div', null,
          h('div', { className: 'table-wrap' },
            h('table', { className: 'data-table fin-table' },
              h('thead', null, h('tr', null, ['Category', 'Account', 'Type', 'Date', 'Time', 'Amount'].map(function(c) { return h('th', { key: c }, c); }))),
              h('tbody', null,
                slice.map(function(r) {
                  return h('tr', { key: r.id,
                    onContextMenu: function(e) {
                      UI.showContextMenu(e, [
                        { label: 'Edit', action: function() { onEdit(r); } },
                        { label: 'Delete', danger: true, action: function() { onDelete(r); } },
                      ]);
                    } },
                    h('td', { className: 'text-col' }, r.category),
                    h('td', null, accountName[r.account_id] || '—'),
                    h('td', null, h('span', { className: 'badge ' + (r.type === 'income' ? 'badge-green' : 'badge-red') }, r.type === 'income' ? 'Income' : 'Expense')),
                    h('td', null, finDateLabel(r.transaction_date)),
                    h('td', null, finTimeOf(r)),
                    h('td', { className: 'fin-amount ' + (r.type === 'income' ? 'income' : 'expense') }, finMoney(r.amount, cur))
                  );
                })
              )
            )
          ),
          h('div', { className: 'fin-pager' },
            h('span', { className: 'fin-pager-info' }, 'Showing ' + ((current - 1) * FIN_PAGE_SIZE + 1) + ' to ' + Math.min(current * FIN_PAGE_SIZE, filtered.length) + ' of ' + filtered.length),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 10 } },
              h('button', { className: 'btn btn-secondary btn-sm', disabled: current <= 1, onClick: function() { setPage(current - 1); } }, 'Previous'),
              h('span', { className: 'fin-pager-info' }, 'Page ' + current + ' of ' + pages),
              h('button', { className: 'btn btn-secondary btn-sm', disabled: current >= pages, onClick: function() { setPage(current + 1); } }, 'Next')
            )
          )
        )
  );
}

function FinancePage() {
  var cur = 'IDR';
  var [rows, setRows] = React.useState([]);
  var [accounts, setAccounts] = React.useState([]);
  var [accModal, setAccModal] = React.useState(null);
  var [delAcc, setDelAcc] = React.useState(null);
  var [status, setStatus] = React.useState('loading');
  var [error, setError] = React.useState('');
  var [tab, setTab] = React.useState('overview');
  var [modal, setModal] = React.useState(null);
  var [delTx, setDelTx] = React.useState(null);

  var load = React.useCallback(async function() {
    setStatus('loading');
    try {
      var res = await Promise.all([FinanceDB.fetchAll(), FinanceAccountsDB.fetchAll()]);
      setRows(finSortRows(res[0]));
      setAccounts(res[1]);
      setStatus('ready');
    } catch (err) {
      setError(err && err.message ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, []);

  React.useEffect(function() { load(); }, [load]);

  React.useEffect(function() {
    window.dispatchEvent(new CustomEvent('financeTab', { detail: tab }));
  }, [tab]);

  React.useEffect(function() {
    function onAdd() { setModal({}); }
    window.addEventListener('openFinanceTx', onAdd);
    return function() { window.removeEventListener('openFinanceTx', onAdd); };
  }, []);

  async function saveTx(payload, id) {
    var existing = id ? rows.find(function(r) { return r.id === id; }) : null;
    var after = rows.filter(function(r) { return r.id !== id; }).concat(Object.assign({ id: id || '__new__' }, payload));
    var guard = finGuardMessage(accounts, after, [payload.account_id].concat(existing && existing.account_id && existing.account_id !== payload.account_id ? [existing.account_id] : []));
    if (guard) throw new Error(guard);
    var row = id ? await FinanceDB.update(id, payload) : await FinanceDB.insert(payload);
    setRows(function(prev) { return finSortRows(prev.filter(function(r) { return r.id !== row.id; }).concat(row)); });
    UI.toast(id ? 'Transaction updated' : 'Transaction added', 'success');
  }

  async function removeTx() {
    var target = delTx;
    if (!target) return;
    var guard = target.account_id ? finGuardMessage(accounts, rows.filter(function(r) { return r.id !== target.id; }), [target.account_id]) : null;
    if (guard) {
      UI.toast('Cannot delete: ' + guard, 'error');
      setDelTx(null);
      return;
    }
    try {
      await FinanceDB.remove(target.id);
      setRows(function(prev) { return prev.filter(function(r) { return r.id !== target.id; }); });
      UI.toast('Transaction deleted', 'success');
    } catch (err) {
      UI.toast(err && err.message ? err.message : 'Could not delete the transaction', 'error');
    }
    setDelTx(null);
  }

  async function saveAccount(payload, id) {
    if (id) {
      var current = accounts.find(function(a) { return a.id === id; });
      var guard = current ? finGuardMessage([Object.assign({}, current, payload)], rows, [id]) : null;
      if (guard) throw new Error(guard);
    }
    var row = id ? await FinanceAccountsDB.update(id, payload) : await FinanceAccountsDB.insert(Object.assign({}, payload, { sort_order: accounts.length }));
    setAccounts(function(prev) {
      var next = id ? prev.map(function(a) { return a.id === id ? row : a; }) : prev.concat(row);
      return next;
    });
    UI.toast(id ? 'Account updated' : 'Account added', 'success');
  }

  async function removeAccount() {
    var target = delAcc;
    if (!target) return;
    try {
      await FinanceAccountsDB.remove(target.id);
      setAccounts(function(prev) { return prev.filter(function(a) { return a.id !== target.id; }); });
      setRows(function(prev) { return prev.map(function(r) { return r.account_id === target.id ? Object.assign({}, r, { account_id: null }) : r; }); });
      UI.toast('Account deleted', 'success');
    } catch (err) {
      UI.toast(err && err.message ? err.message : 'Could not delete the account', 'error');
    }
    setDelAcc(null);
    setAccModal(null);
  }

  var owner = displayName(window.currentSupabaseUser);
  var openAdd = function() { setModal({}); };
  var openEdit = function(r) { setModal(r); };
  var openDelete = function(r) { setDelTx(r); };

  return h('div', null,
    h('div', { className: 'page-header', style: { paddingBottom: 0 } },
      h('div', null, h('div', { className: 'page-title' }, 'Finance'))
    ),
    h('div', { className: 'page-tabs' },
      [['overview', 'Overview'], ['accounts', 'Account'], ['transactions', 'Transaction']].map(function(t) {
        return h('div', { key: t[0], className: 'page-tab' + (tab === t[0] ? ' active' : ''), onClick: function() { setTab(t[0]); } }, t[1]);
      })
    ),

    h('div', { className: 'page-body' },
      status === 'loading' && h('div', { className: 'fin-state' }, h('div', { className: 'spinner lg' }), h('div', null, 'Loading transactions…')),

      status === 'error' && h('div', { className: 'glass-card fin-state-card' },
        h('div', { className: 'empty-title' }, 'Could not load your transactions'),
        h('div', { className: 'empty-desc' }, error),
        h('div', { className: 'empty-desc', style: { marginTop: -8 } }, 'If this is the first time, run supabase/migrations/20261109_finance_transactions.sql and then 20261121_finance_accounts.sql in the Supabase SQL Editor.'),
        h('button', { className: 'btn btn-secondary', onClick: load }, 'Try again')
      ),

      status === 'ready' && tab === 'overview' && (rows.length === 0
        ? h('div', { className: 'empty-state' },
            h('div', { className: 'empty-title' }, 'No transactions yet'),
            h('div', { className: 'empty-desc' }, 'Add your first income or expense and the dashboard fills in from there.'),
            h('button', { className: 'btn btn-primary', onClick: openAdd }, 'Add Transaction')
          )
        : h('div', null,
            h(FinStats, { rows: rows, accounts: accounts, cur: cur }),
            h('div', { className: 'fin-main-grid' },
              h(FinTrend, { rows: rows, accounts: accounts, cur: cur }),
              h(FinBreakdown, { rows: rows, cur: cur })
            ),
            h('div', { className: 'fin-bottom-grid' },
              h(FinMonthly, { rows: rows, cur: cur }),
              h(FinRecent, { rows: rows, cur: cur, onViewAll: function() { setTab('transactions'); }, onEdit: openEdit, onDelete: openDelete })
            )
          )
      ),

      status === 'ready' && tab === 'accounts' && h(FinWallet, {
        accounts: accounts, rows: rows, cur: cur, owner: owner,
        onAdd: function() { setAccModal({}); }, onEdit: function(a) { setAccModal(a); }, onDelete: function(a) { setDelAcc(a); },
      }),

      status === 'ready' && tab === 'transactions' && h(FinTransactions, {
        rows: rows, accounts: accounts, cur: cur, onAdd: openAdd, onEdit: openEdit, onDelete: openDelete,
      })
    ),

    modal && h(FinTxModal, { tx: modal.id ? modal : null, accounts: accounts, rows: rows, cur: cur, onClose: function() { setModal(null); }, onSave: saveTx,
      onGoAccounts: function() { setModal(null); setTab('accounts'); } }),
    accModal && h(FinAccountModal, { account: accModal.id ? accModal : null, owner: owner, nextColor: FIN_ACCOUNT_COLORS[accounts.length % FIN_ACCOUNT_COLORS.length],
      onClose: function() { setAccModal(null); }, onSave: saveAccount, onDelete: function(a) { setDelAcc(a); } }),
    h(UI.ConfirmModal, {
      open: !!delAcc, onClose: function() { setDelAcc(null); }, onConfirm: removeAccount,
      title: 'Delete account',
      message: delAcc ? 'Delete ' + delAcc.name + '? Its transactions are kept but will no longer belong to any account, so they stop counting in account balances. This cannot be undone.' : '',
    }),
    h(UI.ConfirmModal, {
      open: !!delTx, onClose: function() { setDelTx(null); }, onConfirm: removeTx,
      title: 'Delete transaction',
      message: delTx ? 'Delete this ' + delTx.category + ' transaction? The dashboard and totals update right away. This cannot be undone.' : '',
    })
  );
}

window.FinancePage = FinancePage;
