---
name: PUC Kalkulator
description: Kalkulator imbalan pasca kerja (SAK EP / PSAK 24) untuk junior auditor KAP
colors:
  primary-navy: "#1B2A4A"
  primary-hover: "#2E4578"
  secondary-blue: "#2563EB"
  secondary-hover: "#1D4ED8"
  authority-gold: "#D4A843"
  surface: "#F8FAFC"
  ink: "#0F172A"
  muted: "#64748B"
  border-neutral: "#E2E8F0"
  success: "#15803D"
  warning: "#B45309"
  danger: "#DC2626"
  info: "#1D4ED8"
typography:
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.secondary-blue}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.secondary-hover}"
  button-secondary:
    backgroundColor: "{colors.primary-navy}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  button-outline:
    backgroundColor: "#FFFFFF"
    textColor: "#374151"
    rounded: "{rounded.md}"
    padding: "10px 16px"
  card:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "#FFFFFF"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: PUC Kalkulator

## 1. Overview

**Creative North Star: "Kertas Kerja Digital" (The Digital Workpaper)**

PUC Kalkulator terasa seperti kertas kerja audit yang dipindahkan ke layar: rapi, bisa ditelusuri, dan siap dilampirkan ke dokumentasi resmi tanpa perlu "dipoles" lagi. Setiap keputusan visual melayani satu pertanyaan — apakah junior auditor bisa memindai angka ini dengan cepat, dan mempertanggungjawabkannya ke reviewer? Navy gelap (#1B2A4A) membingkai aplikasi sebagai institusi tepercaya, biru sekunder menandai aksi utama, dan emas dipakai sangat langka — hanya sebagai tanda otoritas (logo, ikon kunci), bukan dekorasi.

Sistem ini secara sadar menolak nuansa SaaS generik: tidak ada gradient text, tidak ada kartu metrik seragam yang dijejer tanpa hierarki, tidak ada eyebrow kapital kecil di atas tiap section, tidak ada ilustrasi playful. Ini alat kerja profesional untuk audit keuangan Indonesia — kepercayaan dibangun dari presisi tabel dan konsistensi format angka, bukan dari elemen visual yang mencolok.

**Key Characteristics:**
- Navy institusional sebagai warna dominan chrome (header), bukan warna dasar layar kerja
- Latar kerja abu-terang netral (`#F8FAFC`) agar tabel dan angka putih/kartu punya kontras maksimal
- Emas dipakai di bawah 5% dari permukaan layar — murni sebagai penanda otoritas
- Tipografi satu keluarga (Inter → system-ui), dibedakan lewat berat dan ukuran, bukan lewat font kedua
- Shadow tipis dan seragam (`shadow-sm`), bukan efek "mengambang"

## 2. Colors

Palet formal-korporat: satu navy institusional, satu biru aksi, satu emas otoritas langka, dan skala netral abu-slate untuk teks/border/permukaan.

### Primary
- **Navy Institusional** (`#1B2A4A`): warna chrome utama — header, footer, tombol sekunder, elemen yang menegaskan "ini institusi resmi". Dipakai luas di header/nav, tapi jarang di badan konten.

### Secondary
- **Biru Aksi** (`#2563EB`): warna aksi utama — tombol primer, link, ring fokus, item navigasi aktif. Ini warna yang memandu mata pengguna ke "apa yang harus diklik selanjutnya".

### Tertiary
- **Emas Otoritas** (`#D4A843`): dipakai sangat terbatas — logo, ikon kunci di modal login, aksen kecil yang menandai "ini penting/resmi". Tidak pernah dipakai sebagai warna latar besar.

### Neutral
- **Kertas** (`#F8FAFC`): latar belakang utama seluruh aplikasi (body). Netral, tidak hangat — menjaga fokus pada konten, bukan pada suasana.
- **Tinta** (`#0F172A`): warna teks judul/isi utama di atas latar terang.
- **Abu Redup** (`#64748B`): teks sekunder, helper text, label deskriptif.
- **Garis Netral** (`#E2E8F0` / `border-gray-200`): border kartu, separator, garis tabel.
- **Putih** (`#FFFFFF`): permukaan kartu, input, dan area konten yang perlu menonjol dari latar `#F8FAFC`.

### Status
- **Sukses** (`green-600/700`), **Peringatan** (`amber-600/700`), **Bahaya** (`red-600/700`), **Info** (`blue-600/700`) — dipakai konsisten untuk Badge dan Alert, selalu dengan pasangan latar `-50` dan teks `-700/800` agar kontras tetap aman di atas latar terang.

### Named Rules
**The Rare Gold Rule.** Emas otoritas (`#D4A843`) tidak pernah menutupi lebih dari elemen kecil (ikon, logo, garis aksen tipis). Begitu emas dipakai sebagai latar blok besar, kesan "resmi" berubah jadi "dekoratif" — dan itu bertentangan dengan tujuan sistem ini.

## 3. Typography

**Body & Display Font:** Inter (dengan fallback `system-ui, sans-serif`)
**Label/Mono Font:** tidak ada keluarga mono terpisah — angka dan formula memakai `font-mono` bawaan Tailwind (`ui-monospace`) hanya saat butuh alignment desimal ketat (tabel PSG/UPMK, print).

**Character:** Satu keluarga sans yang netral dan sangat terbaca, dibedakan lewat berat (400/500/600/700) dan ukuran — bukan lewat kepribadian font yang mencolok. Ini sengaja: tipografi tidak boleh "berbicara lebih keras" dari angka yang ditampilkannya.

> **Catatan implementasi:** `tailwind.config.ts` mendeklarasikan `fontFamily.sans` sebagai `Inter, system-ui, sans-serif`, tapi Inter tidak dimuat lewat `next/font` atau `<link>` Google Fonts di manapun dalam `src/`. Browser jatuh ke `system-ui`. Ini bukan pilihan desain yang disengaja — catat sebagai temuan audit (font token diklaim tapi tidak benar-benar dimuat).

### Hierarchy
- **Headline** (700, `1.5rem`/24px, line-height 1.25): judul halaman/section utama (mis. "Ringkasan Hasil").
- **Title** (600, `1.125rem`/18px, line-height 1.3): judul card (`CardTitle`), sub-section.
- **Body** (400, `0.875rem`/14px, line-height 1.5): teks isi, label form, isi tabel. Mayoritas UI ada di ukuran ini.
- **Label** (500, `0.75rem`/12px): helper text, caption tabel, badge, teks status.

### Named Rules
**The One-Family Rule.** Tidak ada font kedua untuk "aksen" atau "display". Hierarki dibangun murni dari berat dan ukuran dalam satu keluarga Inter/system-ui — konsisten dengan nada formal-korporat yang tidak butuh tipografi ekspresif.

## 4. Elevation

Datar dengan aksen minimal. Kartu (`Card`) naik dari latar `#F8FAFC` hanya lewat `shadow-sm` (`0 1px 2px rgba(0,0,0,0.05)`) dan background putih — bukan lewat shadow besar yang "mengambang". Modal (mis. dialog login) memakai `shadow-2xl` sebagai satu-satunya pengecualian, karena harus terasa jelas terpisah dari konten di baliknya yang tertutup overlay gelap.

### Shadow Vocabulary
- **Ambient card** (`shadow-sm`): default untuk `Card`, tombol primer/sekunder/destructive saat idle.
- **Modal/overlay** (`shadow-2xl`): dialog yang muncul di atas backdrop gelap (mis. modal "Login Diperlukan").
- **Header sticky** (`shadow-lg`): header yang sticky di atas konten yang bisa di-scroll — butuh sedikit lebih tegas karena selalu di depan.

### Named Rules
**The Print-Safe Rule.** Semua shadow (`box-shadow`, `shadow-sm`, dst.) di-nolkan lewat `@media print` — kertas kerja yang dicetak tidak boleh membawa efek layar yang tidak relevan di atas kertas.

## 5. Components

### Buttons
- **Shape:** sudut membulat halus, `rounded-md` (8px).
- **Primary:** latar Biru Aksi (`#2563EB`), teks putih, `shadow-sm`, padding `10px 16px` (size md). Hover → `#1D4ED8`, active lebih gelap lagi.
- **Secondary:** latar Navy Institusional (`#1B2A4A`), teks putih — dipakai saat ada dua aksi berdampingan dan salah satunya harus terasa "institusional" bukan "aksi utama".
- **Outline:** border abu (`border-gray-300`), latar putih, teks abu-gelap — aksi sekunder/netral (mis. "Tutup").
- **Ghost:** tanpa border/latar saat idle, hover `bg-gray-100` — aksi tersier (mis. ikon di toolbar).
- **Destructive:** merah (`red-600` → `red-700` hover) — hanya untuk aksi yang menghapus/membatalkan data secara permanen.
- **Focus:** ring biru 2px dengan offset 2px (`focus-visible:ring-secondary`) di semua varian — wajib untuk navigasi keyboard.
- **Loading:** spinner inline (`border-2 border-current border-t-transparent`, animasi spin) menggantikan/mendahului label, tombol otomatis disabled.

### Badge
- **Style:** pill penuh (`rounded-full`), border 1px, latar `-50` + teks `-700` per varian status (default/success/warning/info/purple/muted). Ukuran teks `text-xs`, padding `2px 8px`.

### Alert
- **Style:** `rounded-lg`, border 1px, latar `-50` + teks `-800` per varian (info/warning/error/success), ikon simbol di kiri (`ℹ ⚠ ✕ ✓`). Dipakai untuk pesan status di dalam alur kerja (bukan toast sementara).

### Cards / Containers
- **Corner Style:** `rounded-lg` (12px).
- **Background:** putih solid di atas latar `#F8FAFC` — kontras inilah yang memberi struktur halaman, bukan border tebal.
- **Shadow Strategy:** lihat Elevation — `shadow-sm` saja.
- **Border:** `border border-gray-200` tipis, melengkapi shadow (bukan menggantikannya).
- **Internal Padding:** header/content/footer masing-masing `p-5` (20px), konsisten di semua card.

### Inputs / Fields
- **Style:** `rounded-md`, border `gray-300`, latar putih, tinggi `h-10` (40px), teks `text-sm`.
- **Focus:** border berubah ke Biru Aksi + ring 2px biru (`focus:ring-secondary focus:border-secondary`) — tanpa glow/shadow tambahan.
- **Error:** border merah + ring merah, pesan error `text-xs text-red-600` di bawah field.
- **Disabled:** opacity 50%, latar `bg-gray-50`, cursor not-allowed.
- **Label wajib:** tanda `*` merah menyertai label saat `required`.

### Navigation
- **Style:** header navy solid, sticky di atas (`sticky top-0 z-50`), item aktif ditandai latar Biru Aksi penuh (bukan underline) — kontras tegas antara "sedang di halaman ini" vs "belum". Item non-aktif teks `primary-200` (navy muda), hover ke putih penuh + `bg-primary-600`. Mobile: menu hamburger yang membuka panel dropdown navy-800 penuh lebar, item disusun vertikal.

## 6. Do's and Don'ts

### Do:
- **Do** jaga navy (`#1B2A4A`) sebagai warna chrome (header/footer), bukan warna latar konten — konten selalu di atas `#F8FAFC`/putih untuk keterbacaan angka.
- **Do** pakai emas (`#D4A843`) hanya untuk elemen kecil bermakna "otoritas/resmi" (logo, ikon kunci) — lihat The Rare Gold Rule.
- **Do** pertahankan satu keluarga font (Inter/system-ui), bedakan hierarki lewat berat dan ukuran saja.
- **Do** gunakan `shadow-sm` konsisten untuk semua card — jangan sesekali memakai shadow besar hanya karena "terlihat lebih premium".
- **Do** sertakan `focus-visible:ring-2 ring-secondary` pada semua elemen interaktif baru — ini alat kerja yang harus bisa dinavigasi keyboard.
- **Do** pertahankan format angka Indonesia yang konsisten (titik ribuan) di semua tampilan hasil perhitungan dan ekspor.

### Don't:
- **Don't** memakai gradient text atau `background-clip: text` di manapun — bertentangan langsung dengan nada formal-korporat.
- **Don't** membuat grid kartu metrik seragam (angka besar + label kecil, diulang identik) sebagai template default untuk menyajikan hasil — hasil PUC harus tampil sebagai tabel/breakdown yang bisa ditelusuri, bukan "hero metric" ala dashboard SaaS.
- **Don't** menambahkan eyebrow kapital kecil bertracking lebar di atas tiap section (mis. "HASIL" · "RINGKASAN" · "DETAIL") — ini scaffolding AI generik yang tidak ada presedennya di sistem ini.
- **Don't** memakai border-left/right berwarna tebal sebagai aksen dekoratif pada card atau alert — gunakan latar tint penuh (seperti pada `Alert`/`Badge`) atau ikon, bukan garis samping.
- **Don't** membiarkan token font (`fontFamily.sans: Inter`) dideklarasikan tanpa benar-benar memuat font-nya — jika Inter tetap jadi pilihan, muat lewat `next/font/google` agar tidak diam-diam jatuh ke `system-ui`.
- **Don't** memakai warna hangat/cream sebagai latar utama "karena terasa lebih ramah" — latar netral dingin (`#F8FAFC`) adalah bagian dari nada formal-korporat, bukan kebetulan.
