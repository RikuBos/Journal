// ============================================================
// DISCORD WEBHOOK SERVICE
// Pure functions - no React dependency
// All text is clean: no emoji, no markdown symbols
// ============================================================

var DiscordWebhook = (function () {

  // Strip all markdown / emoji / special chars that look bad in Discord embeds
  function clean(str) {
    if (!str) return '';
    return String(str)
      .replace(/[*_~`|>]/g, '')   // markdown symbols
      .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')  // emoji unicode ranges
      .replace(/[\u{2600}-\u{27BF}]/gu, '')     // misc symbols
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')   // more emoji
      .replace(/\n{3,}/g, '\n\n') // collapse excess newlines
      .trim();
  }

  function fmt(val, currency) {
    if (val == null) return '-';
    currency = currency || 'USD';
    var prefix = { USD: '$', EUR: 'EUR ', GBP: 'GBP ', JPY: 'JPY ' }[currency] || '';
    var abs = Math.abs(val);
    var str = abs >= 1000 ? (abs / 1000).toFixed(2) + 'k' : abs.toFixed(2);
    return val < 0 ? '-' + prefix + str : prefix + str;
  }

  function fmtR(val) {
    if (val == null) return '-';
    return (val >= 0 ? '+' : '') + val.toFixed(2) + 'R';
  }

  function fmtPct(val) {
    if (val == null) return '-';
    return val.toFixed(1) + '%';
  }

  // Color codes for Discord embed sidebar
  var COLOR = {
    win:     0x10b981,  // green
    loss:    0xef4444,  // red
    neutral: 0x3b82f6,  // blue
    warning: 0xf59e0b,  // amber
    journal: 0x8b5cf6,  // purple
    review:  0x06b6d4,  // cyan
  };

  // ── BUILD PAYLOADS ──────────────────────────────────────────

  function buildTradeEmbed(trade, account, settings) {
    var isWin   = (trade.profitLoss || 0) > 0;
    var isLoss  = (trade.profitLoss || 0) < 0;
    var color   = isWin ? COLOR.win : isLoss ? COLOR.loss : COLOR.neutral;
    var currency = settings.currency || 'USD';

    var resultLine = isWin ? 'WIN' : isLoss ? 'LOSS' : 'BREAKEVEN';
    var plStr  = fmt(trade.profitLoss, currency);
    var rStr   = fmtR(trade.rMultiple);

    var fields = [
      { name: 'Result',      value: resultLine,                        inline: true },
      { name: 'P/L',         value: plStr,                             inline: true },
      { name: 'R Multiple',  value: rStr,                              inline: true },
      { name: 'Instrument',  value: clean(trade.instrument) || '-',    inline: true },
      { name: 'Direction',   value: clean(trade.direction)  || '-',    inline: true },
      { name: 'Session',     value: clean(trade.session)    || '-',    inline: true },
      { name: 'Setup',       value: clean(trade.setup)      || '-',    inline: true },
      { name: 'Confirmation',value: clean(trade.confirmation)|| '-',   inline: true },
      { name: 'Grade',       value: clean(trade.tradeGrade)  || '-',   inline: true },
      { name: 'Entry',       value: String(trade.entryPrice || '-'),   inline: true },
      { name: 'Exit',        value: String(trade.exitPrice  || '-'),   inline: true },
      { name: 'Risk',        value: fmt(trade.riskAmount, currency),   inline: true },
    ];

    if (trade.mistake) {
      fields.push({ name: 'Mistake', value: clean(trade.mistake), inline: false });
    }
    if (trade.notes) {
      var note = clean(trade.notes).substring(0, 200);
      if (note) fields.push({ name: 'Notes', value: note, inline: false });
    }
    if (account) {
      fields.push({ name: 'Account', value: clean(account.name), inline: false });
    }

    return {
      username: clean(settings.discordUsername) || 'Trading Journal',
      embeds: [{
        title: clean(trade.instrument) + ' ' + clean(trade.direction) + ' - ' + clean(trade.date),
        description: resultLine + '  ' + plStr + '  (' + rStr + ')',
        color: color,
        fields: fields,
        footer: {
          text: 'Funded Trading Journal - ' + clean(trade.date) + ' ' + (clean(trade.time) || ''),
        },
        timestamp: new Date().toISOString(),
      }],
    };
  }

  function buildTradePlain(trade, account, settings) {
    var currency = settings.currency || 'USD';
    var isWin    = (trade.profitLoss || 0) > 0;
    var result   = isWin ? 'WIN' : (trade.profitLoss || 0) < 0 ? 'LOSS' : 'BREAKEVEN';

    var lines = [
      'TRADE JOURNAL - ' + clean(trade.date),
      '---',
      'Instrument : ' + clean(trade.instrument),
      'Direction  : ' + clean(trade.direction),
      'Result     : ' + result,
      'P/L        : ' + fmt(trade.profitLoss, currency),
      'R Multiple : ' + fmtR(trade.rMultiple),
      'Session    : ' + clean(trade.session),
      'Setup      : ' + (clean(trade.setup) || '-'),
      'Confirmation : ' + (clean(trade.confirmation) || '-'),
      'Grade      : ' + clean(trade.tradeGrade),
      'Entry      : ' + (trade.entryPrice || '-'),
      'Exit       : ' + (trade.exitPrice  || '-'),
      'Risk       : ' + fmt(trade.riskAmount, currency),
    ];

    if (trade.mistake) lines.push('Mistake    : ' + clean(trade.mistake));
    if (account)       lines.push('Account    : ' + clean(account.name));
    if (trade.notes)   lines.push('Notes      : ' + clean(trade.notes).substring(0, 300));

    return {
      username: clean(settings.discordUsername) || 'Trading Journal',
      content: lines.join('\n'),
    };
  }

  function buildJournalEmbed(journal, dayTrades, settings) {
    var currency  = settings.currency || 'USD';
    var dayPL     = dayTrades.reduce(function(s, t) { return s + (t.profitLoss || 0); }, 0);
    var wins      = dayTrades.filter(function(t) { return (t.profitLoss || 0) > 0; }).length;
    var winRate   = dayTrades.length ? (wins / dayTrades.length) * 100 : 0;
    var color     = dayPL >= 0 ? COLOR.win : COLOR.loss;

    var fields = [
      { name: 'Date',         value: clean(journal.date),                inline: true },
      { name: 'Trades Taken', value: String(dayTrades.length),           inline: true },
      { name: 'Day P/L',      value: fmt(dayPL, currency),               inline: true },
      { name: 'Win Rate',     value: fmtPct(winRate),                    inline: true },
      { name: 'Market Bias',  value: clean(journal.marketBias) || '-',   inline: true },
      { name: 'Emotion',      value: clean(journal.emotionalState) || '-', inline: true },
    ];

    if (journal.plan) {
      fields.push({ name: 'Plan', value: clean(journal.plan).substring(0, 300), inline: false });
    }
    if (journal.actualMarketBehavior) {
      fields.push({ name: 'Market Behavior', value: clean(journal.actualMarketBehavior).substring(0, 300), inline: false });
    }
    if (journal.lessons) {
      fields.push({ name: 'Lessons Learned', value: clean(journal.lessons).substring(0, 300), inline: false });
    }
    if (journal.tomorrowPlan) {
      fields.push({ name: 'Tomorrow Plan', value: clean(journal.tomorrowPlan).substring(0, 300), inline: false });
    }

    return {
      username: clean(settings.discordUsername) || 'Trading Journal',
      embeds: [{
        title: 'Daily Journal - ' + clean(journal.date),
        description: 'Day result: ' + fmt(dayPL, currency) + ' across ' + dayTrades.length + ' trade' + (dayTrades.length !== 1 ? 's' : ''),
        color: color,
        fields: fields,
        footer: { text: 'Funded Trading Journal' },
        timestamp: new Date().toISOString(),
      }],
    };
  }

  function buildJournalPlain(journal, dayTrades, settings) {
    var currency  = settings.currency || 'USD';
    var dayPL     = dayTrades.reduce(function(s, t) { return s + (t.profitLoss || 0); }, 0);
    var wins      = dayTrades.filter(function(t) { return (t.profitLoss || 0) > 0; }).length;
    var winRate   = dayTrades.length ? (wins / dayTrades.length) * 100 : 0;

    var lines = [
      'DAILY JOURNAL - ' + clean(journal.date),
      '---',
      'Trades     : ' + dayTrades.length,
      'Win Rate   : ' + fmtPct(winRate),
      'Day P/L    : ' + fmt(dayPL, currency),
      'Market Bias: ' + (clean(journal.marketBias) || '-'),
      'Emotion    : ' + (clean(journal.emotionalState) || '-'),
    ];
    if (journal.plan)                  lines.push('Plan       : ' + clean(journal.plan).substring(0, 300));
    if (journal.actualMarketBehavior)  lines.push('Market     : ' + clean(journal.actualMarketBehavior).substring(0, 300));
    if (journal.lessons)               lines.push('Lessons    : ' + clean(journal.lessons).substring(0, 300));
    if (journal.tomorrowPlan)          lines.push('Tomorrow   : ' + clean(journal.tomorrowPlan).substring(0, 300));

    return {
      username: clean(settings.discordUsername) || 'Trading Journal',
      content: lines.join('\n'),
    };
  }

  function buildWeeklyEmbed(review, settings) {
    var currency = settings.currency || 'USD';
    var isPos    = (review.totalPL || 0) >= 0;
    var color    = isPos ? COLOR.win : COLOR.loss;

    var fields = [
      { name: 'Period',        value: review.weekStart + ' to ' + review.weekEnd, inline: false },
      { name: 'Trades',        value: String(review.totalTrades || 0),  inline: true },
      { name: 'Win Rate',      value: fmtPct(review.winRate || 0),      inline: true },
      { name: 'Total R',       value: fmtR(review.totalR || 0),         inline: true },
      { name: 'Total P/L',     value: fmt(review.totalPL, currency),    inline: true },
      { name: 'P-Factor',      value: review.profitFactor ? review.profitFactor.toFixed(2) : '-', inline: true },
      { name: 'Rule Compliance',value: fmtPct(review.ruleCompliance || 0), inline: true },
    ];
    if (review.whatWorked)       fields.push({ name: 'What Worked',       value: clean(review.whatWorked).substring(0, 300),       inline: false });
    if (review.whatFailed)       fields.push({ name: 'What Failed',       value: clean(review.whatFailed).substring(0, 300),       inline: false });
    if (review.needsImprovement) fields.push({ name: 'Needs Improvement', value: clean(review.needsImprovement).substring(0, 300), inline: false });
    if (review.nextWeekFocus)    fields.push({ name: 'Next Week Focus',   value: clean(review.nextWeekFocus).substring(0, 300),    inline: false });

    return {
      username: clean(settings.discordUsername) || 'Trading Journal',
      embeds: [{
        title: 'Weekly Review - ' + review.weekStart,
        description: (isPos ? 'Profitable' : 'Unprofitable') + ' week: ' + fmt(review.totalPL, currency),
        color: color,
        fields: fields,
        footer: { text: 'Funded Trading Journal' },
        timestamp: new Date().toISOString(),
      }],
    };
  }

  function buildWeeklyPlain(review, settings) {
    var currency = settings.currency || 'USD';
    var lines = [
      'WEEKLY REVIEW - ' + review.weekStart + ' to ' + review.weekEnd,
      '---',
      'Trades     : ' + (review.totalTrades || 0),
      'Win Rate   : ' + fmtPct(review.winRate || 0),
      'Total R    : ' + fmtR(review.totalR || 0),
      'Total P/L  : ' + fmt(review.totalPL, currency),
      'Compliance : ' + fmtPct(review.ruleCompliance || 0),
    ];
    if (review.whatWorked)       lines.push('What Worked       : ' + clean(review.whatWorked).substring(0, 300));
    if (review.whatFailed)       lines.push('What Failed       : ' + clean(review.whatFailed).substring(0, 300));
    if (review.needsImprovement) lines.push('Needs Improvement : ' + clean(review.needsImprovement).substring(0, 300));
    if (review.nextWeekFocus)    lines.push('Next Week Focus   : ' + clean(review.nextWeekFocus).substring(0, 300));
    return {
      username: clean(settings.discordUsername) || 'Trading Journal',
      content: lines.join('\n'),
    };
  }

  // ── SEND ───────────────────────────────────────────────────

  async function send(webhookUrl, payload) {
    if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      return { ok: false, error: 'Invalid webhook URL. Must start with https://discord.com/api/webhooks/' };
    }
    try {
      var res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok || res.status === 204) {
        return { ok: true };
      }
      var text = await res.text();
      return { ok: false, error: 'Discord returned ' + res.status + ': ' + text.substring(0, 200) };
    } catch (err) {
      return { ok: false, error: err.message || 'Network error' };
    }
  }

  // ── PUBLIC API ─────────────────────────────────────────────

  async function sendTrade(trade, account, settings) {
    if (!settings.discordEnabled || !settings.discordSendOnTrade) return { ok: false, error: 'Disabled' };
    var payload = settings.discordFormat === 'plain'
      ? buildTradePlain(trade, account, settings)
      : buildTradeEmbed(trade, account, settings);
    return send(settings.discordWebhookUrl, payload);
  }

  async function sendJournal(journal, dayTrades, settings) {
    if (!settings.discordEnabled || !settings.discordSendOnJournal) return { ok: false, error: 'Disabled' };
    var payload = settings.discordFormat === 'plain'
      ? buildJournalPlain(journal, dayTrades, settings)
      : buildJournalEmbed(journal, dayTrades, settings);
    return send(settings.discordWebhookUrl, payload);
  }

  async function sendWeeklyReview(review, settings) {
    if (!settings.discordEnabled || !settings.discordSendOnWeeklyReview) return { ok: false, error: 'Disabled' };
    var payload = settings.discordFormat === 'plain'
      ? buildWeeklyPlain(review, settings)
      : buildWeeklyEmbed(review, settings);
    return send(settings.discordWebhookUrl, payload);
  }

  async function testWebhook(settings) {
    var payload = {
      username: settings.discordUsername || 'Trading Journal',
      content: 'Trading Journal connected successfully. Webhook is working.',
    };
    return send(settings.discordWebhookUrl, payload);
  }

  return {
    sendTrade:        sendTrade,
    sendJournal:      sendJournal,
    sendWeeklyReview: sendWeeklyReview,
    testWebhook:      testWebhook,
  };
})();

window.DiscordWebhook = DiscordWebhook;
