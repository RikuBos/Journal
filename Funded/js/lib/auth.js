// ============================================================
// AUTH GATE — login/register without changing existing dashboard UI
// ============================================================
function AuthGate() {
  var useState = React.useState, useEffect = React.useEffect;
  var [session, setSession] = useState(null);
  var [checking, setChecking] = useState(true);
  var [mode, setMode] = useState('login');
  var [email, setEmail] = useState('');
  var [password, setPassword] = useState('');
  var [busy, setBusy] = useState(false);
  var [message, setMessage] = useState('');
  var [error, setError] = useState('');

  useEffect(function() {
    if (!window.supabaseReady || !window.sb) { setChecking(false); return; }
    window.sb.auth.getSession().then(function(r) {
      setSession(r.data.session || null);
      window.currentSupabaseUser = r.data.session ? r.data.session.user : null;
      setChecking(false);
    }).catch(function(e) { setError(e.message); setChecking(false); });
    var sub = window.sb.auth.onAuthStateChange(function(_event, nextSession) {
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
        if (!r.data.session) setMessage('Registrasi berhasil. Cek email untuk verifikasi, lalu login.');
        else setMessage('Akun berhasil dibuat.');
      } else {
        var r2 = await window.sb.auth.signInWithPassword({ email: email.trim(), password: password });
        if (r2.error) throw r2.error;
      }
    } catch (e2) { setError(e2.message || 'Autentikasi gagal.'); }
    finally { setBusy(false); }
  }

  if (checking) return h('div', { className:'auth-screen' }, h('div', { className:'spinner' }), h('p', null, 'Checking session…'));
  if (!window.supabaseReady) return h('div', { className:'auth-screen' },
    h('div', { className:'auth-card' },
      h('div', { className:'auth-brand' }, 'FT'),
      h('h2', null, 'Supabase setup required'),
      h('p', null, 'Isi Project URL dan Publishable Key di js/lib/supabase-config.js, lalu reload aplikasi.'),
      h('code', { className:'auth-code' }, 'js/lib/supabase-config.js')
    )
  );
  if (session) return h(React.Fragment, null,
    h('div', { className:'auth-userbar' },
      h('span', null, session.user.email),
      h('button', { className:'btn btn-secondary btn-sm', onClick: async function() { await window.sb.auth.signOut(); } }, 'Sign out')
    ),
    h(AppProvider, { key: session.user.id }, h(App))
  );

  return h('div', { className:'auth-screen' },
    h('form', { className:'auth-card', onSubmit:submit },
      h('div', { className:'auth-brand' }, 'FT'),
      h('h2', null, mode === 'login' ? 'Welcome back' : 'Create your account'),
      h('p', null, 'Funded Trading Journal'),
      h('label', null, 'Email'),
      h('input', { type:'email', required:true, autoComplete:'email', value:email, onChange:function(e){setEmail(e.target.value);}, placeholder:'you@example.com' }),
      h('label', null, 'Password'),
      h('input', { type:'password', required:true, minLength:6, autoComplete:mode === 'login' ? 'current-password' : 'new-password', value:password, onChange:function(e){setPassword(e.target.value);}, placeholder:'At least 6 characters' }),
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
