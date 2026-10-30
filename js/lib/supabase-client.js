// Supabase client bootstrap (Supabase JS v2 loaded from CDN in index.html)
(function () {
  var cfg = window.SUPABASE_CONFIG || {};
  var valid = cfg.url && cfg.publishableKey &&
    cfg.url.indexOf('YOUR_PROJECT_REF') === -1 &&
    cfg.publishableKey.indexOf('YOUR_SUPABASE') === -1;
  window.supabaseReady = !!(valid && window.supabase && window.supabase.createClient);
  if (window.supabaseReady) {
    window.sb = window.supabase.createClient(cfg.url, cfg.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }
})();
