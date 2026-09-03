// ============================================================
// SHARED UI COMPONENTS
// ============================================================
// React hooks - h is available globally via window.h set in db.js
var useState = React.useState;
var useEffect = React.useEffect;
var useRef = React.useRef;
var useCallback = React.useCallback;

// ── ICONS ──────────────────────────────────────────────────
var ICON_PATHS = {
  dashboard:  `<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>`,
  trades:     `<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>`,
  accounts:   `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>`,
  calendar:   `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>`,
  analytics:  `<path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-7"/>`,
  mistakes:   `<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>`,
  playbook:   `<path d="M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15z"/><path d="M8 7h8M8 11h8M8 15h5"/>`,
  reviews:    `<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/>`,
  journal:    `<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  settings:   `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>`,
  plus:       `<path d="M12 5v14M5 12h14"/>`,
  edit:       `<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  trash:      `<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>`,
  x:          `<path d="M18 6L6 18M6 6l12 12"/>`,
  check:      `<polyline points="20 6 9 17 4 12"/>`,
  chevronL:   `<polyline points="15 18 9 12 15 6"/>`,
  chevronR:   `<polyline points="9 18 15 12 9 6"/>`,
  chevronD:   `<polyline points="6 9 12 15 18 9"/>`,
  search:     `<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>`,
  upload:     `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`,
  download:   `<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
  alert:      `<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
  info:       `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
  trendUp:    `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`,
  trendDown:  `<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>`,
  target:     `<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
  zap:        `<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>`,
  eye:        `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  save:       `<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>`,
  maximize:   `<path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>`,
  refresh:    `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>`,
  shield:     `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  book:       `<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>`,
  archive:    `<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>`,
  activity:   `<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>`,
  dollar:     `<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>`,
  copy:       `<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>`,
  lock:       `<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>`,
  ellipsis:   `<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>`,
  sort:       `<path d="M3 6h18M7 12h10M11 18h2"/>`,
  star:       `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
  clock:      `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`,
};

function Icon({ name, size = 15, color = 'currentColor', className = '' }) {
  const d = ICON_PATHS[name] || '';
  return h('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'none', stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round', strokeLinejoin: 'round',
    className,
    dangerouslySetInnerHTML: { __html: d },
  });
}

// ── TOAST SYSTEM ───────────────────────────────────────────
var _addToast = null;
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  _addToast = useCallback((msg, type = 'info', ms = 3000) => {
    const id = genId();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 200);
    }, ms);
  }, []);
  const iconName = { success: 'check', error: 'x', warning: 'alert', info: 'info' };
  const iconColor = { success: '#2dce89', error: '#f5365c', warning: '#fb8c00', info: '#7aaff5' };
  return h(React.Fragment, null,
    children,
    h('div', { className: 'toast-container' },
      toasts.map(t => h('div', { key: t.id, className: `toast ${t.type} ${t.out ? 'out' : ''}` },
        h(Icon, { name: iconName[t.type] || 'info', size: 13, color: iconColor[t.type] }),
        h('span', null, t.msg)
      ))
    )
  );
}
function toast(msg, type = 'info', ms = 3000) {
  if (_addToast) _addToast(msg, type, ms);
}

// ── MODAL ──────────────────────────────────────────────────
function Modal({ open, onClose, title, children, footer, size = '' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return h('div', { className: 'modal-overlay', onMouseDown: e => e.target === e.currentTarget && onClose() },
    h('div', { className: `modal ${size}` },
      h('div', { className: 'modal-header' },
        h('span', { className: 'modal-title' }, title),
        h('button', { className: 'modal-close', onClick: onClose }, h(Icon, { name: 'x', size: 14 }))
      ),
      h('div', { className: 'modal-body' }, children),
      footer && h('div', { className: 'modal-footer' }, footer)
    )
  );
}

// ── CONFIRM MODAL ──────────────────────────────────────────
function ConfirmModal({ open, onClose, onConfirm, title, message, danger = true }) {
  return h(Modal, { open, onClose, title,
    footer: h(React.Fragment, null,
      h('button', { className: 'btn btn-secondary', onClick: onClose }, 'Cancel'),
      h('button', { className: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, onClick: () => { onConfirm(); onClose(); } }, 'Confirm')
    )
  }, h('p', { style: { fontSize: 13, color: 'var(--t2)', lineHeight: 1.6 } }, message));
}

// ── SHARED DISPLAY COMPONENTS ──────────────────────────────
function GradeBadge({ grade }) {
  const cls = { 'A+': 'grade-aplus', A: 'grade-a', B: 'grade-b', C: 'grade-c', D: 'grade-d', F: 'grade-f' }[grade] || 'grade-c';
  return h('span', { className: `grade ${cls}` }, grade);
}
function DirBadge({ dir }) {
  return h('span', { className: dir === 'Long' ? 'dir-long' : 'dir-short' }, dir);
}
function PLText({ value, size }) {
  if (value == null) return h('span', { className: 'text-muted' }, '—');
  var s = size === 'sm' ? { fontSize: 11 } : {};
  return h('span', { className: 'text-mono ' + (value >= 0 ? 'text-pos' : 'text-neg'), style: s }, Calc.fmt.currency(Math.abs(value)));
}
function RText({ value }) {
  if (value == null) return h('span', { className: 'text-muted' }, '—');
  var absR = Math.abs(value).toFixed(2) + 'R';
  return h('span', { className: 'text-mono text-xs ' + (value >= 0 ? 'text-pos' : value < 0 ? 'text-neg' : 'text-muted') }, absR);
}
function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return h('div', { className: 'search-wrap', style: { position: 'relative' } },
    h('span', { className: 'icon', style: { position:'absolute',left:10,top:'50%',transform:'translateY(-50%)' } }, h(Icon, { name: 'search', size: 13 })),
    h('input', { className: 'input-field', style: { paddingLeft: 32 }, value, onChange: e => onChange(e.target.value), placeholder })
  );
}
function EmptyState({ icon = 'activity', title = 'No data', desc = '', action = null }) {
  return h('div', { className: 'empty-state' },
    h('div', { className: 'empty-icon' }, h(Icon, { name: icon, size: 48, color: 'var(--t4)' })),
    h('div', { className: 'empty-title' }, title),
    desc && h('p', { className: 'empty-desc' }, desc),
    action
  );
}
function StatBlock({ label, value, sub, cls = '', progressPct, progressColor = 'blue', style: s = {} }) {
  return h('div', { className: 'stat-block', style: s },
    h('div', { className: 'stat-label' }, label),
    h('div', { className: `stat-value ${cls}` }, value),
    sub  && h('div', { className: 'stat-sub' }, sub),
    progressPct != null && h('div', { className: 'stat-progress' },
      h('div', { className: `stat-progress-fill ${progressColor}`, style: { width: `${Math.min(100, Math.max(0, progressPct))}%` } })
    )
  );
}
function MetricRow({ label, value, cls = '' }) {
  return h('div', { className: 'metric-row' },
    h('span', { className: 'metric-name' }, label),
    h('span', { className: `metric-val ${cls}` }, value)
  );
}

// ── CHART TOOLTIP ──────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return h('div', { className: 'chart-tip' },
    h('div', { className: 'chart-tip-label' }, label),
    payload.map((p, i) => h('div', { key: i, className: 'chart-tip-row' },
      h('div', { className: 'chart-tip-dot', style: { background: p.color } }),
      h('span', { style: { fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--t1)' } },
        typeof p.value === 'number' ? Calc.fmt.currency(p.value) : p.value
      )
    ))
  );
}

// ── LIGHTBOX ──────────────────────────────────────────────
function Lightbox({ src, onClose }) {
  if (!src) return null;
  return h('div', { className: 'lightbox', onClick: onClose },
    h('img', { src, alt: 'screenshot', onClick: e => e.stopPropagation() }),
    h('div', { className: 'lightbox-close', onClick: onClose }, h(Icon, { name: 'x', size: 16 }))
  );
}

// ── EXPORT ─────────────────────────────────────────────────

// ── CONTEXT MENU (for double-click edit/delete) ───────────
var _contextMenu = null;
function setGlobalContextMenu(fn) { _contextMenu = fn; }

function ContextMenuProvider({ children }) {
  var [menu, setMenu] = useState(null);
  // { x, y, items: [{label, icon, action, danger}] }

  setGlobalContextMenu(setMenu);

  useEffect(function() {
    function close() { setMenu(null); }
    document.addEventListener('click', close);
    document.addEventListener('keydown', function(e) { if(e.key==='Escape') close(); });
    return function() { document.removeEventListener('click', close); };
  }, []);

  return h(React.Fragment, null,
    children,
    menu && h('div', {
      className: 'inline-edit-menu',
      style: { position: 'fixed', left: Math.min(menu.x, window.innerWidth-180), top: Math.min(menu.y, window.innerHeight-160) },
      onClick: function(e) { e.stopPropagation(); },
    },
      menu.items.map(function(item, i) {
        return h('div', {
          key: i,
          className: 'inline-edit-item' + (item.danger ? ' danger' : ''),
          onClick: function() { item.action(); setMenu(null); },
        },
          h(Icon, { name: item.icon, size: 14 }),
          item.label
        );
      })
    )
  );
}

function showContextMenu(e, items) {
  e.preventDefault(); e.stopPropagation();
  if (_contextMenu) {
    _contextMenu({ x: e.clientX, y: e.clientY, items });
  }
}

window.UI = {
  Icon, Modal, ConfirmModal, GradeBadge, DirBadge,
  PLText, RText, SearchInput, EmptyState, StatBlock,
  MetricRow, ChartTooltip, Lightbox, ToastProvider, toast,
  ContextMenuProvider, showContextMenu,
};
