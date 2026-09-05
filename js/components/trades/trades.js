// ============================================================
// TRADES PAGE
// ============================================================
var useTP = React.useState;
var useTM = React.useMemo;

function TradeDrawer({ trade, onClose, onEdit }) {
  const [lightbox, setLightbox] = useTP(null);
  if (!trade) return null;
  return h(React.Fragment, null,
    h('div', { className: 'drawer-overlay', onClick: onClose }),
    h('div', { className: 'drawer open' },
      h('div', { className: 'drawer-header' },
        h('div', null,
          h('div', { style: { fontSize: 14, fontWeight: 650, color: 'var(--t1)' } }, (trade.instrument || '') + ' | ' + (trade.direction || '')),
          h('div', { style: { fontSize: 11, color: 'var(--t3)', marginTop: 2 } }, `${trade.date} ${trade.time || ''} · ${trade.session}`)
        ),
        h('button', { className: 'modal-close', onClick: onClose }, h(UI.Icon, { name: 'x', size: 14 }))
      ),
      h('div', { className: 'drawer-body' },
        // P/L header
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 } },
          h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'P/L'), h('div', { className: `value ${(trade.profitLoss||0) >= 0 ? 'text-pos' : 'text-neg'}` }, Calc.fmt.currency(trade.profitLoss||0))),
          h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'R Multiple'), h('div', { className: `value ${(trade.rMultiple||0) >= 0 ? 'text-pos' : 'text-neg'}` }, Calc.fmt.r(trade.rMultiple))),
          h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'Grade'), h('div', { className: 'value' }, h(UI.GradeBadge, { grade: trade.tradeGrade }))),
        ),
        // Info grid
        h('div', { className: 'info-grid', style: { marginBottom: 14 } },
          ...[
            ['Setup',        trade.setup           || ' '],
            ['Confirmation', trade.confirmation     || ' '],
            ['POI',          trade.poi              || ' '],
            ['Entry Model',  trade.entryModel       || ' '],
            ['Entry',        trade.entryPrice       || ' '],
            ['Exit',         trade.exitPrice        || ' '],
            ['Stop Loss',    trade.stopLoss         || ' '],
            ['Take Profit',  trade.takeProfit       || ' '],
            ['Risk Amount',  Calc.fmt.currency(trade.riskAmount||0)],
            ['Size',         trade.positionSize     || ' '],
            ['HTF Bias',     trade.htfBias          || ' '],
            ['Condition',    trade.marketCondition  || ' '],
          ].map(([label, val]) =>
            h('div', { key: label, className: 'info-item' },
              h('div', { className: 'info-label' }, label),
              h('div', { className: 'info-val text' }, val)
            )
          )
        ),
        // Emotions
        h('div', { style: { background: 'rgba(8,9,13,0.5)', border: '1px solid var(--border-1)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 } },
          h('div', { style: { fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 } }, 'Psychology'),
          h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 8 } },
            ['emotionBefore','emotionDuring','emotionAfter'].map((k, i) =>
              h('div', { key: k },
                h('div', { style: { fontSize: 9.5, color: 'var(--t4)', marginBottom: 3 } }, ['Before','During','After'][i]),
                h('span', { className: 'badge badge-gray' }, trade[k] || ' ')
              )
            )
          ),
          h('div', { style: { fontSize: 12, color: 'var(--t2)' } },
            'Execution: ', h('span', { style: { fontWeight: 600, color: 'var(--t1)' } }, `${trade.executionQuality || ' '}/10`),
            ' · Rule Followed: ', h('span', { style: { color: trade.ruleFollowed ? 'var(--green)' : 'var(--red)' } }, trade.ruleFollowed ? 'Yes' : 'No')
          )
        ),
        // Mistake
        trade.mistake && h('div', { className: 'alert alert-danger', style: { marginBottom: 14 } },
          h(UI.Icon, { name: 'alert', size: 13 }), `Mistake: ${trade.mistake}`, trade.mistakeSeverity ? ` (${trade.mistakeSeverity})` : ''
        ),
        // Text sections
        [
          { k: 'whatWentRight',  label: 'What Went Right' },
          { k: 'whatWentWrong',  label: 'What Went Wrong' },
          { k: 'lessonsLearned', label: 'Lessons Learned' },
          { k: 'notes',          label: 'Notes' },
        ].filter(({ k }) => trade[k]).map(({ k, label }) =>
          h('div', { key: k, style: { marginBottom: 12 } },
            h('div', { style: { fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 5 } }, label),
            h('div', { style: { fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.65, background: 'rgba(8,9,13,0.35)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-1)' } }, trade[k])
          )
        ),
        // Screenshots
        trade.screenshots?.length > 0 && h('div', null,
          h('div', { style: { fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 } }, `Screenshots (${trade.screenshots.length})`),
          h('div', { className: 'img-gallery' },
            trade.screenshots.map((img, i) =>
              h('div', { key: i },
                h('div', { className: 'img-thumb', onClick: () => setLightbox(img.dataUrl) },
                  h('img', { src: img.dataUrl, alt: img.filename }),
                  h('div', { className: 'img-overlay' }, h(UI.Icon, { name: 'maximize', size: 16, color: '#fff' }))
                ),
                h('div', { style: { fontSize: 9, color: 'var(--t4)', marginTop: 3, textAlign: 'center' } }, img.category)
              )
            )
          )
        ),
        h(UI.Lightbox, { src: lightbox, onClose: () => setLightbox(null) })
      )
    )
  );
}

