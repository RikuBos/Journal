# Trade Journal

Jurnal trading untuk akun prop firm (FundedNext, E8, TopStep) dan akun broker biasa. Berjalan penuh di browser: tidak ada server, tidak ada build, data disimpan di IndexedDB milik browser kamu.

## Menjalankan

1. Taruh `favicon.png` (ikon tab) dan `logo.png` (logo sidebar) di folder yang sama dengan `index.html`. Keduanya boleh gambar berbeda. Kalau `logo.png` tidak ada, sidebar menampilkan teks "FT".
2. Buka `index.html` lewat Live Server (VS Code) atau hosting statis apa saja (Vercel, Netlify, GitHub Pages).
3. Perlu internet, karena React, Recharts, dan font diambil dari CDN.

Saat pertama dibuka aplikasi kosong. Tidak ada data contoh. Buat akun dulu di halaman Accounts.

## Halaman

| Halaman | Isi |
|---|---|
| Dashboard | Balance, P/L, target, drawdown, equity curve, P/L harian, statistik, streak |
| Trades | Daftar trade, filter, form trade (4 tab: detail, setup, review, screenshot) |
| Accounts | Daftar akun, buat/ubah/hapus, ganti akun aktif |
| Calendar | P/L per hari dalam kalender bulanan |
| Payout | Hitung dan catat payout, riwayat payout |
| Analytics | Statistik per session, setup, hari, dan kepatuhan aturan |
| Mistakes, Playbook | Daftar kesalahan dan setup trading milikmu |
| Reviews, Daily Journal | Review mingguan/bulanan dan jurnal harian |
| Settings | Preferensi, konsep trading, buffer payout, ekspor/impor data, Discord |

Edit dan hapus dilakukan lewat klik kanan pada baris trade, kartu akun, atau kartu playbook. Tidak ada tombol edit/hapus yang terlihat.

## Akun

Ada dua jenis akun, dipilih di form akun.

**Prop Firm.** Pilih firm, type (CFD atau Futures), model, size, phase, cycle type, dan profit split. Aturan (max loss, daily loss, target, consistency, tipe drawdown) terisi otomatis dari `js/data/propFirmData.js`.

- Phase: Phase 1, Phase 2, atau Funded. Akun Funded tidak punya profit target. Jumlah phase yang tampil mengikuti model.
- Cycle type: On Demand atau 14 Day. Ini menentukan syarat payout (lihat bagian Payout).
- Beberapa akun dengan model yang sama boleh dibuat dan diaktifkan bersamaan.

**Broker.** Cuma nama, saldo, dan status. Tidak ada aturan, target, atau drawdown di dashboard.

## Trade

Di form trade, field yang dihitung otomatis:

- **Risk amount** = `|entry - SL| x size x point value`
- **P/L** = `(exit - entry) x size x point value` (dibalik untuk short)
- **R:R** dari jarak entry, SL, dan TP
- **Position size**, kalau entry, SL, dan Risk % sudah diisi: `(starting balance x risk%) / (|entry - SL| x point value)`
- **Execution quality** (1-10), dihitung saat trade disimpan, tidak diinput manual
- **Grade**, otomatis juga, tapi bisa kamu timpa manual. Kalau ditimpa, label "manual override" muncul.

### Point value

Nilai dolar per 1 poin per kontrak/lot. Ada di `js/utils/calc.js` (`POINT_VALUES`). Instrumen yang tidak ada di tabel dianggap 1.

| Instrumen | Per poin |
|---|---|
| NQ / MNQ | $10 / $1 |
| ES / MES | $50 / $5 |
| YM / MYM | $5 / $0.5 |
| RTY | $50 |
| CL | $1000 |
| GC / SI | $100 / $5000 |
| Pair forex mayor | $10 |
| XAUUSD / XAGUSD | $100 / $5000 |
| BTCUSD / ETHUSD | $1 |

### Execution quality

Mulai dari 10, dikurangi:

- aturan dilanggar: 2.5
- ada mistake: Minor 1, Moderate 1.5, Major 2, Critical 3
- hasil jauh dari rencana (RR yang didapat dibanding RR rencana): rugi 2, kurang dari 50% 1.5, 50-99% 0.5
- trading saat news: 1
- setup atau konfirmasi kosong: 0.5 masing-masing

Batas bawah 1.

### Grade otomatis

`skor = (execution / 10) x 0.6 + min(R / 3, 1) x 0.4`

A+ mulai 0.90, A 0.78, B 0.62, C 0.46, D 0.30, di bawahnya F.

## Drawdown

Dashboard menampilkan drawdown **saat ini**: jarak balance ke puncaknya (puncak minimal sama dengan starting balance). Kalau balance membuat puncak baru, drawdown kembali 0 dan baru terisi lagi kalau balance turun dari puncak itu.

