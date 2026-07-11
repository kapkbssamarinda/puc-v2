# Log Perkembangan Proyek: PUC Kalkulator (Imbalan Pasca Kerja)
**Tanggal**: 8 Juli 2026

## Ringkasan Perbaikan & Penyesuaian

### 1. Perbaikan Error ESLint (`@typescript-eslint/no-unused-vars`)
- **Masalah:** Proses *build* proyek sebelumnya gagal karena adanya *warning* dari ESLint terkait variabel `_hp` (variabel penampung password yang di-*destructure* namun tidak digunakan).
- **Tindakan:** Menghapus sintaks *destructuring* tersebut secara aman pada halaman `page.tsx` serta _API routes_ terkait (`route.ts` dan `[id]/route.ts`).
- **Hasil:** Kode kembali *clean* dan lolos _linter_ tanpa mengorbankan keamanan data *password*.

### 2. Seeding User Default ke Database
- **Masalah:** Aplikasi membutuhkan _database_ user awal agar bisa melakukan *login* ke *admin panel*.
- **Tindakan:** Mengatur konfigurasi `.env` ke kredensial Upstash Redis dan menjalankan _script_ `npm run seed`. 
- **Hasil:** User `admin@kap.co.id` dan `auditor1@kap.co.id` berhasil dideteksi dan didaftarkan di Upstash Redis sehingga siap digunakan untuk login.

### 3. Perbaikan Bug "Server-Side Exception" Bagian 1 (Serialization)
- **Masalah:** Muncul `Application error: a server-side exception has occurred` saat mengunjungi halaman manajemen user. Error ini disebabkan oleh React Server Components (RSC) Next.js yang menolak mengirimkan _object_ berisi *key* dengan nilai `undefined` secara eksplisit sebagai *props* ke Client Component.
- **Tindakan:** Mengubah metode penyalinan properti objek. Alih-alih mendefinisikan seluruh variabel secara eksplisit, *object* disalin menyeluruh (`{ ...user }`), lalu dilakukan `delete u.hashedPassword`. 
- **Hasil:** Menjaga absennya suatu properti (seperti `expiresAt` yang kosong) tanpa menciptakan nilai eksplisit `undefined`.

### 4. Perbaikan Bug "Server-Side Exception" Bagian 2 (Redis Data Integrity)
- **Masalah:** Muncul kembali "Application error" (Digest: 1964773995) saat membuka *admin panel* di URL _production_ Vercel. Penyebabnya ditelusuri dari fungsi *fetching* data Redis yang mengambil *semua* _keys_ dengan awalan `user:*`. 
- **Akar Masalah:** Redis ternyata tidak hanya berisi objek data pengguna, melainkan terdapat sisa *string* acak (*session/CSRF token* dari NextAuth) yang juga menggunakan awalan `user:*`. Sistem gagal (`crash`) saat mencoba menjalankan instruksi `sort` berdasarkan *property* `name` pada variabel _string_ kosong.
- **Tindakan:** Melakukan filtrasi *strict* pada data yang dikembalikan Redis (`u !== null && typeof u === "object" && "name" in u`), memastikan hanya *object user* valid yang diproses.
- **Hasil:** Aplikasi dapat mengatasi data "kotor" pada database tanpa menyebabkan kegagalan sistem. 

### 5. Peningkatan UI/UX: Konfirmasi Logout (SweetAlert2)
- **Kebutuhan:** Pengguna menginginkan adanya pop-up konfirmasi yang elegan saat menekan tombol "Keluar", serta langsung diarahkan ke halaman login setelahnya.
- **Tindakan:** Menginstal _library_ `sweetalert2`, mengganti fungsi `window.confirm` bawaan *browser* dengan modal animasi interaktif (dilengkapi penyesuaian warna desain), dan mengubah target rute (callback URL) *logout* dari halaman utama (`/`) ke halaman login (`/login`).
- **Hasil:** Proses *logout* menjadi lebih aman dari risiko klik tidak sengaja, antarmuka terlihat jauh lebih profesional, dan alur aplikasi menjadi lebih tepat sasaran.

### Status Terkini
- Seluruh perbaikan dan penambahan fitur (termasuk SweetAlert2) telah berhasil diuji (*linted*).
- Kode terbaru telah di-*commit* (`"Use sweetalert2 for logout confirmation"`) dan ter-*push* otomatis ke GitHub.
- **Vercel Deployment:** Stabil dan selalu sinkron dengan status GitHub terakhir.

---

## Tanggal: 11 Juli 2026

## Ringkasan Perbaikan & Penyesuaian

