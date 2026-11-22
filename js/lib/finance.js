var FIN_TABLE = 'finance_transactions';
var FIN_ACCOUNT_TABLE = 'finance_accounts';
var FIN_ACCOUNT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#64748b'];
var FIN_ACCOUNT_NAMES = ['BCA', 'BRI', 'BNI', 'Mandiri', 'SeaBank', 'GoPay', 'Dana', 'OVO', 'ShopeePay', 'Cash'];
var FIN_MAX_ACCOUNTS = 10;
var FIN_EXPENSE_CATEGORIES = ['Food & Beverage', 'Shopping', 'Transport', 'Entertainment', 'Bills', 'Education', 'Health', 'Others'];
var FIN_INCOME_CATEGORIES = ['Salary', 'Business', 'Freelance', 'Investment', 'Gift', 'Others'];
var FIN_COLORS = {
  'Food & Beverage': '#60a5fa', 'Shopping': '#a78bfa', 'Transport': '#34d399', 'Entertainment': '#f472b6',
  'Bills': '#fbbf24', 'Education': '#22d3ee', 'Health': '#fb7185', 'Others': '#94a3b8',
};
var FIN_FALLBACK_COLORS = ['#818cf8', '#2dd4bf', '#fb923c', '#a3e635', '#e879f9'];
var FIN_PAGE_SIZE = 25;