function TradesPage() {
  const { trades, accounts, activeAccountId, upsertTrade, deleteTrade } = useApp();
  const [showForm,    setShowForm]    = useTP(false);
  const [editTrade,   setEditTrade]   = useTP(null);
  const [selected,    setSelected]    = useTP(null);
  const [confirmDel,  setConfirmDel]  = useTP(null);
  const [search,      setSearch]      = useTP('');
  const [filterAcc,   setFilterAcc]   = useTP(activeAccountId || '');
  const [filterSetup, setFilterSetup] = useTP('');
  const [filterDir,   setFilterDir]   = useTP('');
  const [filterGrade, setFilterGrade] = useTP('');
  const [sortKey,     setSortKey]     = useTP('date');
  const [sortDir,     setSortDir]     = useTP('desc');
  const [page,        setPage]        = useTP(1);
  const PER = 15;

  const filtered = useTM(() => {
    let list = [...trades];
    if (filterAcc)   list = list.filter(t => t.accountId === filterAcc);
    if (filterSetup) list = list.filter(t => t.setup === filterSetup);
    if (filterDir)   list = list.filter(t => t.direction === filterDir);
    if (filterGrade) list = list.filter(t => t.tradeGrade === filterGrade);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.instrument?.toLowerCase().includes(q) ||
        t.setup?.toLowerCase().includes(q) ||
        t.date?.includes(q) ||
        t.notes?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let av = sortKey === 'date' ? (a.date + (a.time||'')) : (a[sortKey] ?? '');
      let bv = sortKey === 'date' ? (b.date + (b.time||'')) : (b[sortKey] ?? '');
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return list;
  }, [trades, filterAcc, filterSetup, filterDir, filterGrade, search, sortKey, sortDir]);

  const paged      = filtered.slice((page-1)*PER, page*PER);
  const totalPages = Math.ceil(filtered.length / PER);

  const sort = (key) => { if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(key); setSortDir('desc'); } };
  const SH = ({ col }) => sortKey === col ? h(UI.Icon, { name: sortDir === 'asc' ? 'chevronR' : 'chevronD', size: 10, color: 'var(--accent)' }) : null;

  const handleSave = async (trade) => { await upsertTrade(trade); UI.toast(trade.id ? 'Trade updated' : 'Trade saved', 'success'); };
  const handleDel  = async (id)    => { await deleteTrade(id);   UI.toast('Trade deleted', 'success'); if (selected?.id === id) setSelected(null); };

  const uniqueSetups = [...new Set(trades.map(t => t.setup).filter(Boolean))];
  const hasFilter    = filterSetup || filterDir || filterGrade || search;

  const colMap = { date:'Date', instrument:'Instrument', direction:'Dir', setup:'Setup', session:'Session', entryPrice:'Entry', exitPrice:'Exit', riskAmount:'Risk', profitLoss:'P/L', rMultiple:'R', tradeGrade:'Grade', mistake:'Mistake' };

  return h('div', null,
    h('div', { className: 'page-header' },
      h('div', null,
        h('div', { className: 'page-title' }, 'Trades'),
        h('div', { className: 'page-subtitle' }, `${filtered.length} of ${trades.length} trades`)
      ),
      h('button', { className: 'btn btn-primary', onClick: () => { setEditTrade(null); setShowForm(true); } },
        'New Trade'
      )
    ),

    h('div', { className: 'page-body' },
      // Filters
      h('div', { style: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' } },
        h(UI.SearchInput, { value: search, onChange: setSearch }),
        h('select', { className: 'select-field filter-select', style: { width: 150 }, value: filterAcc, onChange: e => setFilterAcc(e.target.value) },
          h('option', { value: '' }, 'All Accounts'),
          accounts.map(a => h('option', { key: a.id, value: a.id }, a.name.substring(0, 22)))
        ),
        h('select', { className: 'select-field filter-select', style: { width: 130 }, value: filterSetup, onChange: e => setFilterSetup(e.target.value) },
          h('option', { value: '' }, 'All Setups'),
          uniqueSetups.map(s => h('option', { key: s, value: s }, s))
        ),
        h('select', { className: 'select-field filter-select', style: { width: 100 }, value: filterDir, onChange: e => setFilterDir(e.target.value) },
          h('option', { value: '' }, 'Direction'),
          ['Long','Short'].map(d => h('option', { key: d, value: d }, d))
        ),
        h('select', { className: 'select-field filter-select', style: { width: 90 }, value: filterGrade, onChange: e => setFilterGrade(e.target.value) },
          h('option', { value: '' }, 'Grade'),
          GRADES.map(g => h('option', { key: g, value: g }, g))
        ),
        hasFilter && h('button', { className: 'btn btn-ghost btn-sm', onClick: () => { setSearch(''); setFilterSetup(''); setFilterDir(''); setFilterGrade(''); } }, 'Clear filters')
      ),

      filtered.length === 0
        ? h(UI.EmptyState, {
            icon: 'trades', title: 'No trades found',
            desc: trades.length === 0 ? 'Add your first trade to start building your journal.' : 'No trades match your current filters.',
            action: trades.length === 0 && h('button', { className: 'btn btn-primary', onClick: () => setShowForm(true) }, 'Add Trade')
          })
        : h('div', { className: 'table-wrap' },
            h('table', { className: 'data-table' },
              h('thead', null,
                h('tr', null,
                  Object.keys(colMap).map(col =>
                    h('th', { key: col, onClick: () => sort(col), style: { userSelect: 'none' } },
                      colMap[col], ' ', h(SH, { col })
                    )
                  ),
                  h('th', null, '')
                )
              ),
              h('tbody', null,
                paged.map(t => h('tr', { key: t.id,
                className: 'row-editable',
                onClick: () => setSelected(t),
                onDoubleClick: e => {
                  UI.showContextMenu(e, [
                    { label: 'Edit Trade', icon: 'edit', action: () => { setEditTrade(t); setShowForm(true); setSelected(null); } },
                    { label: 'View Details', icon: 'eye', action: () => { setSelected(t); } },
                    { label: 'Delete Trade', icon: 'trash', danger: true, action: () => setConfirmDel(t.id) },
                  ]);
                },
                style: { cursor: 'pointer' },
              },
                  h('td', null, h('span', { style: { color: 'var(--t2)', fontFamily: 'inherit', fontSize: 12 } }, t.date)),
                  h('td', { className: 'text-col' }, t.instrument),
                  h('td', null, h(UI.DirBadge, { dir: t.direction })),
                  h('td', null, t.setup ? h('span', { className: 'badge badge-blue' }, t.setup) : h('span', { style: { color: 'var(--t4)' } }, ' ')),
                  h('td', null, h('span', { style: { color: 'var(--t3)', fontFamily: 'inherit', fontSize: 11 } }, t.session || ' ')),
                  h('td', null, t.entryPrice || ' '),
                  h('td', null, t.exitPrice  || ' '),
                  h('td', null, t.riskAmount ? Calc.fmt.currency(t.riskAmount) : ' '),
                  h('td', null, h(UI.PLText, { value: t.profitLoss, size: 'sm' })),
                  h('td', null, h(UI.RText,  { value: t.rMultiple })),
                  h('td', null, h(UI.GradeBadge, { grade: t.tradeGrade })),
                  h('td', null, t.mistake ? h('span', { className: 'badge badge-red', style: { maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' } }, t.mistake) : h('span', { style: { color: 'var(--t4)', fontSize: 10 } }, ' ')),
    
                ))
              )
            ),
            totalPages > 1 && h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 14px', borderTop: '1px solid var(--border-1)' } },
              h('button', { className: 'btn btn-secondary btn-sm', disabled: page === 1, onClick: () => setPage(p => p-1) }, h(UI.Icon, { name: 'chevronL', size: 12 })),
              h('span', { style: { fontSize: 12, color: 'var(--t3)' } }, `${page} / ${totalPages}`),
              h('button', { className: 'btn btn-secondary btn-sm', disabled: page === totalPages, onClick: () => setPage(p => p+1) }, h(UI.Icon, { name: 'chevronR', size: 12 }))
            )
          )
    ),

    // Trade Form Modal
    h(UI.Modal, { open: showForm, onClose: () => { setShowForm(false); setEditTrade(null); }, title: editTrade ? 'Edit Trade' : 'New Trade', size: 'lg' },
      h(TradeForm, { trade: editTrade, onSave: handleSave, onClose: () => { setShowForm(false); setEditTrade(null); } })
    ),

    // Trade Detail Drawer
    h(TradeDrawer, {
      trade: selected,
      onClose: () => setSelected(null),
      onEdit: () => { setEditTrade(selected); setShowForm(true); setSelected(null); },
    }),

    // Confirm Delete
    h(UI.ConfirmModal, {
      open: !!confirmDel, onClose: () => setConfirmDel(null),
      onConfirm: () => handleDel(confirmDel),
      title: 'Delete Trade', message: 'Permanently delete this trade? This cannot be undone.',
    })
  );
}

window.TradesPage = TradesPage;
