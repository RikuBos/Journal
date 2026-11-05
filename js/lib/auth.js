function authMessage(err) {
  var msg = ((err && err.message) || '').toLowerCase();
  var code = ((err && err.code) || '').toLowerCase();
  if (code === 'invalid_credentials' || msg.indexOf('invalid login credentials') >= 0)
    return 'Email atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali.';
  if (code === 'email_not_confirmed' || msg.indexOf('email not confirmed') >= 0)
    return 'Email Anda belum diverifikasi. Silakan periksa kotak masuk untuk menyelesaikan verifikasi.';
  if (code === 'user_already_exists' || msg.indexOf('already registered') >= 0 || msg.indexOf('already been registered') >= 0)
    return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
  if (code === 'weak_password' || msg.indexOf('password should be at least') >= 0)
    return 'Kata sandi minimal 6 karakter.';
  if (msg.indexOf('rate limit') >= 0 || code.indexOf('rate_limit') >= 0 || msg.indexOf('too many') >= 0)
    return 'Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.';
  if (msg.indexOf('failed to fetch') >= 0 || msg.indexOf('network') >= 0)
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  return 'Terjadi kendala saat memproses permintaan. Silakan coba lagi.';
}

function AuthLogo() {
  return h('img', { src: 'logo.png', alt: '', className: 'auth-logo', onError: function(e) { e.target.style.display = 'none'; } });
}

function AuthGate() {
  var useState = React.useState, useEffect = React.useEffect;
  var [session, setSession] = useState(null);
  var [checking, setChecking] = useState(true);
  var [recovery, setRecovery] = useState(false);
  var [mode, setMode] = useState('login');
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [password2, setPassword2] = useState('');
  var [busy, setBusy] = useState(false);
  var [message, setMessage] = useState('');
  var [error, setError] = useState('');

  useEffect(function() {
    if (!window.supabaseReady || !window.sb) { setChecking(false); return; }
    window.sb.auth.getSession().then(function(r) {
      setSession(r.data.session || null);
      window.currentSupabaseUser = r.data.session ? r.data.session.user : null;
      setChecking(false);
    }).catch(function() { setError(authMessage(null)); setChecking(false); });
    var sub = window.sb.auth.onAuthStateChange(function(event, nextSession) {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      setSession(nextSession);
      window.currentSupabaseUser = nextSession ? nextSession.user : null;
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'register') {
        var r = await window.sb.auth.signUp({ email: email.trim(), password: password });
        if (r.error) throw r.error;
        var identities = r.data && r.data.user && r.data.user.identities;
        if (identities && identities.length === 0) {
          setError('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
        } else if (!r.data.session) {
          setMessage('Pendaftaran berhasil. Silakan periksa email Anda untuk verifikasi, lalu masuk.');
        } else {
          setMessage('Akun berhasil dibuat.');
        }
      } else {
        var r2 = await window.sb.auth.signInWithPassword({ email: email.trim(), password: password });
        if (r2.error) throw r2.error;
      }
    } catch (e2) { setError(authMessage(e2)); }
    finally { setBusy(false); }
  }

  async function saveNewPassword(e) {
    e.preventDefault(); setError('');
    if (password.length < 6) { setError('Kata sandi minimal 6 karakter.'); return; }
    if (password !== password2) { setError('Konfirmasi kata sandi tidak sama.'); return; }
    setBusy(true);
    try {
      var r = await window.sb.auth.updateUser({ password: password });
      if (r.error) throw r.error;
      setPassword(''); setPassword2('');
      setRecovery(false);
    } catch (e2) { setError(authMessage(e2)); }
    finally { setBusy(false); }
  }

  if (checking) return h('div', { className:'auth-screen' }, h(AuthLogo), h('div', { className:'spinner' }), h('p', null, 'Checking session…'));
  if (!window.supabaseReady) return h('div', { className:'auth-screen' },
    h('div', { className:'auth-card' },
      h(AuthLogo),
      h('h2', null, 'Supabase setup required'),
      h('p', null, 'Isi Project URL dan Publishable Key di js/lib/supabase-config.js, lalu reload aplikasi.'),
      h('code', { className:'auth-code' }, 'js/lib/supabase-config.js')
    )
  );

  if (session && recovery) return h('div', { className:'auth-screen' },
    h('form', { className:'auth-card', onSubmit:saveNewPassword },
      h(AuthLogo),
      h('h2', null, 'Atur kata sandi baru'),
      h('p', null, 'Trading Journal'),
      h('label', null, 'Password baru'),
      h('input', { type:'password', required:true, minLength:6, autoComplete:'new-password', value:password, onChange:function(e){setPassword(e.target.value);} }),
      h('label', null, 'Konfirmasi password'),
      h('input', { type:'password', required:true, minLength:6, autoComplete:'new-password', value:password2, onChange:function(e){setPassword2(e.target.value);} }),
      error && h('div', { className:'auth-error' }, error),
      h('button', { type:'submit', className:'btn btn-primary auth-submit', disabled:busy }, busy ? 'Menyimpan…' : 'Simpan password')
    )
  );

  if (session) return h(AppProvider, { key: session.user.id }, h(App));

  return h('div', { className:'auth-screen' },
    h('form', { className:'auth-card', onSubmit:submit },
      h(AuthLogo),
      h('h2', null, mode === 'login' ? 'Welcome back' : 'Create your account'),
      h('p', null, 'Trading Journal'),
      h('label', null, 'Email'),
      h('input', { type:'email', required:true, autoComplete:'email', value:email, onChange:function(e){setEmail(e.target.value);}, placeholder:'you@example.com' }),
      h('label', null, 'Password'),
      h('input', { type:'password', required:true, minLength:6, autoComplete:mode === 'login' ? 'current-password' : 'new-password', value:password, onChange:function(e){setPassword(e.target.value);}, placeholder:'Minimal 6 karakter' }),
      error && h('div', { className:'auth-error' }, error),
      message && h('div', { className:'auth-message' }, message),
      h('button', { type:'submit', className:'btn btn-primary auth-submit', disabled:busy }, busy ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Create account')),
      h('button', { type:'button', className:'auth-switch', onClick:function(){setMode(mode === 'login' ? 'register' : 'login');setError('');setMessage('');} },
        mode === 'login' ? 'New here? Create an account' : 'Already registered? Login'
      )
    )
  );
}
window.AuthGate = AuthGate;
