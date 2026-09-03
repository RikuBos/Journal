# Funded Trading Journal

A professional, fully-featured trading journal and performance analytics workstation for funded account traders.

## Quick Start

1. Open `index.html` in Chrome, Firefox, or Edge
2. Sample data loads automatically on first open
3. Navigate using the collapsible left sidebar

**No installation required. No build step. No Node.js needed.**

## Project Structure

```
funded-trading-journal/
├── index.html                          ← Entry point (open this)
├── css/
│   └── style.css                       ← Complete design system
└── js/
    ├── lib/
    │   ├── db.js                        ← IndexedDB storage layer
    │   └── state.js                     ← React Context app state
    ├── utils/
    │   └── calc.js                      ← Pure calculation engine
    ├── data/
    │   ├── constants.js                 ← Trading concepts & defaults
    │   └── sampleData.js               ← Demo data generator
    ├── components/
    │   ├── shared/
    │   │   ├── ui.js                    ← Shared UI components & icons
    │   │   └── sidebar.js               ← Navigation sidebar
    │   ├── dashboard/
    │   │   └── dashboard.js             ← Dashboard page
    │   ├── trades/
    │   │   ├── tradeForm.js             ← Trade entry/edit form
    │   │   └── trades.js                ← Trades page + drawer
    │   ├── accounts/
    │   │   └── accounts.js              ← Accounts + Calendar + Analytics
    │   └── mistakes/
    │       └── pages.js                 ← Mistakes, Playbook, Reviews,
    │                                       Journal, Settings pages
    └── app.js                           ← Root render
```

## Features

| Page | Features |
|---|---|
| **Dashboard** | Equity curve, daily P/L bar chart, KPI stats, account progress bars, drawdown warnings |
| **Trades** | Sortable/filterable table, trade entry form (4 tabs), detail drawer, screenshot gallery |
| **Accounts** | Multi-account management, custom rules per prop firm, progress tracking |
| **Calendar** | Day heatmap, click to view day's trades, monthly summary |
| **Analytics** | By session/setup/grade/day-of-week, rule compliance comparison, dynamic filters |
| **Mistakes** | Frequency + cost analysis per mistake, trend bar chart |
| **Playbook** | Setup templates with interactive checklists, POI/confirmation tags |
| **Reviews** | Weekly + monthly auto-generated reviews with editable reflections |
| **Daily Journal** | Pre/post session notes linked to trade history |
| **Settings** | Custom concepts, currency, timezone, export/import/reset |

## Tech Stack

- **React 18** (UMD via cdnjs — no JSX transformer, pure `React.createElement`)
- **Recharts 2.12.7** (UMD via cdnjs)
- **IndexedDB** (browser-native persistence)
- **Inter + JetBrains Mono** (Google Fonts)
- **Pure CSS** design system (dark glassmorphism)

## Data Storage

All data is stored in your browser's IndexedDB (`FundedTradingJournal` database). Data persists across browser restarts.

**Important:** Use Settings → Export JSON Backup regularly to avoid data loss.

## Architecture Principles

- **No JSX** — Uses `React.createElement` directly, works without any build step
- **No npm** — Zero dependencies to install
- **Modular** — One file per concern, all exposed as `window.*` globals
- **Calculation engine** — `Calc` object with pure functions, no duplication
- **Storage layer** — `DB` abstraction over IndexedDB, promise-based
- **State** — Single `AppProvider` context, all CRUD operations in one place

## Known Limitations

- Requires internet for CDN assets on first load (React, Recharts, Google Fonts)
- Images stored as base64 strings in IndexedDB — can grow large with many screenshots
- No multi-device sync (local storage only in v1)
- No real-time price feeds (static journal)
