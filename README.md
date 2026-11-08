# Trading Journal

Jurnal trading untuk akun prop firm (FundedNext, E8, TopStep), akun broker, dan akun exchange crypto. Frontend-nya HTML/CSS/JavaScript biasa tanpa build. Login, data, dan gambar disimpan di Supabase, jadi data per user terpisah dan tidak hilang kalau browser dibersihkan.

## Menjalankan

1. Siapkan Supabase mengikuti `SUPABASE-SETUP.md` (jalankan `supabase/schema.sql`, atur auth, bucket storage, redirect URL).
2. Isi URL dan publishable key di `js/lib/supabase-config.js`.
3. Taruh `favicon.png` (ikon tab) dan `logo.png` di folder yang sama dengan `index.html`. `logo.png` dipakai di sidebar, layar login, dan layar loading.
4. Buka lewat Live Server (VS Code) atau deploy statis (Vercel). Membuka `index.html` langsung dari file tidak cukup untuk login Supabase.
5. Perlu internet: React, Recharts, Supabase JS, dan font diambil dari CDN.

Pertama kali dibuka, daftar dulu lalu buat akun di halaman Accounts. Tidak ada data contoh.

Halaman memasang `darkreader-lock` dan `color-scheme: dark`, jadi Dark Reader tidak mengubah tampilan. Ekstensi dark mode lain tidak bisa dimatikan dari sisi halaman.

## Login dan profil

- Pesan kesalahan login dan daftar memakai bahasa Indonesia. Mendaftar dengan email yang sudah terdaftar ditolak dengan pemberitahuan.
- Di pojok kanan atas halaman Dashboard ada avatar. Klik untuk membuka menu Account settings dan Sign out.
- Account settings: ganti foto profil, ubah username, lihat email (tidak bisa diubah dari sini), dan kirim link reset password ke email. Link itu membuka layar "Atur kata sandi baru" di aplikasi.
- Username dan foto disimpan di metadata user Supabase. Foto masuk ke bucket privat `user-images`.

## Halaman

| Halaman | Isi |
|---|---|
| Dashboard | Balance, P/L, target, drawdown, equity curve bulan berjalan, P/L 7 hari terakhir, statistik, streak |
| Trades | Daftar trade, filter, form trade (4 tab: detail, setup, review, screenshot) |
| Accounts | Daftar akun, buat/ubah/hapus, ganti akun aktif |
| Calendar | P/L per hari dalam kalender bulanan |
| Payout | Hitung dan catat payout, riwayat payout |
| Analytics | Statistik per session, setup, hari, kepatuhan aturan, dan Archive equity curve bulan lalu |
| Mistakes, Playbook | Daftar kesalahan dan setup trading milikmu |
| Reviews, Daily Journal | Review mingguan/bulanan dan jurnal harian |
| Settings | Preferensi, konsep trading, buffer payout, Discord |

Sidebar selalu mulai dalam keadaan tertutup. Tombol "+" di kanan bawah muncul di Dashboard, Trades, dan Accounts: di Accounts membuat akun baru, di dua halaman lain membuat trade baru.

Edit dan hapus dilakukan lewat klik kanan pada baris trade, kartu akun, kartu playbook, dan riwayat payout. Tidak ada tombol edit/hapus yang terlihat.

## Akun

Tiga jenis akun, dipilih di form akun.

**Prop Firm.** Pilih firm, type (CFD atau Futures), model, size, phase, cycle type, dan profit split. Aturan (max loss, daily loss, target, consistency, tipe drawdown) terisi otomatis dari `js/data/propFirmData.js`.

- Phase: Phase 1, Phase 2, atau Funded. Akun Funded tidak punya profit target.
- Cycle type: On Demand atau 14 Day. Ini menentukan syarat payout.
- Beberapa akun dengan model yang sama boleh dibuat dan diaktifkan bersamaan.
- **Naik phase otomatis**: saat trade Closed disimpan dan profit di phase itu mencapai target, Phase 1 pindah ke Phase 2 (atau langsung Funded untuk model satu phase), Phase 2 pindah ke Funded. Setiap pindah phase, akun mulai lagi dari starting balance (mis. $6000), seperti akun baru di firm: balance, Total P/L, target, dan drawdown dihitung dari trade setelah titik pindah itu. Saat jadi Funded, cycle payout juga mulai dari starting balance. Trade sebelum pindah tetap ada di Trades dan statistik. Phase tidak turun lagi kalau trade diubah kemudian.

**Broker.** Pilih broker (Exness, HFM, XM, Valetax, Vantage), isi nama, deposit, dan status. Tidak ada aturan, target, atau drawdown.

