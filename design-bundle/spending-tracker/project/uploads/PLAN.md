# Rencana Produk — Spending Tracker (Mei & Baskara)

## Context

Mei dan Baskara tinggal serumah dan berbagi banyak pengeluaran (makan, belanja, tagihan).
Saat ini tidak ada cara rapi untuk: (1) mencatat pengeluaran, (2) tahu siapa yang sudah
membayar, (3) tahu di akhir bulan siapa berutang ke siapa dan berapa, dan (4) melihat
ke mana uang pergi tiap bulan dan tiap tahun.

Dokumen ini adalah spesifikasi produk + data model untuk aplikasi pencatat pengeluaran
bersama. Tujuannya bisa langsung dipakai sebagai brief untuk membuat UI (Claude design)
dan sebagai acuan implementasi. Bahasa aplikasi: **Indonesia**. Gaya: **cute/friendly**.

## Keputusan yang Sudah Dikunci

| Aspek | Keputusan |
|-------|-----------|
| Platform & stack | Next.js (App Router) + TypeScript + Tailwind, PWA (installable di HP) |
| Backend & data | Supabase — Postgres + Auth email + Realtime + Row Level Security |
| Login | Akun email per orang (Mei & Baskara), data sync cloud realtime antar HP |
| Pengguna | Tepat 2 orang dalam satu "rumah tangga" |
| Mata uang | Rupiah (IDR), disimpan sebagai integer |

## Fitur Inti (semua dipilih)

1. **Catat pengeluaran + siapa yang bayar** — input cepat: jumlah, kategori, deskripsi, tanggal, pembayar.
2. **Split & settle up** — hitung otomatis saldo "siapa utang siapa" + tombol *Lunaskan*.
3. **Kategori & budget bulanan** — kategori dengan ikon/warna + target budget per bulan + peringatan saat hampir/ lewat budget.
4. **Laporan & grafik bulanan/tahunan** — dashboard tren pengeluaran, breakdown per kategori, dan perbandingan kontribusi Mei vs Baskara.
5. **Pengeluaran berulang (recurring)** — tagihan rutin (sewa, listrik, internet) otomatis tercatat tiap bulan.

## Arah Desain UI (cute & friendly)

- **Palet pastel** dengan satu warna aksen hangat. Tiap orang punya **warna identitas** (mis. Mei = pink pastel, Baskara = biru/mint pastel) yang dipakai konsisten di chart, avatar, dan badge pembayar.
- **Sudut sangat membulat** (cards, tombol, input), bayangan lembut, banyak ruang putih.
- **Microcopy ramah & santai** dalam Bahasa Indonesia (mis. "Yuk catat pengeluaran!", "Mei nalangin dulu nih").
- Opsional: **maskot kecil** (mis. kucing/celengan) untuk state kosong dan saat budget tercapai — memberi nuansa playful seperti app personality-first.
- Ikon kategori bulat berwarna, angka uang besar dan mudah dibaca, format `Rp1.250.000`.
- **Mobile-first** (dipakai dari HP), navigasi bawah (bottom tab): Beranda · Tambah · Laporan · Pengaturan.

## Struktur Halaman

| Halaman | Isi |
|---------|-----|
| **Beranda / Dashboard** | Ringkasan bulan ini: total pengeluaran, saldo "siapa utang siapa", progress budget per kategori, daftar transaksi terbaru. |
| **Tambah Pengeluaran** | Form cepat (jumlah, kategori, deskripsi, tanggal, pembayar, tipe split). Tombol (+) menonjol di bottom nav. |
| **Laporan** | Toggle Bulanan/Tahunan; grafik tren, donut per kategori, bar kontribusi Mei vs Baskara, filter periode. |
| **Settle Up** | Saldo net saat ini ("Baskara utang Rp150.000 ke Mei"), riwayat pelunasan, tombol *Lunaskan*. |
| **Pengaturan** | Kelola kategori & budget, kelola recurring, profil & warna, kelola akun. |

## Data Model (Postgres / Supabase)

> Uang = integer rupiah. Saldo TIDAK disimpan sebagai kolom mutable — selalu dihitung dari ledger (expenses + shares − settlements).

