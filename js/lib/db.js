// ============================================================
// SUPABASE DATA LAYER — keeps the existing DB API used by the app
// ============================================================
var STORES = {
  accounts: 'accounts', trades: 'trades', journals: 'journals',
  weeklyReviews: 'weeklyReviews', monthlyReviews: 'monthlyReviews',
  playbook: 'playbook', settings: 'settings', mistakes: 'mistakes'
};

function genId() {
  return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
    Date.now() + '-' + Math.random().toString(36).slice(2, 10);
}
window.STORES = STORES;
window.genId = genId;
window.h = React.createElement;

function requireSupabaseUser() {
  if (!window.sb) throw new Error('Supabase belum dikonfigurasi. Isi js/lib/supabase-config.js terlebih dahulu.');
  var user = window.currentSupabaseUser;
  if (!user) throw new Error('Sesi user tidak ditemukan. Silakan login kembali.');
  return user;
}

// Store images in private Storage bucket; database keeps only storage paths.
async function prepareRecord(store, item, userId) {
  var copy = JSON.parse(JSON.stringify(item));
  if (store === STORES.trades && Array.isArray(copy.screenshots)) {
    for (var i = 0; i < copy.screenshots.length; i++) {
      var img = copy.screenshots[i];
      if (img && img.storagePath && img.dataUrl && img.dataUrl.indexOf('data:') !== 0) {
        // dataUrl may be an expiring signed URL from a previous read; never persist it.
        delete img.dataUrl;
      }
      if (img && img.dataUrl && img.dataUrl.indexOf('data:') === 0) {
        var parts = img.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!parts) continue;
        var mime = parts[1];
        var ext = (mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
        var path = userId + '/' + (copy.id || 'trade') + '/' + (img.id || genId()) + '.' + ext;
        var bytes = Uint8Array.from(atob(parts[2]), function(c) { return c.charCodeAt(0); });
        var blob = new Blob([bytes], { type: mime });
        var up = await window.sb.storage.from('trade-screenshots').upload(path, blob, {
          contentType: mime, upsert: true
        });
        if (up.error) throw up.error;
        img.storagePath = path;
        delete img.dataUrl;
      }
    }
  }
  return copy;
}

async function hydrateRecord(store, item) {
  var copy = JSON.parse(JSON.stringify(item));
  if (store === STORES.trades && Array.isArray(copy.screenshots)) {
    for (var i = 0; i < copy.screenshots.length; i++) {
      var img = copy.screenshots[i];
      if (img && img.storagePath) {
        var signed = await window.sb.storage.from('trade-screenshots').createSignedUrl(img.storagePath, 3600);
        if (!signed.error && signed.data) img.dataUrl = signed.data.signedUrl;
      }
    }
  }
  return copy;
}

async function dbGet(store, id) {
  var user = requireSupabaseUser();
  var res = await window.sb.from('user_records').select('data')
    .eq('user_id', user.id).eq('store', store).eq('record_id', String(id)).maybeSingle();
  if (res.error) throw res.error;
  return res.data ? hydrateRecord(store, res.data.data) : undefined;
}
async function dbGetAll(store) {
  var user = requireSupabaseUser();
  var res = await window.sb.from('user_records').select('data')
    .eq('user_id', user.id).eq('store', store);
  if (res.error) throw res.error;
  return Promise.all((res.data || []).map(function(row) { return hydrateRecord(store, row.data); }));
}
async function dbPut(store, item) {
  var user = requireSupabaseUser();
  var prepared = await prepareRecord(store, item, user.id);
  var res = await window.sb.from('user_records').upsert({
    user_id: user.id, store: store, record_id: String(prepared.id), data: prepared,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,store,record_id' });
  if (res.error) throw res.error;
  return hydrateRecord(store, prepared);
}
async function dbDelete(store, id) {
  var user = requireSupabaseUser();
  var res = await window.sb.from('user_records').delete()
    .eq('user_id', user.id).eq('store', store).eq('record_id', String(id));
  if (res.error) throw res.error;
}
async function dbClear(store) {
  var user = requireSupabaseUser();
  var res = await window.sb.from('user_records').delete().eq('user_id', user.id).eq('store', store);
  if (res.error) throw res.error;
}
async function uploadUserFile(file, folder) {
  var user = requireSupabaseUser();
  if (!file || !file.type || file.type.indexOf('image/') !== 0) throw new Error('Hanya file gambar yang diizinkan.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Ukuran gambar maksimal 8 MB.');
  var ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  var path = user.id + '/' + (folder || 'uploads') + '/' + genId() + '.' + ext;
  var up = await window.sb.storage.from('user-images').upload(path, file, { upsert: false, contentType: file.type });
  if (up.error) throw up.error;
  return { path: path, bucket: 'user-images' };
}
async function getUserFileUrl(path, bucket) {
  requireSupabaseUser();
  var r = await window.sb.storage.from(bucket || 'user-images').createSignedUrl(path, 3600);
  if (r.error) throw r.error;
  return r.data.signedUrl;
}
async function deleteUserFile(path, bucket) {
  requireSupabaseUser();
  var r = await window.sb.storage.from(bucket || 'user-images').remove([path]);
  if (r.error) throw r.error;
}
window.DB = { get: dbGet, getAll: dbGetAll, put: dbPut, delete: dbDelete, clear: dbClear,
  uploadFile: uploadUserFile, getFileUrl: getUserFileUrl, deleteFile: deleteUserFile };

// Prevent mousewheel from changing number input values
document.addEventListener('wheel', function(e) {
  if (document.activeElement && document.activeElement.type === 'number') document.activeElement.blur();
}, { passive: true });