**Exchange.** Sama dengan broker, pilihannya Binance, Bitget, Pluang, TokoCrypto.

Klik kanan akun broker atau exchange: Edit Account, Set as Active, Add Deposit, History, Delete Account. Add Deposit menambah saldo awal. History menampilkan semua deposit dan semua payout (payout diambil dari halaman Payout) berurutan dari yang terbaru. Mengubah deposit awal di form edit ikut menggeser saldo.

## Trade

Di form trade, field yang dihitung otomatis:

- **Risk amount** = `|entry - SL| x size x point value`
- **Risk % (auto)**: persen dari starting balance akun yang hilang kalau stop loss kena, ditampilkan negatif. Tidak diinput dan tidak ada risk calculator.
- **P/L** = `(exit - entry) x size x point value` (dibalik untuk short)
- **R:R** dari jarak entry, SL, dan TP
- **Execution quality** (1-10), dihitung saat trade disimpan
- **Grade**, otomatis juga, tapi bisa kamu timpa manual

**Position size** diisi manual. Trade baru otomatis memakai size trade sebelumnya (trade terakhir di akun aktif, atau trade terakhir mana pun kalau akun itu belum punya trade). Kalau belum ada trade, defaultnya 1.

**Instrument**: urutan awal mengikuti daftar bawaan. Setiap kali sebuah pair dipakai di trade, pair itu naik ke posisi atas dropdown; pair yang belum pernah dipakai tetap di bawah dengan urutan awal.

### Instrument dan point value

Daftar bawaan: NQ, ES, YM, EURUSD, GBPUSD, USDJPY, GBPJPY, XAUUSD, BTCUSD, ETHUSD. Point value (dolar per 1 poin per kontrak/lot) ada di `js/utils/calc.js` (`POINT_VALUES`). Instrumen yang tidak ada di tabel dianggap 1. Trade yang sudah tersimpan membawa P/L lama, jadi angkanya baru ikut rumus terbaru setelah trade itu dibuka dan disimpan lagi.

| Instrumen | Per poin |
|---|---|
| NQ | $100 per lot (0.1 lot = $10 per poin) |
| MNQ | $1 |
| ES / MES | $50 / $5 |
| YM / MYM | $5 / $0.5 |
| Pair forex mayor | $10 |
| XAUUSD | $100 |
| BTCUSD / ETHUSD | $1 |

BTCUSD dan ETHUSD dipakai untuk perhitungan futures. Untuk crypto spot, tambahkan sendiri di Settings > Trading Concepts > Spot Crypto Pairs: ketik simbol (mis. `SOL`), tersimpan sebagai `SOL.S`. Pair spot memakai point value 1, jadi size diisi jumlah koin dan P/L = selisih harga x jumlah koin.

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

## Dashboard dan Archive

- Equity curve menampilkan bulan kalender berjalan, mulai dari balance di awal bulan. Garis putus-putus menandai balance awal bulan. Selain trade, kurva ikut berubah saat ada payout (turun sebesar yang ditarik), deposit tambahan di akun broker/exchange (naik), dan pindah phase (kembali ke starting balance).
- P/L harian menampilkan 7 hari kalender terakhir. Tidak ada yang disimpan, hari yang lewat dari 7 hari hilang dari grafik.
- Analytics > Archive menampilkan equity curve, jumlah trade, win rate, dan P/L untuk setiap bulan sebelumnya yang punya trade. Datanya dihitung dari trade yang ada, tidak ada tabel terpisah.

Drawdown yang tampil adalah drawdown **saat ini**: jarak balance ke puncaknya (puncak minimal sama dengan starting balance). Ini penyederhanaan, bukan model trailing intraday atau EOD milik firm.

## Payout

Pilih akun di halaman Payout.

**Akun prop firm**, per cycle:

1. Cycle profit = balance sekarang dikurangi balance awal cycle.
2. Buffer (default $40, diatur per akun di Settings > Payout) ditinggal di akun.
3. Nominal yang ditarik dari akun bisa diatur. Kosong berarti maksimum (cycle profit dikurangi buffer). Kalkulator menghitung ulang split dan balance setelah payout dari nominal itu.
4. Yang masuk kantong = nominal ditarik x profit split.

Syarat payout:

- **On Demand**: cycle profit minimal 2% dari balance awal cycle, dan kalau model punya consistency rule, hari profit terbaik tidak boleh melebihi batasnya (mis. 40%) dari cycle profit.
- **14 Day**: cycle profit harus positif.

Setelah payout: balance akun berkurang sebesar yang ditarik, cycle dimulai lagi dari 0, dan payout masuk ke tab History.

