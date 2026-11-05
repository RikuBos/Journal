function sendPayoutToDiscord(settings, lines) {
  if (!settings || !settings.discordEnabled || !settings.discordWebhookUrl) return;
  fetch(settings.discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '```\n' + lines.join('\n') + '\n```', username: settings.discordUsername || 'Trading Journal' }),
  }).catch(function() {});
}

function nowStamp() {
  var now = new Date();
  var pad = function(n) { return (n < 10 ? '0' : '') + n; };
  var date = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var time = pad(now.getHours()) + ':' + pad(now.getMinutes());
  return { date: date, time: time };
}

function PayoutHistoryTable({ rows, columns, onDelete }) {
  return h('div', { className: 'table-wrap' },
    h('table', { className: 'data-table' },
      h('thead', null, h('tr', null, columns.map(function(col) { return h('th', { key: col.label }, col.label); }))),
      h('tbody', null,
        rows.map(function(row) {
          return h('tr', { key: row.idx,
            onContextMenu: function(e) {
              UI.showContextMenu(e, [{ label: 'Delete payout', danger: true, action: function() { onDelete(row.idx); } }]);
            } },
            columns.map(function(col) { return h('td', { key: col.label, style: col.style ? col.style(row.rec) : null }, col.value(row.rec)); })
          );
        })
      )
    )
  );
}

