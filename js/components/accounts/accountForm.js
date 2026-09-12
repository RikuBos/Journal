
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
  var [status,   setStatus] = React.useState(account ? (account.status || 'Active') : 'Active');

  // Auto-fill rules when firm/model/size changes
  var modelData = React.useMemo(function() {
    return getPropFirmModel(firm, modelName, size);
  }, [firm, modelName, size]);

  var models = getModels(firm, instrType);
  var sizes  = getSizes(firm, instrType, modelName);
  var instrTypes = getInstrTypes(firm);

  // Auto-switch instrType if firm doesn't support current
  React.useEffect(function() {
    var types = getInstrTypes(firm);
    if (types.length > 0 && !types.includes(instrType)) {
      setInstr(types[0]);
    }
    setModel('');
    setSize(0);
  }, [firm]);

  React.useEffect(function() {
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
      cycleStartBalance: account ? (account.cycleStartBalance || size) : size,
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

    // Firm selector
    h('div', { className: 'form-row', style: { gap: 12 } },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Prop Firm'),
        h(UI.CustomDropdown, {
          value: firm,
          onChange: setFirm,
          options: firms.map(function(f) { return { value: f, label: f }; }),
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Type'),
        h(UI.CustomDropdown, {
          value: instrType,
          onChange: setInstr,
          options: instrTypes.map(function(t) { return { value: t, label: t === 'cfd' ? 'CFD' : 'Futures' }; }),
        })
      ),
    ),

    // Model selector
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Account Model'),
      h(UI.CustomDropdown, {
        value: modelName,
        onChange: setModel,
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

    // Profit split
    h('div', { className: 'form-row', style: { gap: 12 } },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Profit Split'),
        h(UI.CustomDropdown, {
          value: profitSplit,
          onChange: function(v) { setProfitSplit(Number(v)); },
          options: [80, 85, 90, 95].map(function(n) { return { value: n, label: n + '%' }; }),
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Phase / Status'),
        h(UI.CustomDropdown, {
          value: phase,
          onChange: setPhase,
          options: ['Challenge','Funded','Passed'].map(function(p) { return { value: p, label: p }; }),
        })
      ),
    ),

    // Auto-filled rules preview
    modelData && size ? h('div', { style: { background: 'rgba(191,219,254,0.05)', border: '1px solid rgba(191,219,254,0.12)', borderRadius: 10, padding: 14, marginBottom: 14 } },
      h('div', { style: { fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 } }, 'Auto-filled Rules'),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px' } },
        ...[
          ['Drawdown Type',   modelData.drawdownType],
          ['Max Loss',        modelData.sizeData.maxLoss ? '$' + modelData.sizeData.maxLoss.toLocaleString() : '—'],
          ['Daily Loss',      modelData.sizeData.dailyLoss ? '$' + modelData.sizeData.dailyLoss.toLocaleString() : 'None'],
          ['Profit Target',   modelData.sizeData.phase1Target ? '$' + modelData.sizeData.phase1Target.toLocaleString() : (modelData.sizeData.profitTarget ? '$' + modelData.sizeData.profitTarget.toLocaleString() : '—')],
          ['Reward Share',    modelData.rewardShare + '%'],
          ['Consistency',     modelData.consistencyRule ? modelData.consistencyRule + '%' : 'None'],
          ['Contract Limit',  modelData.sizeData.contractLimit || '—'],
          ['On-Demand Payout',modelData.onDemandPayout ? 'Yes' : 'No'],
        ].map(function(pair, i) {
          return h('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 } },
            h('span', { style: { color: 'var(--t3)' } }, pair[0]),
            h('span', { style: { color: 'var(--t1)', fontFamily: 'var(--mono)', fontSize: 11.5 } }, pair[1])
          );
        })
      )
    ) : null,

    // Status
    h('div', { className: 'input-group' },
      h('label', { className: 'input-label' }, 'Account Status'),
      h(UI.CustomDropdown, {
        value: status,
        onChange: setStatus,
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