function finPad(n) { return (n < 10 ? '0' : '') + n; }
function finKey(d) { return d.getFullYear() + '-' + finPad(d.getMonth() + 1) + '-' + finPad(d.getDate()); }
function finToday() { return finKey(new Date()); }
function finParse(key) { var p = key.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
function finAddDays(key, n) { var d = finParse(key); d.setDate(d.getDate() + n); return finKey(d); }
function finMonthOf(d) { return d.getFullYear() + '-' + finPad(d.getMonth() + 1); }

function finShiftMonth(ym, delta) {
  var p = ym.split('-');
  return finMonthOf(new Date(+p[0], +p[1] - 1 + delta, 1));
}

function finMonthLabel(ym, short) {
  var p = ym.split('-');
  var d = new Date(+p[0], +p[1] - 1, 1);
  return d.toLocaleString('en-US', short ? { month: 'short' } : { month: 'long', year: 'numeric' });
}

function finDateLabel(key) {
  return finParse(key).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function finShortDate(key) {
  return finParse(key).toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

function finTimeOf(row) {
  if (!row.created_at) return '';
  var d = new Date(row.created_at);
  if (isNaN(d.getTime())) return '';
  return finPad(d.getHours()) + ':' + finPad(d.getMinutes());
}

function finMoney(v, cur) {
  var n = Number(v) || 0;
  var sign = n < 0 ? '-' : '';
  if (cur === 'USD') return sign + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return sign + 'Rp' + Math.abs(Math.round(n)).toLocaleString('id-ID');
}

function finShort(v, cur) {
  var a = Math.abs(v);
  var sign = v < 0 ? '-' : '';
  if (cur === 'USD') return sign + '$' + (a >= 1000000 ? (a / 1000000).toFixed(1) + 'M' : a >= 1000 ? (a / 1000).toFixed(a >= 10000 ? 0 : 1) + 'k' : Math.round(a));
  if (a >= 1000000000) return sign + (a / 1000000000).toFixed(1) + ' M';
  if (a >= 1000000) return sign + (a / 1000000).toFixed(a >= 10000000 ? 0 : 1) + ' jt';
  if (a >= 1000) return sign + Math.round(a / 1000) + ' rb';
  return sign + Math.round(a);
}

function finCategoryColor(name, idx) {
  return FIN_COLORS[name] || FIN_FALLBACK_COLORS[idx % FIN_FALLBACK_COLORS.length];
}

function finCategoriesFor(type, current) {
  var list = (type === 'income' ? FIN_INCOME_CATEGORIES : FIN_EXPENSE_CATEGORIES).slice();
  if (current && list.indexOf(current) < 0) list.push(current);
  return list;
}

function finNormalize(row) {
  return Object.assign({}, row, { amount: Number(row.amount) || 0, notes: row.notes || '' });
}

function finNormalizeAccount(row) {
  var asOf = row.balance_as_of || (row.created_at ? String(row.created_at).slice(0, 10) : finToday());
  return Object.assign({}, row, { initial_balance: Number(row.initial_balance) || 0, balance_as_of: String(asOf).slice(0, 10) });
}

function finAccountRows(account, rows) {
  var today = finToday();
  return rows.filter(function(r) { return r.account_id === account.id && r.transaction_date >= account.balance_as_of && r.transaction_date <= today; });
}

function finAccountStats(account, rows) {
  var income = 0, expense = 0, monthCount = 0, monthIncome = 0, monthExpense = 0;
  var nowKey = finMonthOf(new Date());
  var own = finAccountRows(account, rows);
  own.forEach(function(r) {
    if (r.transaction_date.slice(0, 7) === nowKey) {
      monthCount++;
      if (r.type === 'income') monthIncome += r.amount; else monthExpense += r.amount;
    }
    if (r.type === 'income') income += r.amount; else expense += r.amount;
  });
  return { balance: account.initial_balance + income - expense, income: income, expense: expense, monthCount: monthCount, count: own.length, monthIncome: monthIncome, monthExpense: monthExpense };
}

function finBalanceAt(account, rows, dateKey) {
  if (dateKey < account.balance_as_of) return null;
  var bal = account.initial_balance;
  rows.forEach(function(r) {
    if (r.account_id !== account.id || r.transaction_date < account.balance_as_of || r.transaction_date > dateKey) return;
    bal += r.type === 'income' ? r.amount : -r.amount;
  });
  return bal;
}

function finNetWorthAt(accounts, rows, dateKey) {
  return accounts.reduce(function(sum, a) {
    var b = finBalanceAt(a, rows, dateKey);
    return b === null ? sum : sum + b;
  }, 0);
}

function finNetWorth(accounts, rows) {
  return accounts.reduce(function(sum, a) { return sum + finAccountStats(a, rows).balance; }, 0);
}

function finSortRows(rows) {
  return rows.slice().sort(function(a, b) {
    return (b.transaction_date + (b.created_at || '')).localeCompare(a.transaction_date + (a.created_at || ''));
  });
}

function finTotals(rows) {
  var income = 0, expense = 0;
  rows.forEach(function(r) { if (r.type === 'income') income += r.amount; else expense += r.amount; });
  return { income: income, expense: expense, net: income - expense };
}

function finPct(curr, prev) {
  if (!prev) return null;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

function finRate(t) {
  return t.income > 0 ? ((t.income - t.expense) / t.income) * 100 : 0;
}

function finOverview(rows, accounts) {
  accounts = accounts || [];
  var all = finTotals(rows);
  var nowKey = finMonthOf(new Date());
  var prevKey = finShiftMonth(nowKey, -1);
  var thisM = finTotals(rows.filter(function(r) { return r.transaction_date.slice(0, 7) === nowKey; }));
  var prevM = finTotals(rows.filter(function(r) { return r.transaction_date.slice(0, 7) === prevKey; }));
  var netWorth = finNetWorth(accounts, rows);
  var prevEnd = finNetWorthAt(accounts, rows, finAddDays(nowKey + '-01', -1));
  var hasMonths = thisM.income > 0 && prevM.income > 0;
  return {
    hasAccounts: accounts.length > 0,
    netWorth: netWorth, netChange: accounts.length ? finPct(netWorth, prevEnd) : null,
    income: all.income, incomeChange: finPct(thisM.income, prevM.income),
    expense: all.expense, expenseChange: finPct(thisM.expense, prevM.expense),
    savingsRate: finRate(all), savingsDelta: hasMonths ? finRate(thisM) - finRate(prevM) : null,
  };
}

function finTrend(rows, range, accounts) {
  accounts = accounts || [];
  var today = finToday();
  var spans = { '1W': 7, '1M': 30, '3M': 90, '6M': 182, '1Y': 365 };
  var startKey;
  if (range === 'ALL') {
    startKey = accounts.reduce(function(m, a) { return a.balance_as_of < m ? a.balance_as_of : m; }, today);
    if (startKey >= today) startKey = finAddDays(today, -1);
  } else {
    startKey = finAddDays(today, -(spans[range] - 1));
  }
  var tracks = accounts.map(function(a) {
    var by = {}, pre = 0;
    rows.forEach(function(r) {
      if (r.account_id !== a.id || r.transaction_date < a.balance_as_of || r.transaction_date > today) return;
      var d = r.type === 'income' ? r.amount : -r.amount;
      if (r.transaction_date < startKey) pre += d;
      else by[r.transaction_date] = (by[r.transaction_date] || 0) + d;
    });
    var started = a.balance_as_of < startKey;
    return { a: a, by: by, started: started, run: started ? a.initial_balance + pre : 0 };
  });
  var keys = [];
  for (var k = startKey; k <= today; k = finAddDays(k, 1)) keys.push(k);
  var step = keys.length > 370 ? 7 : 1;
  var points = [];
  keys.forEach(function(key, i) {
    var total = 0;
    tracks.forEach(function(t) {
      if (!t.started && key >= t.a.balance_as_of) { t.started = true; t.run = t.a.initial_balance; }
      if (t.started) { t.run += t.by[key] || 0; total += t.run; }
    });
    if (step === 1 || i % step === 0 || i === keys.length - 1) {
      points.push({ key: key, label: finShortDate(key), value: Math.round(total * 100) / 100 });
    }
  });
  return points;
}

function finPeriodBounds(period) {
  var now = new Date();
  var thisM = finMonthOf(now);
  if (period === 'this_month') return { from: thisM + '-01', to: thisM + '-31' };
  if (period === 'last_month') { var lm = finShiftMonth(thisM, -1); return { from: lm + '-01', to: lm + '-31' }; }
  if (period === 'last_3') return { from: finShiftMonth(thisM, -2) + '-01', to: thisM + '-31' };
  if (period === 'this_year') return { from: now.getFullYear() + '-01-01', to: now.getFullYear() + '-12-31' };
  return null;
}

function finBreakdown(rows, period) {
  var bounds = finPeriodBounds(period);
  var by = {};
  rows.forEach(function(r) {
    if (r.type !== 'expense') return;
    if (bounds && (r.transaction_date < bounds.from || r.transaction_date > bounds.to)) return;
    by[r.category] = (by[r.category] || 0) + r.amount;
  });
  var list = Object.keys(by).map(function(k) { return { name: k, value: by[k] }; })
    .sort(function(a, b) { return b.value - a.value; });
  var total = list.reduce(function(s, d) { return s + d.value; }, 0);
  return { list: list, total: total };
}

function finMonthly(rows, count) {
  var nowKey = finMonthOf(new Date());
  var out = [];
  for (var i = count - 1; i >= 0; i--) {
    var ym = finShiftMonth(nowKey, -i);
    var t = finTotals(rows.filter(function(r) { return r.transaction_date.slice(0, 7) === ym; }));
    out.push({ key: ym, label: finMonthLabel(ym, true), Income: t.income, Expenses: t.expense });
  }
  return out;
}

var FinanceDB = {
  userId: function() {
    var user = window.currentSupabaseUser;
    if (!user) throw new Error('You are not signed in');
    return user.id;
  },

  fetchAll: async function() {
    var uid = FinanceDB.userId();
    var rows = [], from = 0, size = 1000;
    for (;;) {
      var res = await window.sb.from(FIN_TABLE).select('*')
        .eq('user_id', uid)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, from + size - 1);
      if (res.error) throw res.error;
      var chunk = res.data || [];
      rows = rows.concat(chunk);
      if (chunk.length < size) break;
      from += size;
    }
    return rows.map(finNormalize);
  },

  insert: async function(tx) {
    var res = await window.sb.from(FIN_TABLE)
      .insert({ user_id: FinanceDB.userId(), transaction_name: tx.transaction_name, type: tx.type, category: tx.category, amount: tx.amount, transaction_date: tx.transaction_date, notes: tx.notes || null, account_id: tx.account_id || null })
      .select().single();
    if (res.error) throw res.error;
    return finNormalize(res.data);
  },

  update: async function(id, tx) {
    var res = await window.sb.from(FIN_TABLE)
      .update({ transaction_name: tx.transaction_name, type: tx.type, category: tx.category, amount: tx.amount, transaction_date: tx.transaction_date, notes: tx.notes || null, account_id: tx.account_id || null })
      .eq('id', id).eq('user_id', FinanceDB.userId())
      .select().single();
    if (res.error) throw res.error;
    return finNormalize(res.data);
  },

  remove: async function(id) {
    var res = await window.sb.from(FIN_TABLE).delete().eq('id', id).eq('user_id', FinanceDB.userId());
    if (res.error) throw res.error;
  },
};

var FinanceAccountsDB = {
  fetchAll: async function() {
    var res = await window.sb.from(FIN_ACCOUNT_TABLE).select('*')
      .eq('user_id', FinanceDB.userId())
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (res.error) throw res.error;
    return (res.data || []).map(finNormalizeAccount);
  },

  insert: async function(a) {
    var res = await window.sb.from(FIN_ACCOUNT_TABLE)
      .insert({ user_id: FinanceDB.userId(), name: a.name, initial_balance: a.initial_balance, balance_as_of: a.balance_as_of, color: a.color, sort_order: a.sort_order || 0 })
      .select().single();
    if (res.error) throw res.error;
    return finNormalizeAccount(res.data);
  },

  update: async function(id, a) {
    var res = await window.sb.from(FIN_ACCOUNT_TABLE)
      .update({ name: a.name, initial_balance: a.initial_balance, balance_as_of: a.balance_as_of, color: a.color })
      .eq('id', id).eq('user_id', FinanceDB.userId())
      .select().single();
    if (res.error) throw res.error;
    return finNormalizeAccount(res.data);
  },

  remove: async function(id) {
    var res = await window.sb.from(FIN_ACCOUNT_TABLE).delete().eq('id', id).eq('user_id', FinanceDB.userId());
    if (res.error) throw res.error;
  },
};

window.FinanceDB = FinanceDB;
window.FinanceAccountsDB = FinanceAccountsDB;
