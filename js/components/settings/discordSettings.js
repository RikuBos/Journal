// ============================================================
// DISCORD WEBHOOK SETTINGS — UI Component
// ============================================================

function DiscordSettings({ settings, onChange }) {
  var [testing,       setTesting]      = React.useState(false);
  var [testResult,    setResult]       = React.useState(null);
  var [saved,         setSaved]        = React.useState(false);
  var [localUrl,      setLocalUrl]     = React.useState(settings.discordWebhookUrl || '');
  var [localUsername, setLocalUsername]= React.useState(settings.discordUsername || '');

  React.useEffect(function() {
    setLocalUrl(settings.discordWebhookUrl || '');
    setLocalUsername(settings.discordUsername || '');
  }, [settings.discordWebhookUrl, settings.discordUsername]);

  function showSaved() {
    setSaved(true);
    setTimeout(function() { setSaved(false); }, 2000);
  }

  function set(k, v) {
    onChange(Object.assign({}, settings, { [k]: v }));
  }

  async function handleTest() {
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
  }

  function toggleRow(label, key) {
    return h('div', { style: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 0', borderBottom:'1px solid var(--border-1)' } },
      h('div', { style: { fontSize:13, color:'var(--t2)' } }, label),
      h('div', {
        onClick: function() { set(key, !settings[key]); },
        style: {
          width:38, height:22, borderRadius:11, cursor:'pointer', transition:'all 0.2s',
          background: settings[key] ? 'var(--accent-deep)' : 'rgba(255,255,255,0.08)',
          position:'relative', flexShrink:0,
        },
      },
        h('div', { style: {
          width:16, height:16, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, transition:'left 0.2s',
          left: settings[key] ? 19 : 3,
          boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
        } })
      )
    );
  }

  return h('div', null,

    // Enable toggle row
    h('div', { style: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border-1)', marginBottom:16 } },
      h('div', null,
        h('div', { style: { fontSize:14, fontWeight:600, color:'var(--t1)' } }, 'Discord Webhook'),
        h('div', { style: { fontSize:12, color:'var(--t3)', marginTop:3 } }, 'Send trade logs and journals to a Discord channel')
      ),
      h('div', {
        onClick: function() { set('discordEnabled', !settings.discordEnabled); },
        style: {
          width:44, height:24, borderRadius:12, cursor:'pointer', transition:'all 0.2s',
          background: settings.discordEnabled ? 'var(--accent-deep)' : 'rgba(255,255,255,0.08)',
          position:'relative', flexShrink:0,
        },
      },
        h('div', { style: {
          width:18, height:18, borderRadius:'50%', background:'#fff',
          position:'absolute', top:3, transition:'left 0.2s',
          left: settings.discordEnabled ? 22 : 3,
          boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
        } })
      )
    ),

    // Webhook URL
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
      h('div', { className:'input-hint', style: { display:'flex', alignItems:'center', gap:8 } },
        'Server Settings → Integrations → Webhooks → Copy Webhook URL',
        saved && h('span', { style: { color:'var(--green)', fontSize:11, fontWeight:600 } }, '  Saved')
      )
    ),

    // Bot username
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

    // Format
    h('div', { className:'input-group' },
      h('label', { className:'input-label' }, 'Message Format'),
      h('div', { className:'toggle-group' },
        h('div', { className:'toggle-opt ' + (settings.discordFormat !== 'plain' ? 'active' : ''), onClick: function() { set('discordFormat','embed'); } }, 'Embed (Rich)'),
        h('div', { className:'toggle-opt ' + (settings.discordFormat === 'plain' ? 'active' : ''), onClick: function() { set('discordFormat','plain'); } }, 'Plain Text')
      ),
      h('div', { className:'input-hint' },
        settings.discordFormat === 'plain'
          ? 'Clean text — compatible with all Discord clients'
          : 'Rich embed with colored sidebar and structured fields'
      )
    ),

    // Trigger toggles
    h('div', { className:'section-heading', style:{ marginTop:16 } }, 'Send On'),
    h('div', { style:{ background:'rgba(255,255,255,0.02)', border:'1px solid var(--border-1)', borderRadius:'var(--r2)', padding:'0 14px', marginBottom:16 } },
      toggleRow('New Trade Saved', 'discordSendOnTrade'),
      toggleRow('Daily Journal Saved', 'discordSendOnJournal'),
      toggleRow('Weekly Review Saved', 'discordSendOnWeeklyReview'),
    ),

    // Test button
    h('div', { style:{ display:'flex', alignItems:'center', gap:10 } },
      h('button', {
        className: 'btn btn-secondary',
        onClick: handleTest,
        disabled: testing || !settings.discordWebhookUrl,
        style: { opacity: !settings.discordWebhookUrl ? 0.45 : 1 },
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
        className: 'alert ' + (testResult.ok ? 'alert-success' : 'alert-danger'),
        style:{ margin:0, padding:'5px 12px', fontSize:12 },
      },
        h(UI.Icon, { name: testResult.ok ? 'check' : 'x', size:12 }),
        testResult.ok ? 'Message sent' : ('Error: ' + testResult.error)
      )
    ),

    // Info
    h('div', { className:'alert alert-info', style:{ marginTop:14 } },
      h(UI.Icon, { name:'info', size:13 }),
      h('span', null, 'Webhook URL is stored locally and never sent to any third-party server. All Discord messages are plain text — no emoji or symbols.')
    )
  );
}

window.DiscordSettings = DiscordSettings;