**Menghapus payout**: klik kanan baris di History, Delete payout. Balance, total payout, dan cycle dikembalikan seperti sebelum payout itu (termasuk buffer dan profit split). Kalau yang dihapus bukan payout terakhir, cycle yang sedang berjalan dibiarkan dan hanya balance yang dikembalikan.

**Akun broker dan exchange**: isi jumlah, klik Payout. Tidak ada buffer atau syarat. Balance berkurang sebesar jumlah itu, dan payout bisa dihapus dengan cara yang sama.

## Discord

Settings > Discord Webhook. Tempel URL webhook, URL tersimpan saat kolom ditinggalkan.

Yang dikirim:

- setiap trade berstatus Closed yang disimpan
- jurnal harian dan review mingguan yang disimpan
- setiap payout (nama akun, tanggal, jam, jumlah, sisa balance)
- ringkasan mingguan (hari Sabtu) dan bulanan (tanggal 1): jumlah trade, win rate, rata-rata R:R, kualitas eksekusi, total P/L, perubahan balance

Karena tidak ada server, ringkasan mingguan dan bulanan **dikirim saat aplikasi dibuka pada hari itu**, bukan tepat jam 00:00. Penanda "sudah dikirim" disimpan di localStorage browser, jadi kalau dibuka dari browser atau perangkat lain di hari yang sama, ringkasannya bisa terkirim lagi.

## Data

- Semua data ada di tabel `user_records` (JSONB) di Supabase, dipisahkan per user lewat RLS. Screenshot dan foto profil ada di Storage privat.
- Pengaturan (termasuk buffer per akun dan daftar pair spot) tersimpan otomatis.
- Tidak ada menu ekspor atau impor. Backup dilakukan dari sisi Supabase.
- Webhook Discord ikut tersimpan di database sebagai bagian dari settings.

## Menambah atau mengubah model prop firm

Edit `js/data/propFirmData.js`. Satu model:

```js
'Nama Model': {
  type: 'cfd',
  phases: 2,
  drawdownType: 'static',
  rewardShare: 90,
  consistencyRule: null,
  sizes: {
    25000: { dailyLoss: 1250, maxLoss: 2000, phase1Target: 2500, phase2Target: 1250 },
  },
},
```

`type` berisi `cfd` atau `futures`. `phases` berisi 0 untuk instant, 1, atau 2. `drawdownType` berisi `static`, `trailing`, atau `eod_trailing`. `consistencyRule` berisi angka persen atau `null`. Model satu phase memakai `profitTarget` sebagai pengganti `phase1Target`. Daftarkan objek modelnya di `PROP_FIRMS`. Daftar broker dan exchange ada di `BROKERS` dan `EXCHANGES` di file yang sama.

Data FundedNext di file itu berasal dari halaman resmi FundedNext. Isian E8 Markets dan TopStep belum diverifikasi ke sumbernya. Cocokkan dulu sebelum dipakai.

## Struktur file

```
index.html
favicon.png, logo.png
css/style.css
supabase/schema.sql
SUPABASE-SETUP.md, INTEGRATION-NOTES.md
js/
  app.js                        root, routing halaman, tombol tambah
  lib/        supabase-config.js, supabase-client.js, auth.js, db.js, state.js, discord.js
  utils/      calc.js           semua rumus
  data/       constants.js, propFirmData.js, sampleData.js
  components/
    shared/     ui.js, sidebar.js, profile.js
    dashboard/  dashboard.js
    trades/     trades.js, tradeForm.js
    accounts/   accounts.js, accountForm.js, payoutPage.js
    mistakes/   pages.js        mistakes, playbook, reviews, journal, settings
    settings/   discordSettings.js
```

Urutan `<script>` di `index.html` penting, karena tidak ada bundler. File yang dipakai file lain harus dimuat lebih dulu. Semua deklarasi level atas memakai `var` supaya tidak bentrok antar file, dan `h` adalah `React.createElement` yang dideklarasikan sekali di `db.js`. Kode tidak memakai komentar.

## Keterbatasan

- Ringkasan Discord terjadwal bergantung pada aplikasi dibuka (lihat di atas).
- Drawdown disederhanakan, payout mengikuti rumus di atas, bukan perhitungan resmi firm.
- Email tidak bisa diubah dari aplikasi.
- Setelah daftar dengan email baru, Supabase tetap meminta verifikasi email kalau Confirm email aktif.
- Statistik di bagian Performance, Averages, dan Streaks di Dashboard mencakup semua trade akun, tidak dibatasi per phase.