Ini penyederhanaan. Aplikasi tidak memodelkan trailing intraday atau EOD trailing milik firm secara persis, jadi angka resmi di dashboard firm tetap yang jadi acuan.

## Payout

Pilih akun di halaman Payout.

**Akun prop firm**, per cycle:

1. Cycle profit = balance sekarang dikurangi balance awal cycle.
2. Buffer (default $40, diatur per akun di Settings > Payout) ditinggal di akun.
3. Yang ditarik dari akun = cycle profit dikurangi buffer.
4. Yang masuk kantong = yang ditarik x profit split.

Syarat payout:

- **On Demand**: cycle profit minimal 2% dari balance awal cycle, dan kalau model punya consistency rule, hari profit terbaik tidak boleh melebihi batasnya (mis. 40%) dari cycle profit.
- **14 Day**: cycle profit harus positif.

Setelah payout: balance akun berkurang sebesar yang ditarik, cycle dimulai lagi dari 0 (profit dan consistency dihitung ulang dari trade sesudah payout), dan payout masuk ke tab History.

**Akun broker**: isi jumlah, klik Payout. Tidak ada buffer atau syarat. Balance berkurang sebesar jumlah itu.

## Discord

Settings > Discord Webhook. Tempel URL webhook, URL tersimpan saat kolom ditinggalkan.

Yang dikirim:

- setiap trade berstatus Closed yang disimpan
- jurnal harian dan review mingguan yang disimpan
- setiap payout (nama akun, tanggal, jam, jumlah, sisa balance)
- ringkasan mingguan (hari Sabtu) dan bulanan (tanggal 1): jumlah trade, win rate, rata-rata R:R, kualitas eksekusi, total P/L, perubahan balance

Catatan: karena ini halaman statis tanpa server, ringkasan mingguan dan bulanan **dikirim saat aplikasi dibuka pada hari itu**, bukan tepat jam 00:00. Kalau aplikasi tidak dibuka di hari Sabtu, ringkasan minggu itu tidak terkirim. Penanda "sudah dikirim" disimpan di localStorage supaya tidak terkirim dua kali.

## Data

- Semua data ada di IndexedDB (`FundedTradingJournal`) di browser yang kamu pakai. Pindah browser atau hapus data situs berarti data hilang.
- Settings > Data Management: ekspor semua data ke JSON, impor dari JSON, atau reset. Ekspor secara berkala.
- Pengaturan (termasuk buffer per akun) tersimpan otomatis.

## Menambah atau mengubah model prop firm

Edit `js/data/propFirmData.js`. Satu model:

```js
'Nama Model': {
  type: 'cfd',              // 'cfd' atau 'futures'
  phases: 2,                // 0 = instant, 1, atau 2
  drawdownType: 'static',   // 'static', 'trailing', 'eod_trailing'
  rewardShare: 90,
  consistencyRule: null,    // angka persen, atau null
  sizes: {
    25000: { dailyLoss: 1250, maxLoss: 2000, phase1Target: 2500, phase2Target: 1250 },
  },
},
```

Model 1 phase memakai `profitTarget` sebagai pengganti `phase1Target`. Lalu daftarkan objek modelnya di `PROP_FIRMS`.

Data FundedNext di file itu berasal dari halaman resmi FundedNext. Isian E8 Markets dan TopStep belum diverifikasi ke sumbernya. Cocokkan dulu sebelum dipakai.

## Struktur file

```
index.html
favicon.png, logo.png          (kamu yang menyediakan)
css/style.css
js/
  app.js                        root, routing halaman, tombol tambah trade
  lib/        db.js, state.js, discord.js
  utils/      calc.js           semua rumus
  data/       constants.js, propFirmData.js, sampleData.js
  components/
    shared/     ui.js, sidebar.js
    dashboard/  dashboard.js
    trades/     trades.js, tradeForm.js
    accounts/   accounts.js, accountForm.js, payoutPage.js
    mistakes/   pages.js        mistakes, playbook, reviews, journal, settings
    settings/   discordSettings.js
```

Urutan `<script>` di `index.html` penting, karena tidak ada bundler. File yang dipakai file lain harus dimuat lebih dulu. Semua deklarasi level atas memakai `var` supaya tidak bentrok antar file, dan `h` adalah `React.createElement` yang dideklarasikan sekali di `db.js`.

## Keterbatasan

- Satu browser, satu perangkat. Tidak ada sinkronisasi.
- Ringkasan Discord terjadwal bergantung pada aplikasi dibuka (lihat di atas).
- Drawdown disederhanakan, payout mengikuti rumus di atas, bukan perhitungan resmi firm.