### 1. Audit Kualitas UI & Perbaikan Aksesibilitas/Performa
- **Masalah:** Audit teknis menyeluruh (aksesibilitas, performa, *theming*, responsif, *anti-pattern*) menemukan 25 isu, termasuk beberapa yang cukup serius: komponen `InfoTooltip` (tombol "?" penjelas istilah) sama sekali tidak bisa diakses lewat *keyboard* di seluruh aplikasi, modal (konfirmasi login & manajemen user admin) tanpa *focus-trap*/Escape/semantik dialog, baris tabel hasil Batch yang bisa diklik tapi tidak bisa dijangkau *keyboard*, serta kontras teks `text-gray-400` yang gagal standar WCAG AA di banyak tempat.
- **Tindakan:** Menambahkan dukungan *keyboard* & ARIA penuh (`aria-expanded`, `aria-label`, *focus-trap* via hook baru `useFocusTrap`) pada semua elemen interaktif kustom, menaikkan kontras teks ke level yang lolos WCAG AA, membungkus perhitungan *batch* CSV besar dengan *chunking* agar tidak membekukan UI, memperbaiki *re-render* berlebihan pada form (`AssumptionsForm`/`EmployeeForm`), menyatukan warna *hardcode* (overlay modal, chart perbandingan metode) ke *design token* yang konsisten, dan menghapus pola *anti-pattern* visual (*border-stripe* dekoratif, grid statistik tanpa hierarki).
- **Hasil:** Skor audit naik dari 10/20 menjadi 19/20. Ditemukan & diperbaiki juga satu regresi serius yang sempat masuk di tengah proses (`EmployeeForm` memicu *infinite render loop* karena `watch()` dipakai langsung sebagai *dependency effect*) sebelum sempat ter-*deploy*.

### 2. Penyatuan Riwayat Git & Deploy ke GitHub
- **Masalah:** *Branch* lokal dan `origin/main` sudah bercabang (1 vs 6 *commit* berbeda) akibat `git pull` sebelumnya yang berhenti di tengah jalan dengan *merge conflict* belum terselesaikan di 4 berkas (`PRODUCT.md`, `package-lock.json`, `src/app/page.tsx`, `src/components/layout/Header.tsx`).
- **Tindakan:** Menyelesaikan seluruh konflik secara manual per berkas (mempertahankan kombinasi terbaik dari kedua sisi, termasuk fitur *dark mode* & SweetAlert2 dari rekan tim), meregenerasi `package-lock.json` via `npm install` alih-alih mengedit manual, lalu memverifikasi *build* production sebelum menyelesaikan *merge commit* dan melakukan `git push` ke `origin/main`.
- **Hasil:** *Branch* tersinkron kembali dengan GitHub, *build* production 100% bersih (perubahan dari rekan tim ternyata juga memperbaiki 3 *error lint* `_hp` yang sebelumnya tercatat di audit), dan Vercel otomatis men-*deploy* versi gabungan terbaru.

### 3. Pengetatan Durasi Sesi Login (Batas 8 Jam + Auto-Logout Idle)
- **Masalah:** Durasi sesi login tidak pernah dikonfigurasi secara eksplisit, sehingga memakai *default* Auth.js selama 30 hari — sekali *login*, pengguna praktis tidak perlu *login* ulang selama aplikasi dibuka minimal sekali per ~30 hari, tanpa ada *auto-logout* karena tidak aktif (*idle*). Investigasi juga menemukan bug nyata: fitur "paksa-*logout* pengguna sementara yang dibuat admin begitu masa berlakunya (`expiresAt`) habis" tidak pernah berfungsi, karena `authorize()` di `src/auth.ts` tidak pernah meneruskan field `expiresAt` dari Redis ke *token* sesi.
- **Tindakan:**
  - Memperbaiki `src/auth.ts` agar `expiresAt` diteruskan dengan benar (sekaligus menghapus duplikasi tipe `RedisUser` yang jadi penyebab bug).
  - Menambahkan batas sesi absolut 8 jam (1 *shift* kerja) di `src/auth.config.ts` lewat *timestamp* `loginAt` yang ditegakkan manual di *callback* `jwt()` — diverifikasi langsung dari *source code* `@auth/core` bahwa `session.maxAge` saja hanya memberi *sliding window*, bukan batas absolut sejak *login*.
  - Menambahkan hook baru `src/lib/useIdleLogout.ts`: *auto-logout* otomatis setelah 30 menit tanpa aktivitas, aman untuk banyak *tab* sekaligus (status aktivitas dibagi lewat `localStorage`, bukan *timer* per-*tab*), dan membersihkan *timestamp* aktivitas saat *logout* eksplisit agar tidak mewarisi sisa jam *idle* ke sesi *login* berikutnya di *browser* yang sama.
  - Menambahkan pesan khusus di halaman *login* saat sesi berakhir karena *idle*.
- **Hasil:** Sesi *login* kini dibatasi tegas 8 jam sejak *login* (atau lebih cepat jika *idle* 30 menit / akun sementara kedaluwarsa), dengan penegakan *server-side* yang benar-benar berjalan, bukan sekadar mencegah *login* baru.

### Status Terkini
- Perubahan audit UI, *merge* GitHub, dan pengetatan sesi *login* telah lolos `tsc --noEmit`, `vitest run` (49/49 *test*), dan `next build` (bersih, tanpa *error lint*).
- Perubahan audit UI & *merge* Git sudah ter-*commit* dan ter-*push* ke GitHub (`origin/main`), otomatis ter-*deploy* via Vercel.
- Perubahan pengetatan sesi *login* (8 jam + *idle logout*) sudah selesai diimplementasikan dan lolos verifikasi otomatis, namun **belum diuji manual end-to-end** dengan kredensial Redis asli (lingkungan pengembangan saat ini memakai kredensial Upstash *placeholder*) — perlu diuji dan dikonfirmasi sebelum di-*commit* & di-*push*.
