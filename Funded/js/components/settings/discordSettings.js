// ============================================================
// DISCORD WEBHOOK SETTINGS — UI Component
// ============================================================

function DiscordSettings({ settings, onChange }) {
  var { useState: useS } = React;
  var [testing, setTesting]   = useS(false);
  var [testResult, setResult] = useS(null);

  var set = function(k, v, deferred) {
    var updated = Object.assign({}, settings, { [k]: v });
    // For non-text fields (booleans, selects), save immediately
    // For text fields, caller sets deferred=true and saves on blur instead
    if (!deferred) {
      onChange(updated);
    } else {
      // Update parent state without triggering DB save
      // The parent's setF will update but not call saveSettings
      onChange(updated);
    }
  };
  
  // Local state for text fields to avoid DB write on every keystroke
  var [localUrl,      setLocalUrl]      = React.useState(settings.discordWebhookUrl || '');
  var [localUsername, setLocalUsername] = React.useState(settings.discordUsername || '');
  
  // Sync local state when settings prop changes (e.g. after page navigation returns)
  React.useEffect(function() {
    setLocalUrl(settings.discordWebhookUrl || '');
    setLocalUsername(settings.discordUsername || '');
  }, [settings.discordWebhookUrl, settings.discordUsername]);

  var handleTest = async function() {
    if (!settings.discordWebhookUrl) {
      setResult({ ok: false, error: 'Enter a webhook URL first.' });
      return;
    }
    setTesting(true);
    setResult(null);
    var res = await DiscordWebhook.testWebhook(settings);
    setTesting(false);
    setResult(res);
    setTimeout(function() { setResult(null); }, 5000);
  };

  var toggleRow = function(label, key) {
    return h('div', { style: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(51,65,85,0.25)' } },
      h('div', null,
        h('div', { style: { fontSize:12.5, color:'var(--t1)' } }, label),
      ),
      h('div', {
        onClick: function() { set(key, !settings[key]); },
        style: {
          width:36, height:20, borderRadius:10, cursor:'pointer', transition:'all 0.2s',
          background: settings[key] ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
          position:'relative', flexShrink:0,
        },
      },
        h('div', { style: {
          width:14, height:14, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, transition:'left 0.2s',
          left: settings[key] ? 18 : 3,
          boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
        } })
      )
    );
  };

  return h('div', null,

    // ── Enable toggle ──
    h('div', { style: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border-1)', marginBottom:14 } },
      h('div', null,
        h('div', { style: { fontSize:13.5, fontWeight:600, color:'var(--t1)' } }, 'Discord Webhook'),
        h('div', { style: { fontSize:11.5, color:'var(--t3)', marginTop:2 } }, 'Send trade logs and journals to a Discord channel')
      ),
      h('div', {
        onClick: function() { set('discordEnabled', !settings.discordEnabled); },
        style: {
          width:42, height:24, borderRadius:12, cursor:'pointer', transition:'all 0.2s',
          background: settings.discordEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.18)',
          position:'relative', flexShrink:0,
        },
      },
        h('div', { style: {
          width:18, height:18, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, transition:'left 0.2s',
          left: settings.discordEnabled ? 21 : 3,
          boxShadow:'0 1px 3px rgba(0,0,0,0.3)',
        } })
      )
    ),

    // ── Webhook URL ──
    h('div', { className:'input-group' },
      h('label', { className:'input-label' }, 'Webhook URL'),
      h('input', {
        className: 'input-field',
        type: 'url',
        placeholder: 'https://discord.com/api/webhooks/...',
        value: localUrl,
        onChange: function(e) { setLocalUrl(e.target.value); },
        onBlur: function(e) {
          var trimmed = e.target.value.trim();
          setLocalUrl(trimmed);
          if (trimmed) { set('discordWebhookUrl', trimmed); showSaved(); }
        },
        style: { fontFamily:'var(--mono)', fontSize:11.5 },
      }),
      h('div', { className:'input-hint', style: { display: 'flex', alignItems: 'center', gap: 8 } },
        'Discord Server Settings → Integrations → Webhooks → Copy Webhook URL',
        saved && h('span', { style: { color: 'var(--green)', fontSize: 11, fontWeight: 500, marginLeft: 4 } }, 'Saved')
      )
    ),

    // ── Bot username ──
    h('div', { className:'input-group' },
      h('label', { className:'input-label' }, 'Bot Display Name'),
      h('input', {
        className: 'input-field',
        placeholder: 'Trading Journal',
        value: localUsername,
        onChange: function(e) { setLocalUsername(e.target.value); },
        onBlur: function(e) { set('discordUsername', e.target.value); },
      })
    ),

    // ── Message format ──
    h('div', { className:'input-group' },
      h('label', { className:'input-label' }, 'Message Format'),
      h('div', { className:'toggle-group' },
        h('div', { className:'toggle-opt ' + (settings.discordFormat !== 'plain' ? 'active' : ''), onClick: function() { set('discordFormat','embed'); } }, 'Embed (Rich)'),
        h('div', { className:'toggle-opt ' + (settings.discordFormat === 'plain' ? 'active' : ''), onClick: function() { set('discordFormat','plain'); } }, 'Plain Text')
      ),
      h('div', { className:'input-hint' }, settings.discordFormat === 'plain'
        ? 'Clean text format - compatible with all Discord clients'
        : 'Rich embed with colored sidebar and structured fields'
      )
    ),

    // ── Divider ──
    h('div', { className:'section-heading', style:{ marginTop:16 } }, 'Trigger Settings'),

    // ── Toggles ──
    h('div', { style:{ background:'rgba(8,9,13,0.5)', border:'1px solid var(--border-1)', borderRadius:8, padding:'0 12px', marginBottom:16 } },
      toggleRow('Send on Trade Save',        'discordSendOnTrade'),
      toggleRow('Send on Daily Journal Save','discordSendOnJournal'),
      toggleRow('Send on Weekly Review Save','discordSendOnWeeklyReview'),
    ),

    // ── Test button ──
    h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
      h('button', {
        className: 'btn btn-secondary',
        onClick: handleTest,
        disabled: testing || !settings.discordWebhookUrl,
        style: { opacity: (!settings.discordWebhookUrl) ? 0.5 : 1 },
      },
        testing
          ? h('span', { style:{ display:'flex', alignItems:'center', gap:6 } },
              h('div', { className:'spinner', style:{ width:13, height:13, borderWidth:1.5 } }),
              'Sending test...'
            )
          : h('span', { style:{ display:'flex', alignItems:'center', gap:6 } },
              h(UI.Icon, { name:'zap', size:13 }),
              'Send Test Message'
            )
      ),
      testResult && h('div', {
        className: testResult.ok ? 'alert alert-success' : 'alert alert-danger',
        style:{ margin:0, padding:'5px 12px', fontSize:12 },
      },
        h(UI.Icon, { name: testResult.ok ? 'check' : 'x', size:12 }),
        testResult.ok ? 'Message sent successfully' : ('Error: ' + testResult.error)
      )
    ),

    // ── Info ──
    h('div', { className:'alert alert-info', style:{ marginTop:14 } },
      h(UI.Icon, { name:'info', size:13 }),
      h('span', null,
        'All messages sent to Discord are clean text only - no emoji, no markdown symbols. ',
        'The webhook URL is stored locally in your browser and never sent to any third-party server.'
      )
    )
  );
}

window.DiscordSettings = DiscordSettings;