function BrokerPayoutView(props) {
  var acc = props.acc, accounts = props.accounts, accTrades = props.accTrades;
  var upsertAccount = props.upsertAccount, settings = props.settings;
  var [amount, setAmount] = React.useState('');
  var [tab,    setTab]    = React.useState('withdraw');
  var [delIdx, setDelIdx] = React.useState(null);

  var totalPL   = accTrades.reduce(function(s, t) { return s + (t.profitLoss || 0); }, 0);
  var balance   = accountBalance(acc, totalPL);
  var withdrawn = acc.totalWithdrawn || 0;
  var history   = acc.payoutHistory || [];
  var amt       = parseFloat(amount);
  var valid     = amt > 0 && amt <= balance + 0.0001;
  var money     = function(v) { return '$' + (v || 0).toFixed(2); };

  async function doWithdraw() {
    if (!valid) return;
    var st = nowStamp();
    var after = balance - amt;
    var record = { date: st.date, time: st.time, amount: amt, balanceBefore: balance, balanceAfter: after };
    await upsertAccount(Object.assign({}, acc, {
      totalWithdrawn: withdrawn + amt,
      totalPayouts:   (acc.totalPayouts || 0) + amt,
      payoutHistory:  history.concat(record),
    }));
    sendPayoutToDiscord(settings, [
      '===  PAYOUT  ===',
      'Account  : ' + acc.name + ' (' + acc.propFirm + ')',
      'Date     : ' + st.date + '  ' + st.time,
      '------------------------',
      'Payout   : ' + money(amt),
      'Balance  : ' + money(after),
    ]);
    setAmount('');
    UI.toast('Payout ' + money(amt) + ' recorded', 'success');
  }

  async function removeRecord() {
    var rec = history[delIdx];
    if (!rec) { setDelIdx(null); return; }
    await upsertAccount(Object.assign({}, acc, {
      totalWithdrawn: Math.max(0, withdrawn - (rec.amount || 0)),
      totalPayouts:   Math.max(0, (acc.totalPayouts || 0) - (rec.amount || 0)),
      payoutHistory:  history.filter(function(_, i) { return i !== delIdx; }),
    }));
    setDelIdx(null);
    UI.toast('Payout deleted', 'success');
  }

  var rows = history.map(function(rec, idx) { return { rec: rec, idx: idx }; }).reverse();

  return h('div', null,
    h('div', { className: 'page-header', style: { paddingBottom: 0 } },
      h('div', null,
        h('div', { className: 'page-title' }, 'Payout'),
        h('div', { className: 'page-subtitle' }, acc.propFirm + '   ' + acc.name)
      ),
      h(UI.CustomDropdown, {
        value: acc.id, onChange: props.setSelAcc,
        options: accounts.map(function(a) { return { value: a.id, label: a.name }; }),
      })
    ),
    h('div', { className: 'page-tabs' },
      [['withdraw', 'Withdraw'], ['history', 'History']].map(function(t) {
        return h('div', { key: t[0], className: 'page-tab' + (tab === t[0] ? ' active' : ''), onClick: function() { setTab(t[0]); } }, t[1]);
      })
    ),
    h('div', { className: 'page-body' },
      tab === 'withdraw' && h('div', null,
        h('div', { className: 'grid-3 mb-24' },
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Balance'),
            h('div', { className: 'stat-value' }, money(balance)),
            h('div', { className: 'stat-sub' }, 'Available to withdraw')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Total Withdrawn'),
            h('div', { className: 'stat-value positive' }, money(withdrawn)),
            h('div', { className: 'stat-sub' }, history.length + ' payouts total')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Balance After'),
            h('div', { className: 'stat-value' }, money(valid ? balance - amt : balance)),
            h('div', { className: 'stat-sub' }, 'No buffer, no rules')
          )
        ),
        h('div', { className: 'glass-card', style: { maxWidth: 480 } },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Withdraw')),
          h('div', { className: 'card-body' },
            h('div', { className: 'input-group' },
              h('label', { className: 'input-label' }, 'Amount'),
              h('div', { style: { display: 'flex', gap: 8 } },
                h('input', { className: 'input-field', type: 'number', min: 0, step: 'any', placeholder: '0.00',
                  value: amount, onChange: function(e) { setAmount(e.target.value); } }),
                h('button', { className: 'btn btn-secondary', onClick: function() { setAmount(balance > 0 ? balance.toFixed(2) : ''); } }, 'Max')
              ),
              amount !== '' && !valid && h('div', { className: 'input-hint', style: { color: 'var(--red)' } },
                amt > balance ? 'Amount is more than the balance' : 'Enter a valid amount')
            ),
            h('button', { className: 'btn btn-primary', style: { width: '100%', justifyContent: 'center', opacity: valid ? 1 : 0.45 },
              disabled: !valid, onClick: doWithdraw },
              'Payout' + (valid ? '  ' + money(amt) : ''))
          )
        )
      ),
      tab === 'history' && (rows.length === 0
        ? h('div', { className: 'empty-state' },
            h('div', { className: 'empty-title' }, 'No payouts yet'),
            h('div', { className: 'empty-desc' }, 'Completed payouts will appear here')
          )
        : h(PayoutHistoryTable, {
            rows: rows, onDelete: setDelIdx,
            columns: [
              { label: 'Date', value: function(r) { return r.date; } },
              { label: 'Time', value: function(r) { return r.time || ''; } },
              { label: 'Balance Before', value: function(r) { return money(r.balanceBefore); } },
              { label: 'Payout', value: function(r) { return money(r.amount); }, style: function() { return { color: 'var(--green)', fontWeight: 600 }; } },
              { label: 'Balance After', value: function(r) { return money(r.balanceAfter); } },
            ],
          })
      )
    ),
    h(UI.ConfirmModal, {
      open: delIdx !== null, onClose: function() { setDelIdx(null); }, onConfirm: removeRecord,
      title: 'Delete payout', message: 'This payout will be removed and its amount returns to the account balance.',
    })
  );
}

