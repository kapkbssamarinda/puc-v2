# Product

## Register

product

## Users

Junior auditor di Kantor Akuntan Publik (KAP) yang perlu memverifikasi perhitungan liabilitas imbalan pasca kerja milik klien secara cepat dan terstandar, sesuai SAK EP / PSAK 24. Konteks pemakaian: di tengah pekerjaan lapangan audit, sering di bawah tekanan waktu, perlu hasil yang bisa langsung dijadikan workpaper (Excel/PDF) dan draft CALK. Pengguna paham istilah akuntansi/aktuaria (PUC, NKKIP, PSG, UPMK) tapi bukan aktuaris — aplikasi harus tetap dipahami tanpa keahlian aktuaria mendalam.

## Product Purpose

Kalkulator web untuk menghitung liabilitas imbalan pasca kerja dengan metode Projected Unit Credit (PUC), mendukung 4 metode (Liquidation → PUC Sederhana → PUC + Ekonomi → PUC Komprehensif) dan 3 mode input (per karyawan, batch CSV, estimasi rata-rata). Sukses berarti: auditor bisa memverifikasi angka klien dalam hitungan menit, dengan output yang defensible (langkah perhitungan transparan, referensi ke SAK EP/DSAK IAI) dan siap dilampirkan sebagai workpaper.

## Brand Personality

Formal & korporat — serius, otoritatif, presisi. Mengikuti konvensi visual firma akuntansi: navy sebagai warna dominan, tipografi rapi, tabel dan angka yang mudah dipindai, minim dekorasi yang tidak fungsional. Nada bahasa: profesional, langsung, tidak mencoba "menghibur" — audit adalah pekerjaan serius dan aplikasi harus terasa bisa dipercaya sebagai alat kerja, bukan produk konsumen.

## Anti-references

Hindari kesan generik "dibuat AI" / SaaS cliché: gradient text, kartu-kartu identik berukuran sama, eyebrow kecil huruf kapital di atas tiap section, badge metrik besar dengan label kecil. Hindari juga nuansa playful/consumer-app (warna cerah berlebihan, ilustrasi kartun, copy yang terlalu santai) — ini alat kerja profesional untuk audit keuangan Indonesia, bukan aplikasi konsumen.

## Design Principles

- **Angka adalah konten utama** — tabel, hasil perhitungan, dan breakdown langkah harus jadi pusat perhatian visual, bukan ornamen di sekitarnya.
- **Transparansi perhitungan** — setiap hasil harus bisa ditelusuri ke rumus/asumsi yang dipakai (CalculationSteps, FSNote), karena auditor perlu mempertanggungjawabkan angka ke reviewer.
- **Kepercayaan lewat presisi, bukan dekorasi** — kredibilitas dibangun dari kerapian tabel, konsistensi format angka, dan referensi ke dasar hukum/standar (SAK EP, DSAK IAI), bukan dari elemen visual yang mencolok.
- **Efisien di bawah tekanan waktu** — alur input (single/batch/estimasi) harus meminimalkan klik dan memberi validasi/error yang jelas, karena dipakai di tengah pekerjaan lapangan.
- **Siap ekspor, siap lampir** — hasil (Excel workpaper, PDF laporan, draft CALK) harus terasa seperti dokumen resmi yang layak dilampirkan ke kertas kerja audit.

## Accessibility & Inclusion

Target WCAG level AA: kontras teks memadai (terutama untuk tabel angka padat dan teks pada latar berwarna), dapat dinavigasi dengan keyboard, dan mendukung `prefers-reduced-motion`. Tidak ada kebutuhan aksesibilitas spesifik lain yang dinyatakan pengguna saat ini.
