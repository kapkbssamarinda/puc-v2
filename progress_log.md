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

### Status Terkini
- Seluruh perbaikan telah di-*commit* (termasuk *commit* dari pihak pengguna: `"perbarui .gitignore..."` serta perbaikan akhir `"Fix server-side crash..."`).
- Repositori GitHub utama (`main`) sudah mutakhir (*up-to-date*).
- **Vercel Deployment:** Otomatis berhasil (*Auto-deployed* berdasarkan _push_ terakhir ke GitHub). Sistem saat ini sudah stabil.
