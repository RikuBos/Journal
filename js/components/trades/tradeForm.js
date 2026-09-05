// ============================================================
// TRADE FORM — Entry & Edit
// ============================================================
var useFS = React.useState;
var useFM = React.useMemo;
var useFR = React.useRef;

function RiskCalc({ account, instrument, onApply }) {
  var [v, setV] = useFS({
    balance: account?.startingBalance || 5000,
    riskPct: 1, entry: '', sl: '', tp: '', size: 1,
  });
  var set = function(k, val) { setV(function(p) { return Object.assign({}, p, {[k]: val}); }); };
  var pv       = getPointValue(instrument || 'NQ');
  var riskAmt  = v.entry && v.sl && v.size
    ? Calc.pointRisk(+v.entry, +v.sl, +v.size, instrument)
    : (v.balance * v.riskPct) / 100;
  var rr       = v.entry && v.sl && v.tp ? Calc.rr(+v.entry, +v.sl, +v.tp) : null;
  var potProfit = rr != null ? riskAmt * rr : null;
  return h('div', { style: { background: 'rgba(8,9,13,0.6)', border: '1px solid var(--border-1)', borderRadius: 8, padding: 14, marginBottom: 14 } },
    h('div', { className: 'section-heading' }, 'Risk Calculator'),
    h('div', { className: 'form-row' },
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Balance'), h('input', { className: 'input-field', type: 'number', value: v.balance, onChange: e => set('balance', +e.target.value) })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Risk %'), h('input', { className: 'input-field', type: 'number', step: 0.1, value: v.riskPct, onChange: e => set('riskPct', +e.target.value) })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Entry'), h('input', { className: 'input-field', type: 'number', step: 'any', value: v.entry, onChange: e => set('entry', e.target.value) })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Stop Loss'), h('input', { className: 'input-field', type: 'number', step: 'any', value: v.sl, onChange: e => set('sl', e.target.value) })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Take Profit'), h('input', { className: 'input-field', type: 'number', step: 'any', value: v.tp, onChange: e => set('tp', e.target.value) })),
      h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Size'), h('input', { className: 'input-field', type: 'number', step: 'any', value: v.size, onChange: e => set('size', e.target.value) })),
    ),
    h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: onApply ? 12 : 0 } },
      h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'Risk Amount'), h('div', { className: 'value text-neg' }, Calc.fmt.currency(riskAmt))),
      h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'Potential Profit'), h('div', { className: 'value text-pos' }, potProfit != null ? Calc.fmt.currency(potProfit) : '—')),
      h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'R:R'), h('div', { className: 'value' }, rr != null ? `1 : ${rr.toFixed(2)}` : '—')),
    ),
    onApply && h('button', { className: 'btn btn-secondary btn-sm', onClick: () => onApply({ entry: v.entry, sl: v.sl, tp: v.tp, size: v.size, riskPct: v.riskPct, riskAmt }) },
      h(UI.Icon, { name: 'zap', size: 12 }), 'Apply to Trade'
    )
  );
}