function PayoutPage() {
  var { accounts, activeAccountId, upsertAccount, trades, activeAccount, settings } = useApp();
  var [selectedAccId, setSelAcc] = React.useState(activeAccountId || '');
  var [tab, setTab] = React.useState('calculator');
  var [amountStr, setAmountStr] = React.useState('');
  var [delIdx, setDelIdx] = React.useState(null);

  React.useEffect(function() { setAmountStr(''); }, [selectedAccId]);

  var acc = React.useMemo(function() {
    return accounts.find(function(a) { return a.id === selectedAccId; }) || activeAccount;
  }, [selectedAccId, accounts, activeAccount]);

  var accTrades = React.useMemo(function() {
    if (!acc) return [];
    return trades.filter(function(t) { return t.accountId === acc.id && t.status === 'Closed'; });
  }, [trades, acc]);

  var calc = React.useMemo(function() {
    if (!acc || acc.isBroker) return null;
    var history   = acc.payoutHistory || [];
    var last      = history.length ? history[history.length - 1] : null;
    var lastAt    = last ? (last.at || (last.date + 'T23:59')) : null;
    var cycleTrades = lastAt
      ? accTrades.filter(function(t) { return ((t.date || '') + 'T' + (t.time || '00:00')) > lastAt; })
      : accTrades;

    var buffer      = (acc.bufferAmount !== undefined && acc.bufferAmount !== null) ? acc.bufferAmount : 40;
    var totalPL     = accTrades.reduce(function(s, t) { return s + (t.profitLoss || 0); }, 0);
    var currentBal  = accountBalance(acc, totalPL);
    var startBal    = acc.cycleStartBalance || acc.startingBalance || 0;
    var cycleProfit = Math.max(0, currentBal - startBal);
    var split       = (acc.profitSplit || 90) / 100;
    var withdrawGross = Math.max(0, cycleProfit - buffer);

    var consistencyPct = null, consistencyPasses = true;
    if (acc.consistencyRule) {
      var byDay = {};
      cycleTrades.forEach(function(t) {
        var d = (t.date || '').slice(0, 10);
        byDay[d] = (byDay[d] || 0) + (t.profitLoss || 0);
      });
      var wins = Object.keys(byDay).map(function(k) { return byDay[k]; }).filter(function(v) { return v > 0; });
      var bestDay = wins.length ? Math.max.apply(null, wins) : 0;
      consistencyPct = cycleProfit > 0 ? (bestDay / cycleProfit) * 100 : 0;
      consistencyPasses = consistencyPct <= acc.consistencyRule;
    }

    var isOnDemand      = !acc.cycleType || acc.cycleType === 'on_demand';
    var growthRequired  = isOnDemand ? startBal * 0.02 : 0;
    var growthMet       = isOnDemand ? cycleProfit >= growthRequired : cycleProfit > 0;
    var growthRemaining = Math.max(0, growthRequired - cycleProfit);

    return {
      buffer: buffer, currentBal: currentBal, startBal: startBal, cycleProfit: cycleProfit,
      split: split, withdrawGross: withdrawGross,
      consistencyPct: consistencyPct, consistencyPasses: consistencyPasses,
      growthRequired: growthRequired, growthMet: growthMet, growthRemaining: growthRemaining,
      isOnDemand: isOnDemand,
      canPayout: growthMet && consistencyPasses && withdrawGross > 0,
    };
  }, [acc, accTrades]);

  function pick() {
    if (!calc) return { withdraw: 0, takeHome: 0, valid: true };
    var a = parseFloat(amountStr);
    var ok = amountStr !== '' && a > 0 && a <= calc.withdrawGross + 0.0001;
    var w = ok ? a : calc.withdrawGross;
    return { withdraw: w, takeHome: w * calc.split, valid: amountStr === '' || ok };
  }

  async function doPayout() {
    var pk = pick();
    if (!acc || !calc || !calc.canPayout || !pk.valid) return;
    var st = nowStamp();
    var balanceAfter = calc.currentBal - pk.withdraw;
    var record = {
      date: st.date, time: st.time, at: st.date + 'T' + st.time,
      balanceBefore: calc.currentBal, balanceAfter: balanceAfter,
      cycleProfit: calc.cycleProfit, buffer: calc.buffer,
      withdrawn: pk.withdraw, profitSplit: acc.profitSplit || 90,
      takeHome: pk.takeHome,
    };
    await upsertAccount(Object.assign({}, acc, {
      payoutHistory:     (acc.payoutHistory || []).concat(record),
      totalPayouts:      (acc.totalPayouts || 0) + pk.takeHome,
      totalWithdrawn:    (acc.totalWithdrawn || 0) + pk.withdraw,
      cycleStartBalance: balanceAfter,
    }));
    sendPayoutToDiscord(settings, [
      '===  PAYOUT  ===',
      'Account  : ' + acc.name + ' (' + acc.propFirm + ')',
      'Date     : ' + st.date + '  ' + st.time,
      '------------------------',
      'Payout   : $' + pk.takeHome.toFixed(2) + ' (after buffer)',
      'Buffer   : $' + calc.buffer.toFixed(2),
      '------------------------',
      'Balance  : $' + balanceAfter.toFixed(2),
    ]);
    setAmountStr('');
    UI.toast('Payout $' + pk.takeHome.toFixed(2) + ' recorded', 'success');
  }

  async function removeRecord() {
    if (!acc) return;
    var hist = acc.payoutHistory || [];
    var rec = hist[delIdx];
    if (!rec) { setDelIdx(null); return; }
    var w  = rec.withdrawn !== undefined ? rec.withdrawn : 0;
    var th = rec.takeHome !== undefined ? rec.takeHome : (rec.available !== undefined ? rec.available : (rec.netPayout || 0));
    var cycleStart = acc.cycleStartBalance || acc.startingBalance;
    var newStart;
    if (delIdx === hist.length - 1) {
      if (rec.balanceBefore !== undefined && rec.cycleProfit !== undefined) newStart = rec.balanceBefore - rec.cycleProfit;
      else if (hist.length > 1 && hist[delIdx - 1].balanceAfter !== undefined) newStart = hist[delIdx - 1].balanceAfter;
      else newStart = acc.startingBalance;
    } else {
      newStart = cycleStart + w;
    }
    await upsertAccount(Object.assign({}, acc, {
      payoutHistory:     hist.filter(function(_, i) { return i !== delIdx; }),
      totalPayouts:      Math.max(0, (acc.totalPayouts || 0) - th),
      totalWithdrawn:    Math.max(0, (acc.totalWithdrawn || 0) - w),
      cycleStartBalance: newStart,
    }));
    setDelIdx(null);
    UI.toast('Payout deleted, balance restored', 'success');
  }

  if (!acc) return h('div', { className: 'page-header' },
    h('div', null,
      h('div', { className: 'page-title' }, 'Payout'),
      h('div', { className: 'page-subtitle' }, 'No account selected')
    )
  );

  if (acc.isBroker) {
    return h(BrokerPayoutView, {
      acc: acc, accounts: accounts, accTrades: accTrades,
      upsertAccount: upsertAccount, settings: settings, setSelAcc: setSelAcc,
    });
  }

  var c  = calc || {};
  var pk = pick();
  var money = function(v) { return '$' + (v || 0).toFixed(2); };
  var chip = function(ok, yes, no) {
    return h('div', { style: {
      padding: '3px 11px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, flexShrink: 0,
      background: ok ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
      color: ok ? 'var(--green)' : 'var(--red)',
    } }, ok ? yes : no);
  };
  var rule = function(title, sub, ok, yes, no, extra) {
    return h('div', { style: { padding: '14px 0', borderBottom: '1px solid var(--border-1)' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 } },
        h('div', null,
          h('div', { style: { fontSize: 13, color: 'var(--t1)' } }, title),
          h('div', { style: { fontSize: 11.5, color: 'var(--t3)', marginTop: 3 } }, sub)
        ),
        chip(ok, yes, no)
      ),
      extra || null
    );
  };

  var breakdown = [
    ['Current Balance',        money(c.currentBal)],
    ['Cycle Start',            money(c.startBal)],
    ['Cycle Profit',           money(c.cycleProfit)],
    ['Buffer kept in account', money(c.buffer)],
    ['Withdrawn from account', money(pk.withdraw)],
    ['Your split (' + Math.round((c.split || 0) * 100) + '%)', money(pk.takeHome)],
  ];
  var history = (acc.payoutHistory || []).map(function(rec, idx) { return { rec: rec, idx: idx }; }).reverse();

  return h('div', null,
    h('div', { className: 'page-header', style: { paddingBottom: 0 } },
      h('div', null,
        h('div', { className: 'page-title' }, 'Payout'),
        h('div', { className: 'page-subtitle' }, acc.propFirm + '   ' + acc.name)
      ),
      h(UI.CustomDropdown, {
        value: acc.id, onChange: setSelAcc,
        options: accounts.map(function(a) { return { value: a.id, label: a.name }; }),
      })
    ),
    h('div', { className: 'page-tabs' },
      [['calculator', 'Calculator'], ['history', 'History']].map(function(t) {
        return h('div', { key: t[0], className: 'page-tab' + (tab === t[0] ? ' active' : ''), onClick: function() { setTab(t[0]); } }, t[1]);
      })
    ),

    h('div', { className: 'page-body' },
      tab === 'calculator' && h('div', null,
        h('div', { className: 'grid-stats mb-24' },
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Cycle Profit'),
            h('div', { className: 'stat-value ' + (c.cycleProfit > 0 ? 'positive' : '') }, money(c.cycleProfit)),
            h('div', { className: 'stat-sub' }, 'Since ' + money(c.startBal))
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Buffer'),
            h('div', { className: 'stat-value' }, money(c.buffer)),
            h('div', { className: 'stat-sub' }, 'Kept in account')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Total Paid Out'),
            h('div', { className: 'stat-value' }, money(acc.totalPayouts)),
            h('div', { className: 'stat-sub' }, (acc.payoutHistory || []).length + ' payouts')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Available to Pocket'),
            h('div', { className: 'stat-value positive' }, money(pk.takeHome)),
            h('div', { className: 'stat-sub' }, Math.round((c.split || 0) * 100) + '% split')
          )
        ),

        h('div', { className: 'grid-2 mb-24', style: { alignItems: 'flex-start' } },
          h('div', { className: 'glass-card' },
            h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Payout Breakdown')),
            h('div', { className: 'card-body' },
              h('div', { className: 'input-group' },
                h('label', { className: 'input-label' }, 'Withdraw amount'),
                h('div', { style: { display: 'flex', gap: 8 } },
                  h('input', { className: 'input-field', type: 'number', min: 0, step: 'any',
                    placeholder: (c.withdrawGross || 0).toFixed(2), value: amountStr,
                    onChange: function(e) { setAmountStr(e.target.value); } }),
                  h('button', { className: 'btn btn-secondary', onClick: function() { setAmountStr(''); } }, 'Max')
                ),
                !pk.valid
                  ? h('div', { className: 'input-hint', style: { color: 'var(--red)' } }, 'Amount must be above 0 and not more than ' + money(c.withdrawGross))
                  : h('div', { className: 'input-hint' }, 'Max ' + money(c.withdrawGross) + '. Leave empty to withdraw the maximum.')
              ),
              breakdown.map(function(row, i) {
                return h('div', { key: i, className: 'metric-row' },
                  h('span', { className: 'metric-name' }, row[0]),
                  h('span', { className: 'metric-val' }, row[1])
                );
              }),
              h('div', { className: 'metric-row', style: { marginTop: 4, paddingTop: 14 } },
                h('span', { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' } }, 'You Take Home'),
                h('span', { style: { fontSize: 16, fontWeight: 700, color: 'var(--green)' } }, money(pk.takeHome))
              )
            )
          ),

          h('div', { className: 'glass-card' },
            h('div', { className: 'card-header' },
              h('span', { className: 'card-title' }, 'Withdrawal Rules'),
              h('span', { className: 'badge ' + (c.isOnDemand ? 'badge-blue' : 'badge-gray') }, c.isOnDemand ? 'On Demand' : '14 Day')
            ),
            h('div', { className: 'card-body', style: { paddingTop: 4, paddingBottom: 4 } },
              rule(
                c.isOnDemand ? 'Growth 2%' : 'Positive P/L',
                c.isOnDemand
                  ? money(c.growthRequired) + ' needed' + (c.growthMet ? '' : ', ' + money(c.growthRemaining) + ' remaining')
                  : 'Cycle must be in profit',
                c.growthMet, 'Met', 'Not met'
              ),
              acc.consistencyRule ? rule(
                'Consistency (max ' + acc.consistencyRule + '%)',
                'Best day is ' + (c.consistencyPct || 0).toFixed(1) + '% of cycle profit',
                c.consistencyPasses, 'Pass', 'Fail',
                h('div', { style: { marginTop: 12 } },
                  h('div', { className: 'progress-track' },
                    h('div', { className: 'progress-fill ' + (c.consistencyPasses ? 'green' : 'red'),
                      style: { width: Math.min(100, ((c.consistencyPct || 0) / acc.consistencyRule) * 100) + '%' } })
                  ),
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10.5, color: 'var(--t3)' } },
                    h('span', null, '0%'),
                    h('span', null, acc.consistencyRule + '% max')
                  )
                )
              ) : null
            )
          )
        ),

        h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 8 } },
          c.canPayout
            ? h('button', { className: 'btn btn-primary', style: { padding: '12px 32px', fontSize: 14, opacity: pk.valid ? 1 : 0.45 }, disabled: !pk.valid, onClick: doPayout },
                'Request Payout  ' + money(pk.takeHome))
            : h('div', { className: 'alert alert-warning', style: { margin: 0 } },
                !c.growthMet
                  ? (c.isOnDemand ? 'Need ' + money(c.growthRemaining) + ' more profit to reach the 2% growth requirement' : 'No profit in this cycle yet')
                  : !c.consistencyPasses
                    ? 'Consistency rule not met (' + (c.consistencyPct || 0).toFixed(1) + '% is above ' + acc.consistencyRule + '%)'
                    : 'Cycle profit has to be above the ' + money(c.buffer) + ' buffer first'),
          h('div', { style: { fontSize: 11.5, color: 'var(--t3)' } }, 'Buffer is set per account in Settings, Payout tab')
        )
      ),

      tab === 'history' && (history.length === 0
        ? h('div', { className: 'empty-state' },
            h('div', { className: 'empty-title' }, 'No payouts yet'),
            h('div', { className: 'empty-desc' }, 'Completed payouts will appear here')
          )
        : h(PayoutHistoryTable, {
            rows: history, onDelete: setDelIdx,
            columns: [
              { label: 'Date', value: function(r) { return r.date; } },
              { label: 'Time', value: function(r) { return r.time || ''; } },
              { label: 'Balance Before', value: function(r) { return money(r.balanceBefore); } },
              { label: 'Withdrawn', value: function(r) { return money(r.withdrawn !== undefined ? r.withdrawn : r.grossProfit); } },
              { label: 'Split', value: function(r) { return (r.profitSplit || 90) + '%'; } },
              { label: 'Take Home', value: function(r) { return money(r.takeHome !== undefined ? r.takeHome : (r.available !== undefined ? r.available : r.netPayout)); }, style: function() { return { color: 'var(--green)', fontWeight: 600 }; } },
            ],
          })
      )
    ),
    h(UI.ConfirmModal, {
      open: delIdx !== null, onClose: function() { setDelIdx(null); }, onConfirm: removeRecord,
      title: 'Delete payout', message: 'This payout will be removed. The balance, cycle, split and buffer go back to how they were before it.',
    })
  );
}

window.PayoutPage = PayoutPage;
