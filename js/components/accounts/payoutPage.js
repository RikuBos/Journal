// ============================================================
// PAYOUT PAGE — On-demand payout calculator + history
// ============================================================

function PayoutPage() {
  var { accounts, activeAccountId, upsertAccount, trades, activeAccount, settings } = useApp();
  var [selectedAccId, setSelAcc] = React.useState(activeAccountId || '');
  var [profitSplit,   setSplit]  = React.useState(90);
  var [taxRate,       setTax]    = React.useState(0);
  var [tab,           setTab]    = React.useState('calculator');

  var acc = React.useMemo(function() {
    var found = accounts.find(function(a) { return a.id === selectedAccId; }) || activeAccount;
    if (found && found.taxRate !== undefined) setTax(found.taxRate);
    return found;
  }, [selectedAccId, accounts]);

  var accTrades = React.useMemo(function() {
    if (!acc) return [];
    return trades.filter(function(t) { return t.accountId === acc.id && t.status === 'Closed'; });
  }, [trades, acc]);

  // Payout calculations
  var calc = React.useMemo(function() {
    if (!acc) return null;
    var startBal    = acc.cycleStartBalance || acc.startingBalance || 0;
    var rawBalance  = acc.startingBalance + accTrades.reduce(function(s,t) { return s + (t.profitLoss||0); }, 0);
    var currentBal  = rawBalance;
    // Gross profit is profit since the cycle start
    var grossProfit = Math.max(0, currentBal - startBal);
    var split       = (acc.profitSplit || profitSplit) / 100;
    var buffer      = 40; // $40 buffer to keep in account
    var grossPayout = grossProfit * split;
    var taxAmt      = grossPayout * (taxRate / 100);
    var netPayout   = grossPayout - taxAmt;
    var available   = Math.max(0, netPayout - buffer);

    // Consistency rule (for futures on-demand accounts)
    // Best single-day profit must not exceed 40% of total profit
    var consistencyPct = null;
    var consistencyPasses = true;
    if (acc.consistencyRule) {
      var dailyPLMap = {};
      accTrades.forEach(function(t) {
        var d = (t.date||'').slice(0,10);
        dailyPLMap[d] = (dailyPLMap[d]||0) + (t.profitLoss||0);
      });
      var dayVals = Object.values(dailyPLMap).filter(function(v) { return v > 0; });
      var bestDay = dayVals.length ? Math.max.apply(null, dayVals) : 0;
      consistencyPct = grossProfit > 0 ? (bestDay / grossProfit) * 100 : 0;
      consistencyPasses = consistencyPct <= acc.consistencyRule;
    }

    // Growth requirement: need 2% above cycle start
    var isOnDemand      = !acc.cycleType || acc.cycleType === 'on_demand';
    var growthRequired  = isOnDemand ? startBal * 0.02 : 0; // 14-day: no growth req
    var growthMet       = isOnDemand ? grossProfit >= growthRequired : grossProfit > 0;
    var growthRemaining = Math.max(0, growthRequired - grossProfit);

    return {
      startBal, currentBal, grossProfit, grossPayout,
      taxAmt, netPayout, available, buffer,
      split, taxRate,
      consistencyPct, consistencyPasses,
      growthRequired, growthMet, growthRemaining,
      canPayout: growthMet && consistencyPasses && grossProfit > 0,
      isOnDemand,
    };
  }, [acc, accTrades, profitSplit, taxRate]);

  async function doPayout() {
    if (!acc || !calc || !calc.canPayout) return;

    var payoutRecord = {
      date:         new Date().toISOString().slice(0,10),
      grossProfit:  calc.grossProfit,
      grossPayout:  calc.grossPayout,
      taxAmt:       calc.taxAmt,
      netPayout:    calc.netPayout,
      available:    calc.available,
      balanceBefore:calc.currentBal,
      profitSplit:  acc.profitSplit || profitSplit,
      taxRate:      taxRate,
    };
    var history      = (acc.payoutHistory || []).concat(payoutRecord);
    var totalPayouts = (acc.totalPayouts || 0) + calc.available;

    // Cycle reset: starting balance + $40 buffer
    var newCycleStart = acc.startingBalance + 40;

    await upsertAccount(Object.assign({}, acc, {
      totalPayouts:      totalPayouts,
      payoutHistory:     history,
      cycleStartBalance: newCycleStart,
      taxRate:           taxRate,
    }));

    // Send Discord notification
    if (settings && settings.discordEnabled && settings.discordWebhookUrl) {
      var msg = [
        'PAYOUT  ' + payoutRecord.date,
        'Account: ' + acc.name + '  (' + acc.propFirm + ')',
        'Gross Profit:      $' + calc.grossProfit.toFixed(2),
        'Your Split (' + (acc.profitSplit || 90) + '%): $' + calc.grossPayout.toFixed(2),
        'Tax (' + taxRate + '%):         -$' + calc.taxAmt.toFixed(2),
        'Buffer:            -$40.00',
        'You Take Home:     $' + calc.available.toFixed(2),
        'New Cycle Start:   $' + newCycleStart.toLocaleString(),
      ].join('\n');
      fetch(settings.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '```\n' + msg + '\n```',
          username: settings.discordUsername || 'Trading Journal',
        }),
      }).catch(function() {});
    }

    UI.toast('Payout $' + calc.available.toFixed(2) + ' recorded. Cycle reset.', 'success');
  }

  if (!acc) return h('div', { className: 'page-header' },
    h('div', null,
      h('div', { className: 'page-title' }, 'Payout'),
      h('div', { className: 'page-subtitle' }, 'No account selected')
    )
  );

  var c = calc || {};

  return h('div', null,
    // Header
    h('div', { className: 'page-header', style: { paddingBottom: 0 } },
      h('div', null,
        h('div', { className: 'page-title' }, 'Payout'),
        h('div', { className: 'page-subtitle' }, acc.propFirm + '  ' + acc.name)
      ),
      h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
        h(UI.CustomDropdown, {
          value: selectedAccId,
          onChange: setSelAcc,
          options: accounts.map(function(a) { return { value: a.id, label: a.name }; }),
          placeholder: 'Select account',
        })
      )
    ),

    // Tabs
    h('div', { className: 'page-tabs' },
      ['calculator','history'].map(function(t) {
        return h('div', { key: t, className: 'page-tab' + (tab === t ? ' active' : ''), onClick: function() { setTab(t); } },
          t === 'calculator' ? 'Calculator' : 'History'
        );
      })
    ),

    h('div', { className: 'page-body' },

      tab === 'calculator' && h('div', null,

        // Status cards row
        h('div', { className: 'grid-4 mb-16' },
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Cycle Profit'),
            h('div', { className: 'stat-value ' + (c.grossProfit > 0 ? 'positive' : '') },
              '$' + (c.grossProfit||0).toFixed(2)
            ),
            h('div', { className: 'stat-sub' }, 'Since $' + (c.startBal||0).toLocaleString() + ' cycle start')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Net Payout (After Tax)'),
            h('div', { className: 'stat-value positive' }, '$' + (c.netPayout||0).toFixed(2)),
            h('div', { className: 'stat-sub' }, (acc.profitSplit||profitSplit) + '% split, ' + taxRate + '% tax')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Total Paid Out'),
            h('div', { className: 'stat-value' }, '$' + (acc.totalPayouts||0).toFixed(2)),
            h('div', { className: 'stat-sub' }, (acc.payoutHistory||[]).length + ' payouts total')
          ),
          h('div', { className: 'stat-block' },
            h('div', { className: 'stat-label' }, 'Available to Pocket'),
            h('div', { className: 'stat-value positive' }, '$' + (c.available||0).toFixed(2)),
            h('div', { className: 'stat-sub' }, '$' + (c.buffer||40) + ' buffer kept in account')
          ),
        ),

        h('div', { className: 'grid-2 mb-16' },
          // Calculation breakdown
          h('div', { className: 'glass-card' },
            h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Payout Breakdown')),
            h('div', { className: 'card-body' },
              [
                ['Current Balance',    '$' + (c.currentBal||0).toFixed(2)],
                ['Cycle Start',        '$' + (c.startBal||0).toFixed(2)],
                ['Gross Profit',       '$' + (c.grossProfit||0).toFixed(2)],
                ['Your Split (' + (acc.profitSplit||profitSplit) + '%)', '$' + (c.grossPayout||0).toFixed(2)],
                ['Tax Estimate (' + taxRate + '%)', '-$' + (c.taxAmt||0).toFixed(2)],
                ['Net After Tax',      '$' + (c.netPayout||0).toFixed(2)],
                ['Buffer (-$40)',      '-$40.00'],
                ['You Take Home',      '$' + (c.available||0).toFixed(2)],
              ].map(function(row, i) {
                var isTotal = i === 7;
                return h('div', { key: i, className: 'metric-row' },
                  h('span', { className: 'metric-name', style: isTotal ? { fontWeight: 600, color: 'var(--t1)' } : {} }, row[0]),
                  h('span', { className: 'metric-val', style: isTotal ? { color: 'var(--green)', fontWeight: 700 } : {} }, row[1])
                );
              })
            )
          ),

          // Rules status + settings
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: 14 } },
            // Rules compliance
            h('div', { className: 'glass-card' },
              h('div', { className: 'card-header' }, 
              h('span', { className: 'card-title' }, 'Withdrawal Rules'),
              h('span', { className: 'badge ' + (acc.cycleType === '14_day' ? 'badge-gray' : 'badge-blue') },
                acc.cycleType === '14_day' ? '14 Day Cycle' : 'On Demand'
              )
            ),
              h('div', { className: 'card-body' },
                // Growth 2% rule
                h('div', { className: 'metric-row' },
                  h('div', null,
                    h('div', { style: { fontSize: 13, color: 'var(--t2)' } }, (c.isOnDemand ? '2% Growth Requirement (On Demand)' : 'Positive P/L Required (14-Day)')),
                    h('div', { style: { fontSize: 11, color: 'var(--t3)', marginTop: 2 } },
                      '$' + (c.growthRequired||0).toFixed(2) + ' needed' +
                      (c.growthMet ? '' : '  —  $' + (c.growthRemaining||0).toFixed(2) + ' remaining')
                    )
                  ),
                  h('div', { style: {
                    padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                    background: c.growthMet ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    color: c.growthMet ? 'var(--green)' : 'var(--red)',
                  } }, c.growthMet ? 'Met' : 'Not Met')
                ),

                // Consistency rule (only for accounts with it)
                acc.consistencyRule && h('div', { className: 'metric-row' },
                  h('div', null,
                    h('div', { style: { fontSize: 13, color: 'var(--t2)' } },
                      'Consistency Rule (max ' + acc.consistencyRule + '%)'
                    ),
                    h('div', { style: { fontSize: 11, color: 'var(--t3)', marginTop: 2 } },
                      'Best day = ' + (c.consistencyPct||0).toFixed(1) + '% of total profit'
                    )
                  ),
                  h('div', { style: {
                    padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 600,
                    background: c.consistencyPasses ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    color: c.consistencyPasses ? 'var(--green)' : 'var(--red)',
                  } }, c.consistencyPasses ? 'Pass' : 'Fail'),

                  // Consistency progress bar
                  h('div', { style: { marginTop: 8 } },
                    h('div', { className: 'progress-track' },
                      h('div', { className: 'progress-fill ' + (c.consistencyPasses ? 'green' : 'red'),
                        style: { width: Math.min(100, c.consistencyPct||0) + '%' } })
                    ),
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 4 } },
                      h('span', { style: { fontSize: 10, color: 'var(--t3)' } }, '0%'),
                      h('span', { style: { fontSize: 10, color: c.consistencyPasses ? 'var(--green)' : 'var(--red)' } },
                        (c.consistencyPct||0).toFixed(1) + '%'
                      ),
                      h('span', { style: { fontSize: 10, color: 'var(--t3)' } }, acc.consistencyRule + '% max')
                    )
                  )
                )
              )
            ),

            // Tax & split settings
            h('div', { className: 'glass-card' },
              h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Settings')),
              h('div', { className: 'card-body' },
                h('div', { className: 'input-group' },
                  h('label', { className: 'input-label' }, 'Profit Split'),
                  h(UI.CustomDropdown, {
                    value: acc.profitSplit || profitSplit,
                    onChange: function(v) { setSplit(Number(v)); },
                    options: [80, 85, 90, 95].map(function(n) { return { value: n, label: n + '%' }; }),
                  })
                ),
                h('div', { className: 'input-group' },
                  h('label', { className: 'input-label' }, 'Tax Rate (%)'),
                  h('input', { className: 'input-field', type: 'number', min: 0, max: 50,
                    value: taxRate,
                    onChange: function(e) { setTax(Number(e.target.value) || 0); },
                    onBlur: async function(e) {
                      var v = Number(e.target.value) || 0;
                      if (acc) await upsertAccount(Object.assign({}, acc, { taxRate: v }));
                    },
                  })
                )
              )
            )
          )
        ),

        // Payout button
        h('div', { style: { display: 'flex', justifyContent: 'center', marginTop: 8 } },
          c.canPayout
            ? h('button', { className: 'btn btn-primary', style: { padding: '12px 32px', fontSize: 14 }, onClick: doPayout },
                'Request Payout  —  $' + (c.available||0).toFixed(2) + ' to pocket'
              )
            : h('div', { className: 'alert alert-warning', style: { maxWidth: 400, textAlign: 'center' } },
                h('div', null,
                  !c.growthMet
                    ? 'Need $' + (c.growthRemaining||0).toFixed(2) + ' more profit to meet 2% growth requirement'
                    : !c.consistencyPasses
                      ? 'Consistency rule not met (' + (c.consistencyPct||0).toFixed(1) + '% > ' + acc.consistencyRule + '% max)'
                      : 'No profit to payout yet'
                )
              )
        )
      ),

      // History tab
      tab === 'history' && h('div', null,
        !(acc.payoutHistory||[]).length
          ? h('div', { className: 'empty-state' },
              h('div', { className: 'empty-title' }, 'No payouts yet'),
              h('div', { className: 'empty-desc' }, 'Completed payouts will appear here')
            )
          : h('div', { className: 'table-wrap' },
              h('table', { className: 'data-table' },
                h('thead', null, h('tr', null,
                  ['Date','Balance Before','Gross Profit','Split','Tax','Net Payout'].map(function(col) {
                    return h('th', { key: col }, col);
                  })
                )),
                h('tbody', null,
                  (acc.payoutHistory||[]).slice().reverse().map(function(p, i) {
                    return h('tr', { key: i },
                      h('td', null, p.date),
                      h('td', null, '$' + (p.balanceBefore||0).toFixed(2)),
                      h('td', { style: { color: 'var(--green)' } }, '$' + (p.grossProfit||0).toFixed(2)),
                      h('td', null, (p.profitSplit||90) + '%'),
                      h('td', { style: { color: 'var(--red)' } }, '-$' + (p.taxAmt||0).toFixed(2)),
                      h('td', { style: { color: 'var(--green)', fontWeight: 600 } }, '$' + (p.netPayout||0).toFixed(2))
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