function TradeForm({ trade, onSave, onClose }) {
  const { activeAccount, accounts, settings } = useApp();
  const [tab,         setTab]    = useFS('basic');
  const [showCalc,    setCalc]   = useFS(false);
  const [images,      setImages] = useFS(trade?.screenshots || []);
  const [lightbox,    setLightbox] = useFS(null);

  const now    = new Date();
  const pad    = n => String(n).padStart(2, '0');
  const today  = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const [f, setF] = useFS({
    accountId:       trade?.accountId || activeAccount?.id || '',
    date:            trade?.date || today,
    time:            trade?.time || nowTime,
    session:         trade?.session || 'New York',
    instrument:      trade?.instrument || settings?.defaultInstrument || 'NQ',
    direction:       trade?.direction || 'Long',
    status:          trade?.status || 'Closed',
    entryPrice:      trade?.entryPrice || '',
    stopLoss:        trade?.stopLoss || '',
    takeProfit:      trade?.takeProfit || '',
    exitPrice:       trade?.exitPrice || '',
    positionSize:    trade?.positionSize || 1,
    riskPercentage:  trade?.riskPercentage || settings?.defaultRisk || 1,
    setup:           trade?.setup || '',
    marketCondition: trade?.marketCondition || 'Trending Up',
    timeframe:       trade?.timeframe || '15m',
    entryModel:      trade?.entryModel || '',
    confirmation:    trade?.confirmation || '',
    poi:             trade?.poi || '',
    liquidity:       trade?.liquidity || '',
    htfBias:         trade?.htfBias || 'Bullish',
    dailyBias:       trade?.dailyBias || 'Bullish',
    sessionBias:     trade?.sessionBias || 'Aligned',
    liquidityObjective: trade?.liquidityObjective || '',
    expectedDraw:    trade?.expectedDraw || '',
    newsRisk:        trade?.newsRisk || false,
    killzone:        trade?.killzone || '',
    htfPOI:          trade?.htfPOI || '',
    ltfConfirmation: trade?.ltfConfirmation || '',
    emotionBefore:   trade?.emotionBefore || 'Calm',
    emotionDuring:   trade?.emotionDuring || 'Calm',
    emotionAfter:    trade?.emotionAfter || 'Neutral',
    mistake:         trade?.mistake || '',
    mistakeSeverity: trade?.mistakeSeverity || '',
    ruleFollowed:    trade?.ruleFollowed !== undefined ? trade.ruleFollowed : true,
    ruleViolated:    trade?.ruleViolated || '',
    executionQuality: trade?.executionQuality || 7,
    tradeGrade:      trade?.tradeGrade || 'B',
    notes:           trade?.notes || '',
    whatWentRight:   trade?.whatWentRight || '',
    whatWentWrong:   trade?.whatWentWrong || '',
    lessonsLearned:  trade?.lessonsLearned || '',
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  // Auto-calcs
  var autoRisk = useFM(function() {
    if (!f.entryPrice || !f.stopLoss || !f.positionSize) return null;
    return Calc.pointRisk(+f.entryPrice, +f.stopLoss, +f.positionSize, f.instrument);
  }, [f.entryPrice, f.stopLoss, f.positionSize, f.instrument]);

  var autoRR = useFM(function() {
    if (!f.entryPrice || !f.stopLoss || !f.takeProfit) return null;
    return Calc.rr(+f.entryPrice, +f.stopLoss, +f.takeProfit);
  }, [f.entryPrice, f.stopLoss, f.takeProfit]);

  var autoPL = useFM(function() {
    if (!f.exitPrice || !f.entryPrice || !f.positionSize) return null;
    return Calc.pl(+f.entryPrice, +f.exitPrice, +f.positionSize, f.direction, f.instrument);
  }, [f.exitPrice, f.entryPrice, f.positionSize, f.direction, f.instrument]);

  var autoRM = useFM(() => {
    if (autoPL == null || !autoRisk) return null;
    return +(autoPL / autoRisk).toFixed(2);
  }, [autoPL, autoRisk]);

  const handleImages = e => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setImages(p => [...p, { id: genId(), tradeId: trade?.id || 'new', category: 'Entry', dataUrl: ev.target.result, filename: file.name, uploadedAt: new Date().toISOString() }]);
      reader.readAsDataURL(file);
    });
  };

  const handleSave = () => {
    onSave({
      ...f,
      id:          trade?.id,
      screenshots: images,
      riskAmount:  autoRisk || 0,
      profitLoss:  autoPL   != null ? autoPL  : (+f.profitLoss  || 0),
      rMultiple:   autoRM   != null ? autoRM  : (+f.rMultiple   || 0),
    });
    onClose();
  };

  const allSetups = [...SETUPS,         ...(settings?.customSetups         || [])];
  const allConfs  = [...CONFIRMATIONS,  ...(settings?.customConfirmations  || [])];
  const allPOIs   = [...POIS,           ...(settings?.customPOIs           || [])];

  const selField = (label, key, options, placeholder) =>
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, label),
      h('select', { className: 'select-field', value: f[key], onChange: e => set(key, e.target.value) },
        placeholder && h('option', { value: '' }, placeholder),
        options.map(o => h('option', { key: o, value: o }, o))
      )
    );

  const txtField = (label, key, placeholder) =>
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, label),
      h('input', { className: 'input-field', placeholder: placeholder || '', value: f[key], onChange: e => set(key, e.target.value) })
    );

  const taField = (label, key, placeholder) =>
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, label),
      h('textarea', { className: 'textarea-field', placeholder: placeholder || '', value: f[key], onChange: e => set(key, e.target.value) })
    );

  const numField = (label, key, step) =>
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, label),
      h('input', { className: 'input-field', type: 'number', step: step || 'any', value: f[key], onChange: e => set(key, e.target.value) })
    );

  const tabs = {
    basic: h('div', null,
      h('div', { className: 'form-row' },
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Date'), h('input', { type: 'date', className: 'input-field', value: f.date, onChange: e => set('date', e.target.value) })),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Time'), h('input', { type: 'time', className: 'input-field', value: f.time, onChange: e => set('time', e.target.value) })),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'Account'),
          h('select', { className: 'select-field', value: f.accountId, onChange: e => set('accountId', e.target.value) },
            accounts.map(a => h('option', { key: a.id, value: a.id }, a.name))
          )
        ),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' },
            'Instrument',
            f.instrument && h('span', { style: { color: 'var(--t3)', fontWeight: 400, marginLeft: 6 } },
              '— ' + Calc.fmt.currency(getPointValue(f.instrument)) + '/pt'
            )
          ),
          h('select', { className: 'select-field', value: f.instrument, onChange: e => set('instrument', e.target.value) },
            INSTRUMENTS.map(i => h('option', { key: i, value: i }, i))
          )
        ),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'Direction'),
          h('div', { className: 'toggle-group' },
            ['Long','Short'].map(d => h('div', { key: d, className: `toggle-opt ${f.direction === d ? 'active' : ''}`, onClick: () => set('direction', d) }, d))
          )
        ),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'Status'),
          h('select', { className: 'select-field', value: f.status, onChange: e => set('status', e.target.value) },
            ['Open','Closed','Cancelled'].map(s => h('option', { key: s, value: s }, s))
          )
        ),
        selField('Session',   'session',   SESSIONS,   null),
        selField('Timeframe', 'timeframe', TIMEFRAMES, null),
      ),
      h('div', { className: 'section-heading', style: { marginTop: 4 } }, 'Price Levels'),
      h('div', { className: 'form-row3' },
        numField('Entry Price',    'entryPrice',   'any'),
        numField('Stop Loss',      'stopLoss',     'any'),
        numField('Take Profit',    'takeProfit',   'any'),
        numField('Exit Price',     'exitPrice',    'any'),
        numField('Position Size',  'positionSize', 'any'),
        numField('Risk %',         'riskPercentage', 0.1),
      ),
      // Auto-calc display
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 } },
        h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'Risk Amount (auto)'), h('div', { className: `value ${autoRisk ? 'text-neg' : 'text-muted'}` }, autoRisk != null ? Calc.fmt.currency(autoRisk) : '—')),
        h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'P/L (auto)'),         h('div', { className: `value ${autoPL == null ? 'text-muted' : autoPL >= 0 ? 'text-pos' : 'text-neg'}` }, autoPL != null ? Calc.fmt.currency(autoPL) : '—')),
        h('div', { className: 'calc-display' }, h('div', { className: 'label' }, 'R:R (auto)'),         h('div', { className: 'value' }, autoRR != null ? `1 : ${autoRR.toFixed(2)}` : '—')),
      ),
      h('button', { className: 'btn btn-secondary btn-sm', style: { marginBottom: 14 }, onClick: () => setCalc(p => !p) }, h(UI.Icon, { name: 'zap', size: 12 }), showCalc ? 'Hide Calculator' : 'Risk Calculator'),
      showCalc && h(RiskCalc, { account: activeAccount, instrument: f.instrument }),
    ),

    setup: h('div', null,
      h('div', { className: 'form-row' },
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Setup'), h('select', { className: 'select-field', value: f.setup, onChange: e => set('setup', e.target.value) }, h('option', { value: '' }, '— Select Setup —'), allSetups.map(s => h('option', { key: s, value: s }, s)))),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Confirmation'), h('select', { className: 'select-field', value: f.confirmation, onChange: e => set('confirmation', e.target.value) }, h('option', { value: '' }, '— Select Confirmation —'), allConfs.map(c => h('option', { key: c, value: c }, c)))),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'POI'), h('select', { className: 'select-field', value: f.poi, onChange: e => set('poi', e.target.value) }, h('option', { value: '' }, '— Select POI —'), allPOIs.map(p => h('option', { key: p, value: p }, p)))),
        selField('Market Condition', 'marketCondition', MARKET_CONDITIONS, null),
        txtField('Entry Model', 'entryModel', 'e.g. ICT Judas Swing'),
        txtField('Liquidity',   'liquidity',  'e.g. Buy Side Liquidity'),
      ),
      h('div', { className: 'section-heading' }, 'Market Context'),
      h('div', { className: 'form-row' },
        selField('HTF Bias',   'htfBias',   BIASES, null),
        selField('Daily Bias', 'dailyBias', BIASES, null),
        txtField('Liquidity Objective', 'liquidityObjective', 'e.g. Previous Day High'),
        txtField('Expected Draw',       'expectedDraw',       'e.g. Premium Array'),
        txtField('Killzone',            'killzone',           'e.g. NY Open Killzone'),
        txtField('HTF POI',             'htfPOI',             'e.g. Daily FVG'),
        txtField('LTF Confirmation',    'ltfConfirmation',    'e.g. MSS on 5m'),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'High Impact News'),
          h('div', { style: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 6 } },
            h('div', { className: `checkbox ${f.newsRisk ? 'checked' : ''}`, onClick: () => set('newsRisk', !f.newsRisk) },
              f.newsRisk && h(UI.Icon, { name: 'check', size: 10, color: '#fff' })
            ),
            h('span', { style: { fontSize: 12.5, color: 'var(--t2)' } }, 'Trade during high-impact news')
          )
        ),
      )
    ),

    review: h('div', null,
      h('div', { className: 'form-row' },
        selField('Trade Grade',      'tradeGrade',      GRADES,     null),
        h('div', { className: 'input-group' }, h('label', { className: 'input-label' }, 'Execution (1-10)'), h('input', { className: 'input-field', type: 'number', min: 1, max: 10, value: f.executionQuality, onChange: e => set('executionQuality', +e.target.value) })),
        selField('Emotion Before',   'emotionBefore',   EMOTIONS,   null),
        selField('Emotion During',   'emotionDuring',   EMOTIONS,   null),
        selField('Emotion After',    'emotionAfter',    EMOTIONS,   null),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'Mistake'),
          h('input', { className: 'input-field', list: 'mistake-opts', placeholder: 'Select or type mistake', value: f.mistake, onChange: e => set('mistake', e.target.value) }),
          h('datalist', { id: 'mistake-opts' }, DEFAULT_MISTAKES.map(m => h('option', { key: m.id, value: m.name })))
        ),
        selField('Mistake Severity', 'mistakeSeverity', ['', ...SEVERITIES], null),
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Rule Compliance'),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 6 } },
          h('div', { className: `checkbox ${f.ruleFollowed ? 'checked' : ''}`, onClick: () => set('ruleFollowed', !f.ruleFollowed) },
            f.ruleFollowed && h(UI.Icon, { name: 'check', size: 10, color: '#fff' })
          ),
          h('span', { style: { fontSize: 12.5, color: 'var(--t2)' } }, 'All trading rules were followed')
        )
      ),
      !f.ruleFollowed && txtField('Rule Violated', 'ruleViolated', 'Describe which rule was violated'),
      taField('What Went Right',  'whatWentRight',  'What did you execute well?'),
      taField('What Went Wrong',  'whatWentWrong',  'What could have been done better?'),
      taField('Lessons Learned',  'lessonsLearned', 'Key takeaways from this trade'),
      taField('Notes',            'notes',          'Additional notes'),
    ),

    screenshots: h('div', null,
      h('label', { htmlFor: 'img-upload', className: 'upload-zone' },
        h(UI.Icon, { name: 'upload', size: 22, color: 'var(--t4)' }),
        h('div', { className: 'upload-text' }, 'Click to upload screenshots (PNG, JPG, WEBP)')
      ),
      h('input', { id: 'img-upload', type: 'file', accept: 'image/*', multiple: true, style: { display: 'none' }, onChange: handleImages }),
      images.length > 0 && h('div', { className: 'img-gallery', style: { marginTop: 10 } },
        images.map((img, i) => h('div', { key: img.id },
          h('div', { className: 'img-thumb', onClick: () => setLightbox(img.dataUrl) },
            h('img', { src: img.dataUrl, alt: img.filename }),
            h('div', { className: 'img-overlay' }, h(UI.Icon, { name: 'maximize', size: 16, color: '#fff' }))
          ),
          h('div', { style: { display: 'flex', gap: 4, marginTop: 4 } },
            h('select', { style: { flex: 1, background: 'rgba(8,9,13,0.8)', border: '1px solid var(--border-1)', borderRadius: 4, padding: '2px 4px', fontSize: 10, color: 'var(--t3)' }, value: img.category, onChange: e => { const upd = [...images]; upd[i] = { ...img, category: e.target.value }; setImages(upd); } },
              ['Before Entry','Entry','After Exit'].map(c => h('option', { key: c, value: c }, c))
            ),
            h('button', { style: { background: 'rgba(245,54,92,0.1)', border: '1px solid rgba(245,54,92,0.2)', borderRadius: 4, padding: '2px 6px', cursor: 'pointer', color: 'var(--red)' }, onClick: () => setImages(p => p.filter((_, idx) => idx !== i)) }, h(UI.Icon, { name: 'trash', size: 11 }))
          )
        ))
      ),
      h(UI.Lightbox, { src: lightbox, onClose: () => setLightbox(null) })
    ),
  };

  return h('div', null,
    h('div', { className: 'tab-bar', style: { marginBottom: 16 } },
      [
        { id: 'basic',       label: 'Trade Details' },
        { id: 'setup',       label: 'Setup & Context' },
        { id: 'review',      label: 'Review' },
        { id: 'screenshots', label: `Screenshots (${images.length})` },
      ].map(t => h('div', { key: t.id, className: `tab-item ${tab === t.id ? 'active' : ''}`, onClick: () => setTab(t.id) }, t.label))
    ),
    tabs[tab],
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-1)' } },
      h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
      h('button', { className: 'btn btn-primary',   onClick: handleSave }, trade ? 'Update Trade' : 'Save Trade')
    )
  );
}

window.TradeForm = TradeForm;
