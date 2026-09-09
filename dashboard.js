// ============================================================
// DASHBOARD PAGE
// ============================================================
var uMemo = React.useMemo;

function DashboardPage() {
  const { activeAccount, accountTrades, trades } = useApp();
  const { Icon, StatBlock, MetricRow, ChartTooltip, EmptyState } = UI;

  // Recharts destructure — pulled from global window.Recharts
  const {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ReferenceLine, ResponsiveContainer, Cell,
  } = window.Recharts;

  const metrics     = uMemo(() => Calc.metrics(accountTrades), [accountTrades]);
  const streak      = uMemo(() => Calc.streak(accountTrades), [accountTrades]);
  const equityCurve = uMemo(() => Calc.equityCurve(accountTrades, activeAccount?.startingBalance || 0), [accountTrades, activeAccount]);
  const dailyPL     = uMemo(() => Calc.dailyPL(accountTrades), [accountTrades]);

  const totalPL   = metrics.totalPL;
  const balance   = activeAccount ? activeAccount.startingBalance + totalPL : 0;
  const profitPct = activeAccount ? (totalPL / activeAccount.startingBalance) * 100 : 0;

  const targetProgress = activeAccount && activeAccount.profitTarget > 0
    ? (Math.max(0, totalPL) / activeAccount.profitTarget) * 100 : 0;

  const curvePts = uMemo(() => {
    if (!activeAccount) return [];
    const sorted = [...accountTrades.filter(t => t.status === 'Closed')]
      .sort((a, b) => a.date.localeCompare(b.date));
    let bal = activeAccount.startingBalance;
    const pts = [{ label: 'Start', balance: bal }];
    sorted.forEach(t => { bal += (t.profitLoss || 0); pts.push({ label: t.date, balance: +bal.toFixed(2) }); });
    return pts;
  }, [accountTrades, activeAccount]);

  const ddInfo = uMemo(() => {
    if (!activeAccount) return { amount: 0, pct: 0, dailyDD: 0 };
    const vals = curvePts.map(p => p.balance);
    const dd   = Calc.maxDrawdown(vals);
    const dailyDD = Calc.dailyDrawdown(accountTrades);
    return { ...dd, dailyDD };
  }, [curvePts, accountTrades, activeAccount]);

  const ddPct      = activeAccount?.maxLoss  > 0 ? (ddInfo.amount   / activeAccount.maxLoss)  * 100 : 0;
  const dailyDDPct = activeAccount?.dailyLoss > 0 ? (ddInfo.dailyDD / activeAccount.dailyLoss) * 100 : 0;
  const ruleComply = Calc.ruleCompliance(accountTrades);

  const warnings = [];
  if (ddPct      > 70) warnings.push({ type: 'danger',  msg: `Max drawdown at ${ddPct.toFixed(0)}% of limit (${Calc.fmt.currency(ddInfo.amount)} / ${Calc.fmt.currency(activeAccount?.maxLoss)})` });
  if (dailyDDPct > 70) warnings.push({ type: 'danger',  msg: `Daily loss at ${dailyDDPct.toFixed(0)}% of daily limit today` });
  else if (ddPct > 40) warnings.push({ type: 'warning', msg: `Drawdown at ${ddPct.toFixed(0)}% of max — ${Calc.fmt.currency(activeAccount?.maxLoss - ddInfo.amount)} remaining` });

  if (!activeAccount) return h('div', { className: 'page-body', style: { paddingTop: 24 } },
    h(EmptyState, { icon: 'accounts', title: 'No account selected', desc: 'Create a funded account to start tracking your performance.', action: null })
  );

  return h('div', null,
    // ── Header ──
    h('div', { className: 'page-header' },
      h('div', null,
        h('div', { className: 'page-title' }, 'Dashboard'),
        h('div', { className: 'page-subtitle' }, activeAccount.propFirm + '   ' + activeAccount.name + '   ' + activeAccount.phase)
      ),
      h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
        h('span', { className: `badge ${activeAccount.status === 'Active' ? 'badge-green' : activeAccount.status === 'Passed' ? 'badge-blue' : 'badge-red'}` }, activeAccount.status)
      )
    ),

    h('div', { className: 'page-body' },

      // Warnings
      warnings.length > 0 && h('div', { className: 'mb-14' },
        warnings.map((w, i) => h('div', { key: i, className: `alert alert-${w.type}` },
          h(Icon, { name: 'alert', size: 13 }), w.msg
        ))
      ),

      // ── TOP KPI ROW ──
      h('div', { className: 'grid-5 mb-16', style: { gap: 14 } },
        h(StatBlock, {
          label: 'Current Balance',
          value: Calc.fmt.currency(balance),
          cls: totalPL >= 0 ? 'positive' : 'negative',
          sub: `Started: ${Calc.fmt.currency(activeAccount.startingBalance)}`,
        }),
        h(StatBlock, {
          label: 'Total P/L',
          value: Calc.fmt.currency(totalPL),
          cls: totalPL >= 0 ? 'positive' : 'negative',
          sub: profitPct.toFixed(2) + '% account',
        }),
        h(StatBlock, {
          label: 'Profit Target',
          value: Calc.fmt.currency(activeAccount.profitTarget),
          sub: `${Calc.fmt.currency(Math.max(0, activeAccount.profitTarget - Math.max(0, totalPL)))} remaining`,
          progressPct: targetProgress,
          progressColor: targetProgress >= 100 ? 'green' : 'blue',
        }),
        h(StatBlock, {
          label: 'Max Drawdown Used',
          value: Calc.fmt.currency(ddInfo.amount),
          cls: ddPct > 70 ? 'negative' : ddPct > 40 ? 'warning' : '',
          sub: `${ddPct.toFixed(0)}% of ${Calc.fmt.currency(activeAccount.maxLoss)}`,
          progressPct: ddPct,
          progressColor: ddPct > 70 ? 'red' : ddPct > 40 ? 'amber' : 'green',
        }),
        h(StatBlock, {
          label: 'Daily Loss Used',
          value: Calc.fmt.currency(ddInfo.dailyDD),
          cls: dailyDDPct > 70 ? 'negative' : '',
          sub: `${dailyDDPct.toFixed(0)}% of ${Calc.fmt.currency(activeAccount.dailyLoss)} today`,
          progressPct: dailyDDPct,
          progressColor: dailyDDPct > 70 ? 'red' : 'blue',
        }),
      ),

      // ── CHARTS ROW ──
      h('div', { className: 'grid-2 mb-16' },

        // Equity Curve
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' },
            h('span', { className: 'card-title' }, 'Equity Curve'),
            h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, `${metrics.totalTrades} trades`)
          ),
          h('div', { style: { padding: '6px 2px 2px' } },
            curvePts.length > 1
              ? h(ResponsiveContainer, { width: '100%', height: 170 },
                  h(LineChart, { data: curvePts, margin: { left: 0, right: 10, top: 4, bottom: 0 } },
                    h(CartesianGrid, { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }),
                    h(XAxis, { dataKey: 'label', tick: { fontSize: 9.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false }),
                    h(YAxis, { tick: { fontSize: 9.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false, tickFormatter: v => `$${v}`, width: 54 }),
                    h(Tooltip, { content: ChartTooltip }),
                    h(ReferenceLine, { y: activeAccount.startingBalance, stroke: 'rgba(255,255,255,0.25)', strokeDasharray: '3 3' }),
                    h(Line, { type: 'monotone', dataKey: 'balance', stroke: totalPL >= 0 ? 'var(--green)' : 'var(--red)', strokeWidth: 1.5, dot: false, activeDot: { r: 3 } })
                  )
                )
              : h('div', { style: { height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12 } }, 'Record trades to see equity curve')
          )
        ),

        // Daily P/L Bar
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' },
            h('span', { className: 'card-title' }, 'Daily P/L'),
            h('span', { style: { fontSize: 11, color: 'var(--t3)' } }, `${dailyPL.length} trading days`)
          ),
          h('div', { style: { padding: '6px 2px 2px' } },
            dailyPL.length > 0
              ? h(ResponsiveContainer, { width: '100%', height: 170 },
                  h(BarChart, { data: dailyPL, margin: { left: 0, right: 10, top: 4, bottom: 0 } },
                    h(CartesianGrid, { stroke: 'rgba(255,255,255,0.06)', strokeDasharray: '3 3' }),
                    h(XAxis, { dataKey: 'date', tick: { fontSize: 9.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false }),
                    h(YAxis, { tick: { fontSize: 9.5, fill: 'var(--t4)' }, tickLine: false, axisLine: false, tickFormatter: v => `$${v}`, width: 54 }),
                    h(Tooltip, { content: ChartTooltip }),
                    h(ReferenceLine, { y: 0, stroke: 'rgba(255,255,255,0.2)' }),
                    h(Bar, { dataKey: 'pl', radius: [2, 2, 0, 0], maxBarSize: 36, name: 'P/L' },
                      dailyPL.map((d, i) => h(Cell, { key: i, fill: d.pl >= 0 ? 'rgba(45,206,137,0.65)' : 'rgba(245,54,92,0.65)' }))
                    )
                  )
                )
              : h('div', { style: { height: 170, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t3)', fontSize: 12 } }, 'No daily P/L data yet')
          )
        )
      ),

      // ── STATS GRID ──
      h('div', { className: 'grid-3 mb-16' },

        // Performance
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Performance')),
          h('div', { className: 'card-body', style: { padding: '4px 16px' } },
            h(MetricRow, { label: 'Total Trades',  value: metrics.totalTrades }),
            h(MetricRow, { label: 'Winning',       value: metrics.winningTrades, cls: 'text-pos' }),
            h(MetricRow, { label: 'Losing',        value: metrics.losingTrades,  cls: 'text-neg' }),
            h(MetricRow, { label: 'Win Rate',      value: Calc.fmt.pct(metrics.winRate), cls: metrics.winRate >= 50 ? 'text-pos' : 'text-neg' }),
            h(MetricRow, { label: 'Profit Factor', value: isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : 'Perfect', cls: metrics.profitFactor >= 1.5 ? 'text-pos' : metrics.profitFactor >= 1 ? '' : 'text-neg' }),
            h(MetricRow, { label: 'Expectancy',    value: Calc.fmt.r(metrics.expectancy), cls: metrics.expectancy >= 0 ? 'text-pos' : 'text-neg' }),
          )
        ),

        // Averages
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Averages')),
          h('div', { className: 'card-body', style: { padding: '4px 16px' } },
            h(MetricRow, { label: 'Average Win',  value: Calc.fmt.currency(metrics.averageWin),  cls: 'text-pos' }),
            h(MetricRow, { label: 'Average Loss', value: Calc.fmt.currency(metrics.averageLoss), cls: 'text-neg' }),
            h(MetricRow, { label: 'Largest Win',  value: Calc.fmt.currency(metrics.largestWin),  cls: 'text-pos' }),
            h(MetricRow, { label: 'Largest Loss', value: Calc.fmt.currency(metrics.largestLoss), cls: 'text-neg' }),
            h(MetricRow, { label: 'Average R',    value: Calc.fmt.r(metrics.averageR) }),
            h(MetricRow, { label: 'Total R',      value: Calc.fmt.r(metrics.totalR), cls: metrics.totalR >= 0 ? 'text-pos' : 'text-neg' }),
          )
        ),

        // Streaks & Compliance
        h('div', { className: 'glass-card' },
          h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Streaks & Compliance')),
          h('div', { className: 'card-body', style: { padding: '4px 16px' } },
            h(MetricRow, { label: 'Current Streak', value: streak.current ? (streak.current + ' ' + (streak.type === 'win' ? 'W' : 'L')) : ' ', cls: streak.type === 'win' ? 'text-pos' : streak.type === 'loss' ? 'text-neg' : '' }),
            h(MetricRow, { label: 'Best Streak',    value: `${streak.best} W`, cls: 'text-pos' }),
            h(MetricRow, { label: 'Worst Streak',   value: `${streak.worst} L`, cls: 'text-neg' }),
            h(MetricRow, { label: 'Trading Days',   value: [...new Set(accountTrades.map(t => t.date))].length }),
            h(MetricRow, { label: 'Rule Compliance', value: Calc.fmt.pct(ruleComply), cls: ruleComply >= 80 ? 'text-pos' : ruleComply >= 60 ? '' : 'text-neg' }),
            h(MetricRow, { label: 'Avg Execution',  value: metrics.totalTrades ? (accountTrades.filter(t => t.status === 'Closed').reduce((s, t) => s + (t.executionQuality || 0), 0) / metrics.totalTrades).toFixed(1) + '/10' : ' ' }),
          )
        )
      ),

      // ── PROGRESS BARS ──
      h('div', { className: 'glass-card' },
        h('div', { className: 'card-header' }, h('span', { className: 'card-title' }, 'Account Progress')),
        h('div', { className: 'card-body' },
          h('div', { className: 'grid-3' },
            // Profit target
            h('div', null,
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--t3)' } },
                h('span', null, 'Profit Target'),
                h('span', { style: { color: 'var(--t1)', fontFamily: 'var(--mono)' } }, `${targetProgress.toFixed(0)}%`)
              ),
              h('div', { className: 'progress-track' },
                h('div', { className: `progress-fill ${targetProgress >= 100 ? 'green' : 'blue'}`, style: { width: `${Math.min(100, targetProgress)}%` } })
              ),
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--t4)' } },
                h('span', null, Calc.fmt.currency(Math.max(0, totalPL))),
                h('span', null, Calc.fmt.currency(activeAccount.profitTarget))
              )
            ),
            // Max Drawdown
            h('div', null,
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--t3)' } },
                h('span', null, 'Max Drawdown'),
                h('span', { style: { color: ddPct > 70 ? 'var(--red)' : 'var(--t1)', fontFamily: 'var(--mono)' } }, `${ddPct.toFixed(0)}%`)
              ),
              h('div', { className: 'progress-track' },
                h('div', { className: `progress-fill ${ddPct > 70 ? 'red' : ddPct > 40 ? 'amber' : 'green'}`, style: { width: `${Math.min(100, ddPct)}%` } })
              ),
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--t4)' } },
                h('span', null, Calc.fmt.currency(ddInfo.amount)),
                h('span', null, Calc.fmt.currency(activeAccount.maxLoss))
              )
            ),
            // Daily Loss
            h('div', null,
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: 'var(--t3)' } },
                h('span', null, 'Daily Loss (Today)'),
                h('span', { style: { color: dailyDDPct > 70 ? 'var(--red)' : 'var(--t1)', fontFamily: 'var(--mono)' } }, `${dailyDDPct.toFixed(0)}%`)
              ),
              h('div', { className: 'progress-track' },
                h('div', { className: `progress-fill ${dailyDDPct > 70 ? 'red' : 'blue'}`, style: { width: `${Math.min(100, dailyDDPct)}%` } })
              ),
              h('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--t4)' } },
                h('span', null, Calc.fmt.currency(ddInfo.dailyDD)),
                h('span', null, Calc.fmt.currency(activeAccount.dailyLoss))
              )
            )
          )
        )
      )
    )
  );
}

window.DashboardPage = DashboardPage;
