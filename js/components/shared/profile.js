function useAuthUser() {
  var [user, setUser] = React.useState(window.currentSupabaseUser || null);
  React.useEffect(function() {
    if (!window.sb) return;
    var sub = window.sb.auth.onAuthStateChange(function(_event, session) {
      setUser(session ? session.user : null);
    });
    return function() { sub.data.subscription.unsubscribe(); };
  }, []);
  return user;
}

function useAvatarUrl(path) {
  var [url, setUrl] = React.useState('');
  React.useEffect(function() {
    var cancelled = false;
    if (!path) { setUrl(''); return; }
    DB.getFileUrl(path, 'user-images')
      .then(function(u) { if (!cancelled) setUrl(u); })
      .catch(function() { if (!cancelled) setUrl(''); });
    return function() { cancelled = true; };
  }, [path]);
  return url;
}

function displayName(user) {
  var meta = (user && user.user_metadata) || {};
  return meta.username || ((user && user.email) || '').split('@')[0] || 'User';
}

function Avatar({ user, size }) {
  var meta = (user && user.user_metadata) || {};
  var url = useAvatarUrl(meta.avatar_path);
  var initial = displayName(user).charAt(0).toUpperCase();
  return h('div', { className: 'avatar' + (size === 'lg' ? ' lg' : '') },
    url ? h('img', { src: url, alt: '' }) : initial
  );
}

function AccountModal({ open, onClose, user }) {
  var meta = (user && user.user_metadata) || {};
  var [username, setUsername] = React.useState(meta.username || '');
  var [pw, setPw] = React.useState('');
  var [pw2, setPw2] = React.useState('');
  var [busy, setBusy] = React.useState('');
  var fileRef = React.useRef(null);

  React.useEffect(function() {
    if (open) { setUsername(meta.username || ''); setPw(''); setPw2(''); }
  }, [open]);

  if (!open || !user) return null;

  async function run(key, fn, okMsg) {
    setBusy(key);
    try { await fn(); if (okMsg) UI.toast(okMsg, 'success'); }
    catch (err) { UI.toast(err.message || 'Something went wrong', 'error'); }
    setBusy('');
  }

  function saveUsername() {
    return run('username', async function() {
      var r = await window.sb.auth.updateUser({ data: { username: username.trim() } });
      if (r.error) throw r.error;
    }, 'Username saved');
  }

  function pickPhoto(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    run('photo', async function() {
      var old = meta.avatar_path;
      var up = await DB.uploadFile(file, 'avatars');
      var r = await window.sb.auth.updateUser({ data: { avatar_path: up.path } });
      if (r.error) throw r.error;
      if (old) { try { await DB.deleteFile(old, 'user-images'); } catch (err) {} }
    }, 'Photo updated');
  }

  function removePhoto() {
    return run('photo', async function() {
      var old = meta.avatar_path;
      var r = await window.sb.auth.updateUser({ data: { avatar_path: null } });
      if (r.error) throw r.error;
      if (old) { try { await DB.deleteFile(old, 'user-images'); } catch (err) {} }
    }, 'Photo removed');
  }

  function changePassword() {
    if (pw.length < 6) { UI.toast('Password must be at least 6 characters', 'error'); return; }
    if (pw !== pw2) { UI.toast('Passwords do not match', 'error'); return; }
    return run('password', async function() {
      var r = await window.sb.auth.updateUser({ password: pw });
      if (r.error) throw r.error;
      setPw(''); setPw2('');
    }, 'Password updated');
  }

  var section = { padding: '18px 0', borderBottom: '1px solid var(--border-1)' };

  return h(UI.Modal, { open: open, onClose: onClose, title: 'Account' },
    h('div', { style: Object.assign({}, section, { paddingTop: 0, display: 'flex', alignItems: 'center', gap: 16 }) },
      h(Avatar, { user: user, size: 'lg' }),
      h('div', { style: { display: 'flex', gap: 8 } },
        h('input', { ref: fileRef, type: 'file', accept: 'image/png,image/jpeg,image/webp', style: { display: 'none' }, onChange: pickPhoto }),
        h('button', { className: 'btn btn-secondary btn-sm', disabled: busy === 'photo', onClick: function() { fileRef.current && fileRef.current.click(); } },
          busy === 'photo' ? 'Uploading…' : 'Change photo'),
        meta.avatar_path && h('button', { className: 'btn btn-ghost btn-sm', disabled: busy === 'photo', onClick: removePhoto }, 'Remove')
      )
    ),

    h('div', { style: section },
      h('div', { className: 'input-group' },
        h('label', { className: 'input-label' }, 'Username'),
        h('div', { style: { display: 'flex', gap: 8 } },
          h('input', { className: 'input-field', value: username, placeholder: displayName(user), maxLength: 40,
            onChange: function(e) { setUsername(e.target.value); },
            onKeyDown: function(e) { if (e.key === 'Enter') saveUsername(); } }),
          h('button', { className: 'btn btn-primary', disabled: busy === 'username', onClick: saveUsername }, 'Save')
        )
      ),
      h('div', { className: 'input-group', style: { marginBottom: 0 } },
        h('label', { className: 'input-label' }, 'Email'),
        h('input', { className: 'input-field', value: user.email || '', disabled: true, style: { opacity: 0.6 } })
      )
    ),

    h('div', { style: { paddingTop: 18 } },
      h('div', { className: 'form-row' },
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'New password'),
          h('input', { className: 'input-field', type: 'password', autoComplete: 'new-password', value: pw, onChange: function(e) { setPw(e.target.value); } })
        ),
        h('div', { className: 'input-group' },
          h('label', { className: 'input-label' }, 'Confirm password'),
          h('input', { className: 'input-field', type: 'password', autoComplete: 'new-password', value: pw2, onChange: function(e) { setPw2(e.target.value); } })
        )
      ),
      h('button', { className: 'btn btn-secondary', disabled: busy === 'password' || !pw, onClick: changePassword }, 'Update password')
    )
  );
}

function ProfileMenu() {
  var user = useAuthUser();
  var [open, setOpen] = React.useState(false);
  var [showAccount, setShowAccount] = React.useState(false);
  var wrapRef = React.useRef(null);

  React.useEffect(function() {
    if (!open) return;
    function onDown(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDown);
    return function() { document.removeEventListener('mousedown', onDown); };
  }, [open]);

  if (!user) return null;

  return h('div', { className: 'profile', ref: wrapRef },
    h('div', { onClick: function() { setOpen(function(o) { return !o; }); } }, h(Avatar, { user: user })),
    open && h('div', { className: 'profile-menu' },
      h('div', { className: 'profile-menu-head' },
        h(Avatar, { user: user }),
        h('div', { style: { minWidth: 0 } },
          h('div', { className: 'profile-menu-name' }, displayName(user)),
          h('div', { className: 'profile-menu-email' }, user.email)
        )
      ),
      h('div', { className: 'profile-menu-item', onClick: function() { setOpen(false); setShowAccount(true); } }, 'Account settings'),
      h('div', { className: 'profile-menu-item danger', onClick: function() { window.sb.auth.signOut(); } }, 'Sign out')
    ),
    h(AccountModal, { open: showAccount, onClose: function() { setShowAccount(false); }, user: user })
  );
}

window.ProfileMenu = ProfileMenu;
