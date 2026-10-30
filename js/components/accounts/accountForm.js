
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
  var [instrTypeS, setInstr] = React.useState(initType);
  var [modelNameS, setModel] = React.useState(initModel);
  var [sizeS,      setSize]  = React.useState(initSize);
  var [name,     setName]   = React.useState(account ? account.name : '');
  var [profitSplit, setProfitSplit] = React.useState(account ? (account.profitSplit || 90) : 90);
  var [phaseS,    setPhase]  = React.useState(account && !account.isBroker ? (account.phase || 'Funded') : 'Funded');
  var [status,   setStatus]    = React.useState(account ? (account.status || 'Active') : 'Active');
  var [cycleType, setCycleType] = React.useState(account ? (account.cycleType || 'on_demand') : 'on_demand');
  var [kind,       setKind]      = React.useState(account && account.isBroker ? 'broker' : 'prop');
  var [brokerBal,  setBrokerBal] = React.useState(account && account.isBroker ? String(account.startingBalance || '') : '');

  // Everything below is derived, so the dropdowns can never end up empty:
  // an invalid type/model/size/phase falls back to the first valid option.
  var instrTypes = getInstrTypes(firm);
  var instrType  = instrTypes.indexOf(instrTypeS) >= 0 ? instrTypeS : (instrTypes[0] || 'cfd');
  var models     = getModels(firm, instrType);
  var modelName  = models.indexOf(modelNameS) >= 0 ? modelNameS : (models[0] || '');
  var sizes      = getSizes(firm, instrType, modelName);
  var size       = sizes.indexOf(sizeS) >= 0 ? sizeS : (sizes[0] || 0);

  var modelData = React.useMemo(function() {
    return getPropFirmModel(firm, modelName, size);
  }, [firm, modelName, size]);

  var phaseOpts = [];
  if (modelData && modelData.phases >= 2) phaseOpts.push('Phase 1', 'Phase 2');
  else if (modelData && modelData.phases === 1) phaseOpts.push('Phase 1');
  phaseOpts.push('Funded');
  var phase = phaseOpts.indexOf(phaseS) >= 0 ? phaseS : 'Funded';

  function handleSave() {
    if (kind === 'broker') {
      var bal = parseFloat(brokerBal);
      if (!name.trim() || !(bal > 0)) { UI.toast('Isi nama akun dan saldo', 'error'); return; }
      onSave({
        id:              account ? account.id : ('acc-' + Date.now()),
        name:            name.trim(),
        propFirm:        'Broker',
        isBroker:        true,
        instrType:       '',
        modelName:       '',
        phase:           'Broker',
        status:          status,
        startingBalance: bal,
        profitSplit:     100,
        profitTarget: 0, phase1Target: 0, phase2Target: 0,
        maxLoss: 0, dailyLoss: 0,
        drawdownType: 'none', consistencyRule: null, rewardShare: 100,
        onDemandPayout: false, bufferRule: false,
        cycleType: 'direct',
        isActive:        account ? account.isActive : false,
        createdAt:       account ? account.createdAt : new Date().toISOString(),
        totalPayouts:    account ? (account.totalPayouts || 0) : 0,
        totalWithdrawn:  account ? (account.totalWithdrawn || 0) : 0,
        payoutHistory:   account ? (account.payoutHistory || []) : [],
        taxRate:         account ? (account.taxRate || 0) : 0,
      });
      onClose();
      return;
    }
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
      totalWithdrawn:  account ? (account.totalWithdrawn || 0) : 0,
      bufferAmount:    account && account.bufferAmount !== undefined ? account.bufferAmount : 40,
      taxRate:         0,
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

  var kindToggle = h('div', { className: 'input-group' },
    h('label', { className: 'input-label' }, 'Account Kind'),
    h('div', { className: 'toggle-group', style: { display: 'inline-flex' } },
      h('div', { className: 'toggle-opt' + (kind === 'prop' ? ' active' : ''), onClick: function() { setKind('prop'); } }, 'Prop Firm'),
      h('div', { className: 'toggle-opt' + (kind === 'broker' ? ' active' : ''), onClick: function() { setKind('broker'); } }, 'Broker')
    )
  );

  if (kind === 'broker') {
    return h('div', null,
      kindToggle,
      inp('Account Name', name, setName, { placeholder: 'e.g. Exness Real' }),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 14px' } },
        h('div', { className: 'input-group', style: { gridColumn: 'span 2' } },
          h('label', { className: 'input-label' }, 'Balance'),
          h('input', { className: 'input-field', type: 'number', min: 0, step: 'any', placeholder: '0.00',
            value: brokerBal, onChange: function(e) { setBrokerBal(e.target.value); } })
        ),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'Status'),
          h(UI.CustomDropdown, {
            value: status, onChange: setStatus,
            options: ['Active','Archived'].map(function(s) { return { value: s, label: s }; }),
          })
        )
      ),
      h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 } },
        h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
        h('button', { className: 'btn btn-primary', onClick: handleSave }, account ? 'Update Account' : 'Create Account')
      )
    );
  }

  return h('div', null,
    kindToggle,
    // Row 0: Account Name (full width)
    inp('Account Name', name, setName, { placeholder: 'e.g. My FundedNext $5K' }),

    // 3 columns: Prop Firm / Model / Split  |  Type / Cycle / Size  |  Phase / Status
    h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 14px' } },
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
          options: instrTypes.map(function(t) { return { value: t, label: t === 'cfd' ? 'CFD' : 'Futures' }; }),
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Phase'),
        h(UI.CustomDropdown, {
          value: phase, onChange: setPhase,
          options: phaseOpts.map(function(p) { return { value: p, label: p }; }),
        })
      ),

      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Account Model'),
        h(UI.CustomDropdown, {
          value: modelName, onChange: setModel,
          options: models.map(function(m) { return { value: m, label: m }; }),
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Cycle Type'),
        h(UI.CustomDropdown, {
          value: cycleType, onChange: setCycleType,
          options: [{ value: 'on_demand', label: 'On Demand' }, { value: '14_day', label: '14 Day' }],
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Status'),
        h(UI.CustomDropdown, {
          value: status, onChange: setStatus,
          options: ['Active', 'Passed', 'Failed', 'Archived'].map(function(s) { return { value: s, label: s }; }),
        })
      ),

      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Profit Split'),
        h(UI.CustomDropdown, {
          value: profitSplit, onChange: function(v) { setProfitSplit(Number(v)); },
          options: [80, 85, 90, 95].map(function(n) { return { value: n, label: n + '%' }; }),
        })
      ),
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Account Size'),
        h(UI.CustomDropdown, {
          value: size, onChange: function(v) { setSize(Number(v)); },
          options: sizes.map(function(s) { return { value: s, label: '$' + s.toLocaleString() }; }),
        })
      )
    ),

    // Auto-filled rules preview
    modelData && size ? h('div', { style: { background: 'rgba(191,219,254,0.04)', border: '1px solid rgba(191,219,254,0.10)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 } },
      h('div', { style: { fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 } }, 'Auto-filled Rules'),
      h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 24px' } },
        (function() {
          var sd = modelData.sizeData;
          var rows = [
            ['Drawdown Type', modelData.drawdownType],
            ['Max Loss',      sd.maxLoss    ? '$' + sd.maxLoss.toLocaleString()   : '—'],
            ['Daily Loss',    sd.dailyLoss  ? '$' + sd.dailyLoss.toLocaleString() : 'None'],
            ['Reward Share',  modelData.rewardShare + '%'],
            ['Consistency',   modelData.consistencyRule ? modelData.consistencyRule + '%' : 'None'],
          ];
          if (phase === 'Phase 1') rows.push(['Phase 1 Target', sd.phase1Target ? '$' + sd.phase1Target.toLocaleString() : (sd.profitTarget ? '$' + sd.profitTarget.toLocaleString() : '—')]);
          else if (phase === 'Phase 2') rows.push(['Phase 2 Target', sd.phase2Target ? '$' + sd.phase2Target.toLocaleString() : '—']);
          if (sd.contractLimit) rows.push(['Contract Limit', sd.contractLimit]);
          return rows.map(function(pair, i) {
            return h('div', { key: i, style: { display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 12 } },
              h('span', { style: { color: 'var(--t3)' } }, pair[0]),
              h('span', { style: { color: 'var(--t1)', fontFamily: 'var(--mono)', fontSize: 11.5 } }, pair[1])
            );
          });
        })()
      )
    ) : null,

    // Footer
    h('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 } },
      h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
      h('button', { className: 'btn btn-primary',   onClick: handleSave }, account ? 'Update Account' : 'Create Account')
    )
  );
}
