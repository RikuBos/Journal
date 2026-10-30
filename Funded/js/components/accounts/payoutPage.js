// ============================================================
// PAYOUT PAGE — On-demand payout calculator + history
// ============================================================


// ── BROKER PAYOUT — no rules, no buffer, direct withdrawal ──
function BrokerPayoutView(props) {
  var acc = props.acc, accounts = props.accounts, accTrades = props.accTrades;
  var upsertAccount = props.upsertAccount, settings = props.settings;
  var [amount, setAmount] = React.useState('');
  var [tab,    setTab]    = React.useState('withdraw');

  var totalPL   = accTrades.reduce(function(s, t) { return s + (t.profitLoss || 0); }, 0);
  var balance   = accountBalance(acc, totalPL);
  var withdrawn = acc.totalWithdrawn || 0;
  var history   = acc.payoutHistory || [];
  var amt       = parseFloat(amount);
  var valid     = amt > 0 && amt <= balance + 0.0001;

  async function doWithdraw() {
    if (!valid) return;
    var now  = new Date();
    var date = now.toISOString().slice(0, 10);
    var time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    var after = balance - amt;
    var record = { date: date, time: time, amount: amt, balanceBefore: balance, balanceAfter: after };
    await upsertAccount(Object.assign({}, acc, {
      totalWithdrawn: withdrawn + amt,
      totalPayouts:   (acc.totalPayouts || 0) + amt,
      payoutHistory:  history.concat(record),
    }));

    if (settings && settings.discordEnabled && settings.discordWebhookUrl) {
      var msg = [
        '===  PAYOUT  ===',
        'Account  : ' + acc.name + ' (Broker)',
        'Date     : ' + date + '  ' + time,
        '------------------------',
        'Payout   : $' + amt.toFixed(2),
        'Balance  : $' + after.toFixed(2),
      ].join('\n');
      fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '```\n' + msg + '\n```', username: settings.discordUsername || 'Trading Journal' }),
      }).catch(function() {});
    }
    setAmount('');
    UI.toast('Payout $' + amt.toFixed(2) + ' recorded', 'success');
  }

  return h('div', null,
    h('div', { className: 'page-header', style: { paddingBottom: 0 } },
      h('div', null,
        h('div', { className: 'page-title' }, 'Payout'),
        h('div', { className: 'page-subtitle' }, 'Broker   ' + acc.name)
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
        h('div', { className: 'grid-3 mb-16' },
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Balance'),
            h('div', { className: 'stat-value' }, '$' + balance.toFixed(2)),
            h('div', { className: 'stat-sub' }, 'Available to withdraw')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Total Withdrawn'),
            h('div', { className: 'stat-value positive' }, '$' + withdrawn.toFixed(2)),
            h('div', { className: 'stat-sub' }, history.length + ' payouts total')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Balance After'),
            h('div', { className: 'stat-value' }, '$' + (valid ? (balance - amt) : balance).toFixed(2)),
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
              'Payout' + (valid ? '  $' + amt.toFixed(2) : ''))
          )
        )
      ),
      tab === 'history' && (history.length === 0
        ? h('div', { className: 'empty-state' },
            h('div', { className: 'empty-title' }, 'No payouts yet'),
            h('div', { className: 'empty-desc' }, 'Completed payouts will appear here')
          )
        : h('div', { className: 'table-wrap' },
            h('table', { className: 'data-table' },
              h('thead', null, h('tr', null,
                ['Date', 'Time', 'Balance Before', 'Payout', 'Balance After'].map(function(col) { return h('th', { key: col }, col); })
              )),
              h('tbody', null,
                history.slice().reverse().map(function(p, i) {
                  return h('tr', { key: i },
                    h('td', null, p.date),
                    h('td', null, p.time || ''),
                    h('td', null, '$' + (p.balanceBefore || 0).toFixed(2)),
                    h('td', { style: { color: 'var(--green)', fontWeight: 600 } }, '$' + (p.amount || 0).toFixed(2)),
                    h('td', null, '$' + (p.balanceAfter || 0).toFixed(2))
                  );
                })
              )
            )
          )
      )
    )
  );
}

