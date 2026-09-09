// ============================================================
// SIDEBAR — Navigation
// ============================================================

function Sidebar({ page, setPage, collapsed, setCollapsed }) {
  const { activeAccount, trades, activeAccountId } = useApp();

  const nav = [
    { id: 'dashboard', label: 'Dashboard',    icon: 'dashboard' },
    { id: 'trades',    label: 'Trades',        icon: 'trades'    },
    { id: 'accounts',  label: 'Accounts',      icon: 'accounts'  },
    { id: 'calendar',  label: 'Calendar',      icon: 'calendar'  },
    { id: 'analytics', label: 'Analytics',     icon: 'analytics' },
    { id: 'mistakes',  label: 'Mistakes',      icon: 'mistakes'  },
    { id: 'playbook',  label: 'Playbook',      icon: 'playbook'  },
    { id: 'reviews',   label: 'Reviews',       icon: 'reviews'   },
    { id: 'journal',   label: 'Daily Journal', icon: 'journal'   },
    { id: 'settings',  label: 'Settings',      icon: 'settings'  },
  ];

  const dotClass = () => {
    if (!activeAccount) return 'account-dot';
    const accTrades = trades.filter(t => t.accountId === activeAccount.id && t.status === 'Closed');
    const totalPL   = accTrades.reduce((s, t) => s + (t.profitLoss || 0), 0);
    const ddPct     = activeAccount.maxLoss > 0 ? (Math.abs(Math.min(0, totalPL)) / activeAccount.maxLoss) * 100 : 0;
    if (ddPct > 70) return 'account-dot danger';
    if (ddPct > 40) return 'account-dot warning';
    return 'account-dot healthy';
  };

  const accTrades = activeAccount ? trades.filter(t => t.accountId === activeAccount.id && t.status === 'Closed') : [];
  const totalPL   = accTrades.reduce((s, t) => s + (t.profitLoss || 0), 0);
  const balance   = activeAccount ? activeAccount.startingBalance + totalPL : 0;

  return React.createElement('nav', { className: `sidebar ${collapsed ? 'collapsed' : ''}` },

    // Header
    React.createElement('div', { className: 'sidebar-header' },
      React.createElement('div', { className: 'logo-mark' },
        React.createElement('img', { src: 'logo.png', alt: 'FTJ',
          style: { width: 22, height: 22, objectFit: 'contain', borderRadius: 4 },
          onError: function(e) { e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:11px;font-weight:800;color:#fff">FT</span>'; } })
      ),
      React.createElement('div', { className: 'logo-text' },
        React.createElement('span', { className: 'l1' }, 'Trading Journal'),
        React.createElement('span', { className: 'l2' }, 'Funded Account')
      ),
      React.createElement('div', { className: 'sidebar-toggle', onClick: () => setCollapsed(!collapsed), title: collapsed ? 'Expand' : 'Collapse' },
        React.createElement(UI.Icon, { name: 'chevronL', size: 11, color: 'var(--t3)' })
      )
    ),

    // Nav items
    React.createElement('div', { className: 'sidebar-nav' },
      nav.map(item =>
        React.createElement('div', {
          key: item.id,
          className: `nav-item ${page === item.id ? 'active' : ''}`,
          onClick: () => setPage(item.id),
          title: collapsed ? item.label : undefined,
        },
          React.createElement('span', { className: 'nav-icon' },
            React.createElement(UI.Icon, { name: item.icon, size: 15 })
          ),
          React.createElement('span', { className: 'nav-label' }, item.label)
        )
      )
    ),

    // Footer — active account chip
    React.createElement('div', { className: 'sidebar-footer' },
      React.createElement('div', {
        className: 'account-chip',
        onClick: () => setPage('accounts'),
        title: collapsed ? (activeAccount?.name || 'No Account') : undefined,
      },
        React.createElement('div', { className: dotClass() }),
        React.createElement('div', { className: 'account-chip-info' },
          React.createElement('div', { className: 'account-chip-name' },
            activeAccount ? activeAccount.name : 'No Account'
          ),
          React.createElement('div', { className: 'account-chip-bal' },
            activeAccount ? Calc.fmt.currency(balance) : '—'
          )
        )
      )
    )
  );
}

window.Sidebar = Sidebar;
