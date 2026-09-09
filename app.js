// ============================================================
// RUNTIME DEPENDENCY CHECK
// ============================================================
(function() {
  const missing = [];
  if (typeof React === 'undefined')    missing.push('React');
  if (typeof ReactDOM === 'undefined') missing.push('ReactDOM');
  if (typeof Recharts === 'undefined') missing.push('Recharts');
  if (missing.length > 0) {
    document.getElementById('root').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:16px;color:#94a3b8;font-family:Inter,sans-serif"><div style="font-size:16px;color:var(--red);font-weight:600">Failed to load dependencies</div><div style="font-size:13px">Missing: ' + missing.join(', ') + '</div><div style="font-size:12px;color:#475569;max-width:400px;text-align:center">Check your internet connection. The app requires React, ReactDOM, and Recharts from CDN.</div></div>';
    throw new Error('Missing dependencies: ' + missing.join(', '));
  }
})();

// ============================================================
// APP ENTRY POINT
// ============================================================


// ── FLOATING ADD TRADE BUTTON ─────────────────────────────
function FABTradeButton() {
  var { upsertTrade } = useApp();
  var [open, setOpen] = React.useState(false);

  // Listen for external trigger
  React.useEffect(function() {
    function handler() { setOpen(true); }
    window.addEventListener('openFAB', handler);
    return function() { window.removeEventListener('openFAB', handler); };
  }, []);

  return h(React.Fragment, null,
    h('div', {
      className: 'fab-add-trade',
      onClick: function() { setOpen(true); },
      title: 'New Trade',
    },
      h(UI.Icon, { name: 'plus', size: 22 })
    ),
    h(UI.Modal, {
      open: open,
      onClose: function() { setOpen(false); },
      title: 'New Trade',
      size: 'lg',
    },
      open && h(TradeForm, {
        trade: null,
        onSave: async function(trade) {
          await upsertTrade(trade);
          UI.toast('Trade saved', 'success');
          setOpen(false);
        },
        onClose: function() { setOpen(false); },
      })
    )
  );
}

function App() {
  const { loading } = useApp();
  const [page,      setPage]      = React.useState('dashboard');
  const [collapsed, setCollapsed] = React.useState(false);

  if (loading) return h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 20, background: 'var(--bg)' } },
    h('div', { style: { width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(140deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', boxShadow: '0 0 30px rgba(91,141,238,0.4)', marginBottom: 4 } }, 'FT'),
    h('div', { className: 'spinner' }),
    h('div', { style: { fontSize: 13, color: 'var(--t3)', marginTop: 4, fontFamily: 'var(--font)' } }, 'Loading Journal…')
  );

  const pages = {
    dashboard: DashboardPage,
    trades:    TradesPage,
    accounts:  AccountsPage,
    calendar:  CalendarPage,
    analytics: AnalyticsPage,
    mistakes:  MistakesPage,
    playbook:  PlaybookPage,
    reviews:   ReviewsPage,
    journal:   JournalPage,
    settings:  SettingsPage,
  };

  const PageComponent = pages[page] || DashboardPage;

  return h('div', { className: 'app-layout' },
    h(Sidebar, { page, setPage, collapsed, setCollapsed }),
    h('div', { id: 'main-content', className: 'main-content' + (collapsed ? ' expanded' : '') },
      h(PageComponent)
    ),
    h(FABTradeButton)
  );
}

// Root render
var root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  h(UI.ToastProvider, null,
    h(UI.ContextMenuProvider, null,
      h(AppProvider, null,
        h(App)
      )
    )
  )
);
