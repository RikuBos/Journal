
// ============================================================
// ACCOUNT FORM — Smart prop firm selector + auto-fill
// ============================================================
function AccountForm({ account, onSave, onClose }) {
  var firms    = ['FundedNext', 'E8 Markets', 'TopStep'];
  
  function getModels(firm, instrType) {
    var fd = PROP_FIRMS[firm];
    if (!fd) return [];
    var pool = instrType === 'futures' ? (fd.futures || {}) : (fd.cfd || {});
    return Object.keys(pool);
  }

  function getSizes(firm, instrType, model) {
    var fd = PROP_FIRMS[firm];
    if (!fd) return [];
    var pool = instrType === 'futures' ? (fd.futures || {}) : (fd.cfd || {});
    var m = pool[model];
    if (!m) return [];
    return Object.keys(m.sizes).map(Number).sort(function(a,b){return a-b;});
  }

  // Determine available instr types for a firm
  function getInstrTypes(firm) {
    var fd = PROP_FIRMS[firm];
    if (!fd) return [];
    var types = [];
    if (fd.cfd)     types.push('cfd');
    if (fd.futures) types.push('futures');
    return types;
  }

  var initFirm = account ? (account.propFirm || 'FundedNext') : 'FundedNext';
  var initType = account ? (account.instrType || 'futures') : 'futures';
  var initModel= account ? (account.modelName || '') : '';
  var initSize = account ? (account.startingBalance || 0) : 0;

  var [firm,     setFirm]   = React.useState(initFirm);
  var [instrType,setInstr]  = React.useState(initType);
  var [modelName,setModel]  = React.useState(initModel);
  var [size,     setSize]   = React.useState(initSize);
  var [name,     setName]   = React.useState(account ? account.name : '');
  var [profitSplit, setProfitSplit] = React.useState(account ? (account.profitSplit || 90) : 90);
  var [phase,    setPhase]  = React.useState(account ? (account.phase || 'Funded') : 'Funded');
  var [status,   setStatus]    = React.useState(account ? (account.status || 'Active') : 'Active');
  var [cycleType, setCycleType] = React.useState(account ? (account.cycleType || 'on_demand') : 'on_demand');

  // Auto-fill rules when firm/model/size changes
  var modelData = React.useMemo(function() {
    return getPropFirmModel(firm, modelName, size);
  }, [firm, modelName, size]);

  var models = getModels(firm, instrType);
  var sizes  = getSizes(firm, instrType, modelName);
  var instrTypes = getInstrTypes(firm);

  var [initialized, setInitialized] = React.useState(false);
  React.useEffect(function() { setInitialized(true); }, []);

  // Auto-switch instrType if firm doesn't support current
  React.useEffect(function() {
    if (!initialized) return; // Don't reset on first render (editing existing)
    var types = getInstrTypes(firm);
    if (types.length > 0 && !types.includes(instrType)) {
      setInstr(types[0]);
    }
    setModel('');
    setSize(0);
  }, [firm]);

  React.useEffect(function() {
    if (!initialized) return;
    setModel('');
    setSize(0);
  }, [instrType]);

  React.useEffect(function() {
    if (sizes.length > 0 && !sizes.includes(size)) {
      setSize(sizes[0]);
    }
  }, [modelName]);

  function handleSave() {
    if (!name.trim() || !firm || !modelName || !size) {
      UI.toast('Fill in all required fields', 'error'); return;
    }
    var md = modelData;
    var sd = md ? md.sizeData : {};
    var acc = {
      id:              account ? account.id : ('acc-' + Date.now()),
      name:            name.trim(),
      propFirm:        firm,
      instrType:       instrType,
      modelName:       modelName,
      phase:           phase,
      status:          status,
      startingBalance: size,
      profitSplit:     profitSplit,
      // Auto-filled from model data
      profitTarget:    sd.phase1Target || sd.profitTarget || 0,
      phase2Target:    sd.phase2Target || 0,
      maxLoss:         sd.maxLoss || 0,
      dailyLoss:       sd.dailyLoss || 0,
      drawdownType:    md ? md.drawdownType : 'static',
      consistencyRule: md ? (md.consistencyRule || null) : null,
      rewardShare:     md ? md.rewardShare : profitSplit,
      // On-demand payout flag
      onDemandPayout:  md ? !!md.onDemandPayout : false,
      bufferRule:      md ? !!md.bufferRule : false,
      contractLimit:   sd.contractLimit || '',
      mllLock:         sd.mllLock || null,
      startingDD:      sd.startingDD || null,
      isActive:        account ? account.isActive : false,
      createdAt:       account ? account.createdAt : new Date().toISOString(),
      // Payout tracking
      totalPayouts:    account ? (account.totalPayouts || 0) : 0,
      payoutHistory:   account ? (account.payoutHistory || []) : [],
      cycleType:         cycleType,
      cycleStartBalance: account ? (account.cycleStartBalance || size) : size,
      // Phase-specific targets from model data
      phase1Target:      sd.phase1Target || sd.profitTarget || 0,
      phase2Target:      sd.phase2Target || 0,
    };
        onSave(acc);
    onClose();
  }

  var inp = function(label, val, setVal, opts) {
    return h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, label),
      h('input', Object.assign({ className: 'input-field', value: val,
        onChange: function(e) { setVal(e.target.value); } }, opts || {}))
    );
  };

  return h('div', null,
    // Account name
    inp('Account Name', name, setName, { placeholder: 'e.g. FundedNext $25K' }),

    // Firm + Type row
    h('div', { className: 'form-row', style: { gap: 12 } },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Prop Firm'),
        h(UI.CustomDropdown, {
          value: firm, onChange: setFirm,
          options: firms.map(function(f) { return { value: f, label: f }; }),
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Type'),
        h(UI.CustomDropdown, {
          value: instrType, onChange: setInstr,
          options: instrTypes.map(function(t) {
            return { value: t, label: t === 'cfd' ? 'CFD' : 'Futures' };
          }),
        })
      ),
    ),

    // Phase — below Type, before Model
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Phase'),
      h(UI.CustomDropdown, {
        value: phase, onChange: setPhase,
        options: (function() {
          var opts = [];
          if (modelData && modelData.phases >= 2) {
            opts.push({ value: 'Phase 1', label: 'Phase 1' });
            opts.push({ value: 'Phase 2', label: 'Phase 2' });
          } else if (modelData && modelData.phases === 1) {
            opts.push({ value: 'Phase 1', label: 'Phase 1' });
          }
          opts.push({ value: 'Funded', label: 'Funded' });
          return opts;
        })(),
        placeholder: 'Select phase',
      })
    ),

    // Model selector
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Account Model'),
      h(UI.CustomDropdown, {
        value: modelName, onChange: setModel,
        placeholder: 'Select model',
        options: models.map(function(m) { return { value: m, label: m }; }),
      })
    ),

    // Size selector
    modelName && h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Account Size'),
      h(UI.CustomDropdown, {
        value: size || '',
        onChange: function(v) { setSize(Number(v)); },
        placeholder: 'Select size',
        options: sizes.map(function(s) { return { value: s, label: '$' + s.toLocaleString() }; }),
      })
    ),

    // Profit Split + Cycle Type row
    h('div', { className: 'form-row', style: { gap: 12 } },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Profit Split'),
        h(UI.CustomDropdown, {
          value: profitSplit, onChange: function(v) { setProfitSplit(Number(v)); },
          options: [80, 85, 90, 95].map(function(n) { return { value: n, label: n + '%' }; }),
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Cycle Type'),
        h(UI.CustomDropdown, {
          value: cycleType, onChange: setCycleType,
          options: [
            { value: 'on_demand', label: 'On Demand' },
            { value: '14_day',   label: '14 Day' },
          ],
        })
      ),
    ),

    // Auto-filled rules preview (only when model+size selected)
    modelData && size ? h('div', { style: { background: 'rgba(191,219,254,0.05)', border: '1px solid rgba(191,219,254,0.10)', borderRadius: 10, padding: 14, marginBottom: 14 } },
      h('div', { style: { fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 } }, 'Auto-filled Rules'),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 20px' } },
        (function() {
          var sd  = modelData.sizeData;
          var rows = [
            ['Drawdown Type',  modelData.drawdownType],
            ['Max Loss',       sd.maxLoss    ? '$' + sd.maxLoss.toLocaleString()    : '—'],
            ['Daily Loss',     sd.dailyLoss  ? '$' + sd.dailyLoss.toLocaleString()  : 'None'],
            ['Reward Share',   modelData.rewardShare + '%'],
            ['Consistency',    modelData.consistencyRule ? modelData.consistencyRule + '%' : 'None'],
          ];
          // Show phase-specific target
          if (phase === 'Phase 1') rows.push(['Phase 1 Target', sd.phase1Target ? '$' + sd.phase1Target.toLocaleString() : (sd.profitTarget ? '$' + sd.profitTarget.toLocaleString() : '—')]);
          if (phase === 'Phase 2') rows.push(['Phase 2 Target', sd.phase2Target ? '$' + sd.phase2Target.toLocaleString() : '—']);
          if (sd.contractLimit)    rows.push(['Contract Limit', sd.contractLimit]);
          return rows.map(function(pair, i) {
            return h('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 } },
              h('span', { style: { color: 'var(--t3)' } }, pair[0]),
              h('span', { style: { color: 'var(--t1)', fontFamily: 'var(--mono)', fontSize: 11.5 } }, pair[1])
            );
          });
        })()
      )
    ) : null,

    // Status
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Account Status'),
      h(UI.CustomDropdown, {
        value: status, onChange: setStatus,
        options: ['Active','Passed','Failed','Archived'].map(function(s) { return { value: s, label: s }; }),
      })
    ),

    // Footer
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 } },
      h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
      h('button', { className: 'btn btn-primary', onClick: handleSave }, account ? 'Update Account' : 'Create Account')
    )
  );
}