```
profiles
  id            uuid PK  -> references auth.users(id)
  household_id  uuid FK  -> households(id)
  name          text          -- "Mei" / "Baskara"
  color         text          -- warna identitas (hex)
  avatar_url    text null
  created_at    timestamptz

households
  id            uuid PK
  name          text
  created_at    timestamptz

categories
  id              uuid PK
  household_id    uuid FK
  name            text          -- "Makan", "Transport", ...
  icon            text          -- nama ikon
  color           text
  monthly_budget  integer null  -- target budget per bulan (rupiah), null = tanpa budget
  created_at      timestamptz

expenses
  id            uuid PK
  household_id  uuid FK
  payer_id      uuid FK -> profiles(id)   -- SIAPA YANG BAYAR
  category_id   uuid FK -> categories(id)
  amount        integer                    -- total transaksi (rupiah)
  description   text
  spent_at      date                       -- tanggal pengeluaran
  split_type    text  -- 'equal' | 'custom' | 'full' (full = ditanggung sendiri)
  recurring_id  uuid null FK -> recurring_expenses(id)  -- asal jika auto-generated
  created_at    timestamptz

expense_shares                              -- porsi tanggungan tiap orang
  id            uuid PK
  expense_id    uuid FK -> expenses(id) on delete cascade
  profile_id    uuid FK -> profiles(id)
  share_amount  integer                    -- berapa porsi orang ini (rupiah)
  -- invariant: SUM(share_amount) per expense = expenses.amount

settlements                                 -- catatan pelunasan
  id            uuid PK
  household_id  uuid FK
  from_id       uuid FK -> profiles(id)     -- yang membayar utang
  to_id         uuid FK -> profiles(id)     -- yang menerima
  amount        integer
  note          text null
  settled_at    date
  created_at    timestamptz

recurring_expenses                          -- template tagihan rutin
  id            uuid PK
  household_id  uuid FK
  payer_id      uuid FK -> profiles(id)
  category_id   uuid FK -> categories(id)
  amount        integer
  description   text
  split_type    text
  day_of_month  smallint                    -- tanggal generate tiap bulan (1-28)
  active        boolean default true
  created_at    timestamptz
```

## Logika Perhitungan Balance (inti aplikasi)

Untuk tiap `expense`:
- Pembayar (`payer_id`) menalangi `amount`.
- Tiap orang menanggung `share_amount` dari `expense_shares`.
- Kontribusi bersih orang X pada satu expense = `(amount jika X pembayar, else 0) − share_amount X`.

Saldo net antar 2 orang = jumlah kontribusi bersih semua expense − pengaruh settlements.

```
net(Mei)  = Σ (dibayar Mei)  − Σ (porsi Mei)  − Σ settlement (Mei->Baskara) + Σ settlement (Baskara->Mei)
```

- Jika `net(Mei) > 0` → Baskara berutang sebesar `net(Mei)` ke Mei.
- Karena hanya 2 orang, hasil akhirnya selalu **satu angka & satu arah** (tidak perlu algoritma graph/network-flow ala grup besar).

Tipe split:
- `equal` → `share_amount = amount / 2` (pembagian sisa pembulatan: kelebihan 1 rupiah ke pembayar agar SUM tetap = amount).
- `custom` → porsi diinput manual (validasi SUM = amount).
- `full` → `share_amount` penuh ke 1 orang (mis. pengeluaran pribadi salah satu).

> Logika ini harus punya unit test menyeluruh (TDD), termasuk kasus pembulatan ganjil.

## Laporan / Agregasi

- **Bulanan:** total per bulan, breakdown per kategori (donut), perbandingan dibayar Mei vs Baskara (bar), progress vs `monthly_budget` per kategori.
- **Tahunan:** tren 12 bulan (line/bar), total per kategori per tahun, total kontribusi tiap orang.
- Implementasi via **SQL view / Postgres RPC** untuk agregasi di server, bukan menarik semua baris ke client.
- Budget warning: hitung total expense kategori pada bulan berjalan, bandingkan ke `monthly_budget` (mis. badge kuning ≥80%, merah ≥100%).

## Keamanan (RLS)

- Setiap tabel terikat `household_id`; policy memastikan user hanya akses baris dari household-nya sendiri.
- Auth via Supabase email. Profil dibuat saat onboarding & dipetakan ke `auth.users`.
- Validasi input di boundary (jumlah > 0, SUM shares = amount, tanggal valid).

## Roadmap Implementasi (saran fase)

1. **Scaffold** — Next.js + TS + Tailwind + PWA manifest; setup Supabase project & env.
2. **Skema & migration** — buat tabel di atas + RLS policy + seed (household, Mei & Baskara, kategori awal).
3. **Auth & onboarding** — login email, buat/join household, set warna identitas.
4. **CRUD pengeluaran** — form tambah + daftar transaksi + edit/hapus (engine split + shares).
5. **Settle up** — perhitungan balance + halaman saldo + tombol Lunaskan + riwayat.
6. **Kategori & budget** — kelola kategori + budget bulanan + indikator progress.
7. **Laporan** — view/RPC agregasi + grafik bulanan & tahunan.
8. **Recurring** — template + job generate bulanan (cron Supabase / edge function).
9. **Polish UI** — pastel theme, maskot, microcopy, empty states; PWA install + offline dasar.

## Verifikasi (end-to-end)

- Unit test engine split & balance (termasuk pembulatan ganjil) — `npm run test`.
- Integration test query/RPC laporan terhadap data seed.
- Manual: input beberapa expense dgn pembayar berbeda → cek halaman Settle Up menampilkan net yang benar → lakukan *Lunaskan* → saldo kembali nol.
- Cek RLS: user lain tidak bisa membaca data household ini.
- Cek PWA: bisa di-install di HP, tampilan mobile rapi, realtime sync antar 2 device.