function PayoutPage() {
  var { accounts, activeAccountId, upsertAccount, trades, activeAccount, settings } = useApp();
  var [selectedAccId, setSelAcc] = React.useState(activeAccountId || '');
  var [tab, setTab] = React.useState('calculator');

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
    // only trades after the last payout count for the current cycle
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
    var takeHome    = withdrawGross * split;

    // consistency: best winning day must not exceed X% of the cycle profit
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
      split: split, withdrawGross: withdrawGross, takeHome: takeHome,
      consistencyPct: consistencyPct, consistencyPasses: consistencyPasses,
      growthRequired: growthRequired, growthMet: growthMet, growthRemaining: growthRemaining,
      isOnDemand: isOnDemand,
      canPayout: growthMet && consistencyPasses && withdrawGross > 0,
    };
  }, [acc, accTrades]);

  async function doPayout() {
    if (!acc || !calc || !calc.canPayout) return;
    var now  = new Date();
    var pad  = function(n) { return (n < 10 ? '0' : '') + n; };
    var date = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    var time = pad(now.getHours()) + ':' + pad(now.getMinutes());
    var balanceAfter = calc.currentBal - calc.withdrawGross;

    var record = {
      date: date, time: time, at: date + 'T' + time,
      balanceBefore: calc.currentBal, balanceAfter: balanceAfter,
      cycleProfit: calc.cycleProfit, buffer: calc.buffer,
      withdrawn: calc.withdrawGross, profitSplit: acc.profitSplit || 90,
      takeHome: calc.takeHome,
    };
    await upsertAccount(Object.assign({}, acc, {
      payoutHistory:     (acc.payoutHistory || []).concat(record),
      totalPayouts:      (acc.totalPayouts || 0) + calc.takeHome,
      totalWithdrawn:    (acc.totalWithdrawn || 0) + calc.withdrawGross,
      cycleStartBalance: balanceAfter,
    }));

    if (settings && settings.discordEnabled && settings.discordWebhookUrl) {
      var msg = [
        '===  PAYOUT  ===',
        'Account  : ' + acc.name + ' (' + acc.propFirm + ')',
        'Date     : ' + date + '  ' + time,
        '------------------------',
        'Payout   : $' + calc.takeHome.toFixed(2) + ' (after buffer)',
        'Buffer   : $' + calc.buffer.toFixed(2),
        '------------------------',
        'Balance  : $' + balanceAfter.toFixed(2),
      ].join('\n');
      fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '```\n' + msg + '\n```', username: settings.discordUsername || 'Trading Journal' }),
      }).catch(function() {});
    }
    UI.toast('Payout $' + calc.takeHome.toFixed(2) + ' recorded', 'success');
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

  var c = calc || {};
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
    ['Current Balance',               money(c.currentBal)],
    ['Cycle Start',                   money(c.startBal)],
    ['Cycle Profit',                  money(c.cycleProfit)],
    ['Buffer kept in account',        money(c.buffer)],
    ['Withdrawn from account',        money(c.withdrawGross)],
    ['Your split (' + Math.round((c.split || 0) * 100) + '%)', money(c.takeHome)],
  ];
  var history = (acc.payoutHistory || []).slice().reverse();

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
            h('div', { className: 'stat-value positive' }, money(c.takeHome)),
            h('div', { className: 'stat-sub' }, Math.round((c.split || 0) * 100) + '% split')
          )
        ),

        h('div', { className: 'grid-2 mb-24', style: { alignItems: 'flex-start' } },
          h('div', { className: 'glass-card' },
            h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Payout Breakdown')),
            h('div', { className: 'card-body' },
              breakdown.map(function(row, i) {
                return h('div', { key: i, className: 'metric-row' },
                  h('span', { className: 'metric-name' }, row[0]),
                  h('span', { className: 'metric-val' }, row[1])
                );
              }),
              h('div', { className: 'metric-row', style: { marginTop: 4, paddingTop: 14 } },
                h('span', { style: { fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' } }, 'You Take Home'),
                h('span', { style: { fontSize: 16, fontWeight: 700, color: 'var(--green)' } }, money(c.takeHome))
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
            ? h('button', { className: 'btn btn-primary', style: { padding: '12px 32px', fontSize: 14 }, onClick: doPayout },
                'Request Payout  ' + money(c.takeHome))
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
        : h('div', { className: 'table-wrap' },
            h('table', { className: 'data-table' },
              h('thead', null, h('tr', null,
                ['Date', 'Time', 'Balance Before', 'Withdrawn', 'Split', 'Take Home'].map(function(col) { return h('th', { key: col }, col); })
              )),
              h('tbody', null,
                history.map(function(p, i) {
                  var w  = p.withdrawn !== undefined ? p.withdrawn : p.grossProfit;
                  var th = p.takeHome  !== undefined ? p.takeHome  : (p.available !== undefined ? p.available : p.netPayout);
                  return h('tr', { key: i },
                    h('td', null, p.date),
                    h('td', null, p.time || ''),
                    h('td', null, money(p.balanceBefore)),
                    h('td', null, money(w)),
                    h('td', null, (p.profitSplit || 90) + '%'),
                    h('td', { style: { color: 'var(--green)', fontWeight: 600 } }, money(th))
                  );
                })
              )
            )
          )
      )
    )
  );
}

window.PayoutPage = PayoutPage;
