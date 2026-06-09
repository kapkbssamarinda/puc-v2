// ============================================================
// TIPE DATA ENGINE PUC — Domain Types
// Referensi: PSAK 24, DSAK IAI Siaran Pers April 2022, PP 35/2021
// ============================================================

// ─── Metode Perhitungan ────────────────────────────────────────────────────────
export type MetodePerhitungan =
  | 'LIQUIDATION'   // Pesangon saat ini — gaji & MK sekarang, tanpa proyeksi
  | 'PUC_SIMPLE'    // PUC tanpa asumsi ekonomi (Contoh 3 DSAK IAI 2022)
  | 'PUC_ECONOMIC'  // PUC + diskonto + kenaikan gaji (Contoh 4 DSAK IAI 2022)
  | 'PUC_FULL'      // PUC komprehensif: ekonomi + demografi (Contoh 5, standar audit)

// ─── Jenis Peristiwa Keluar ───────────────────────────────────────────────────
export type JenisKeluar =
  | 'PENSIUN'
  | 'MENINGGAL'
  | 'CACAT'
  | 'MENGUNDURKAN_DIRI'

// ─── Regulasi ─────────────────────────────────────────────────────────────────
export type Regulasi =
  | 'UUCK_PP35'    // UU Cipta Kerja / PP No. 35/2021 (berlaku sejak 2021)
  | 'UUK_13_2003'  // UU Ketenagakerjaan No. 13/2003 (sebelum UUCK)

// ─── Data Karyawan ────────────────────────────────────────────────────────────
export interface DataKaryawan {
  id: string
  nama: string
  nik?: string           // Nomor Induk Karyawan (opsional, untuk workpaper audit)
  jabatan?: string       // Jabatan/posisi (opsional, untuk identifikasi)
  divisi?: string        // Divisi/departemen (opsional, untuk identifikasi)
  tanggalLahir: string   // "YYYY-MM-DD"
  tanggalMasuk: string   // "YYYY-MM-DD"
  upahBulanan: number    // Gaji pokok + tunjangan tetap (Rupiah/bulan)
  jenisKelamin: 'L' | 'P'
}

// ─── Asumsi Ekonomi ───────────────────────────────────────────────────────────
export interface AsumsiEkonomi {
  tingkatDiskonto: number       // desimal, misal 0.0711 = 7.11%
  tingkatKenaikanGaji: number   // desimal, misal 0.05 = 5%
}

// ─── Asumsi Demografi ─────────────────────────────────────────────────────────
export interface AsumsiDemografi {
  tingkatPengunduranDiri: number  // desimal per tahun, misal 0.02 = 2%
  tingkatCacat: number            // desimal per tahun (flat), misal 0.001
  gunakanMortalita: boolean       // true = pakai TMI-2019 (usia-variabel)
}

// ─── Formula Resign ───────────────────────────────────────────────────────────
// Beberapa perusahaan punya formula UPisah berbeda dari default
export interface FormulaResign {
  persentaseUPH: number  // default 0.15 → UPisah = 15% × (1×PSG + 1×UPMK) × upah
}

// ─── Rekonsiliasi NKKIP (format laporan keuangan PSAK 24) ────────────────────
export interface RekonsiliasiNKKIP {
  nkkipAwal: number
  biayaJasaKini: number
  biayaBunga: number
  biayaJasaLalu: number
  keuntunganKerugianAktuaria: number  // positif = kerugian (+NKKIP), negatif = keuntungan (-NKKIP)
  pembayaranImbalan: number
  nkkipAkhir: number                  // dihitung otomatis = nkkipAwal + semua komponen
}

// ─── Perubahan Program Imbalan (untuk Past Service Cost) ──────────────────────
// Timbul saat perusahaan mengubah rumusan imbalan (PSAK 24 par. 100-101)
export interface InputPerubahanProgram {
  aktif: boolean
  regulasiSebelum?: Regulasi        // regulasi sebelum perubahan
  persentaseUPHSebelum?: number     // UPH sebelum perubahan (desimal, bukan persen)
  nkkipSebelum?: number             // NKKIP sebelum perubahan (jika sudah diketahui)
}

// ─── Input Perhitungan ────────────────────────────────────────────────────────
export interface InputPerhitungan {
  karyawan: DataKaryawan
  tanggalPerhitungan: string        // "YYYY-MM-DD" — tanggal laporan keuangan
  usiaPensiun: number               // usia pensiun normal, default 55
  regulasi: Regulasi
  metode: MetodePerhitungan
  asumsiEkonomi: AsumsiEkonomi
  asumsiDemografi: AsumsiDemografi
  jenisImbalanDihitung: JenisKeluar[] // minimal ['PENSIUN']
  formulaResign: FormulaResign
  nkkipAwalPeriode?: number           // NKKIP dari akhir periode sebelumnya (Rp) — untuk menghitung IC
  perubahanProgram?: InputPerubahanProgram  // untuk menghitung Past Service Cost
  rekonsiliasiInput?: {              // Data tambahan untuk rekonsiliasi NKKIP lengkap
    nkkipAwalPeriode?: number        // NKKIP awal periode (bisa berbeda dari nkkipAwalPeriode di atas)
    pembayaranImbalanPeriode?: number // Pembayaran imbalan selama periode (Rp)
    keuntunganKerugianAktuaria?: number // GL: positif = kerugian (+NKKIP), negatif = keuntungan (-NKKIP)
  }
}

// ─── Tabel Probabilitas "Olahan" ──────────────────────────────────────────────
// Satu baris = satu tahun. Dibuat dari asumsi demografi "mentah".
export interface ProbabilitasOlahan {
  usia: number
  peluangTetapBekerja: number    // prob. masih aktif di AWAL usia ini
  peluangPensiun: number         // prob. pensiun DI usia ini
  peluangMeninggal: number       // prob. meninggal SELAMA tahun ini
  peluangCacat: number           // prob. cacat SELAMA tahun ini
  peluangUndurDiri: number       // prob. resign SELAMA tahun ini
}

// ─── Detail Per Usia Per Jenis Keluar ─────────────────────────────────────────
// Baris perhitungan PUC_FULL: satu baris per (usia × jenis keluar)
export interface DetailPerUsia {
  usia: number
  jenisKeluar: JenisKeluar
  masaKerja: number              // MK pada usia ini (tahun, floor)
  proyeksiUpah: number           // upah proyeksi di usia ini
  faktorPSG: number
  faktorUPMK: number
  proyeksiImbalan: number        // Benefit amount pada usia ini (Rupiah)
  peluang: number                // Probabilitas kejadian (dari tabel olahan)
  faktorDiskonto: number         // (1 + r_diskonto)^(-sisa MK)
  nilaiKini: number              // peluang × proyeksiImbalan × faktorDiskonto
  usiaStartAtribusi: number
  masaKerjaAtribusi: number      // denominator atribusi
  mkAtribusiLalu: number         // numerator atribusi
  proporsiAtribusi: number       // mkAtribusiLalu / masaKerjaAtribusi
  kontribusiNKKIP: number        // nilaiKini × proporsiAtribusi
  kontribusiBiayaJasa: number    // nilaiKini / masaKerjaAtribusi
}

// ─── Hasil Perhitungan ────────────────────────────────────────────────────────
export interface HasilPerhitungan {
  input: InputPerhitungan

  // Data turunan pada tanggal perhitungan
  usiaSekarang: number
  usiaMasuk: number
  masaKerjaLalu: number       // MK sudah dijalani (desimal)
  masaKerjaTotal: number      // MK total hingga pensiun (desimal)
  masaKerjaMendatang: number  // Sisa MK (desimal)

  // Atribusi (sesuai DSAK IAI April 2022)
  usiaStartAtribusi: number
  masaKerjaAtribusiMax: number  // min(masaKerjaTotal, 24)
  mkAtribusiLalu: number        // max(0, usiaSekarang - usiaStartAtribusi)

  // Proyeksi ke pensiun
  proyeksiUpahPensiun: number
  faktorPSGPensiun: number
  faktorUPMKPensiun: number
  proyeksiImbalanPensiun: number

  // HASIL UTAMA
  nkkip: number             // Nilai Kini Kewajiban Imbalan Pasti (= DBO)
  biayaJasaKini: number     // Current Service Cost
  biayaBunga: number        // Interest Cost = r_diskonto × nkkip_awal_periode
  biayaJasaLalu?: number    // Past Service Cost = NKKIP_baru - NKKIP_lama (jika ada perubahan program)
  nkkipSebelumPerubahan?: number  // NKKIP sebelum perubahan program
  rekonsiliasi?: RekonsiliasiNKKIP  // Rekonsiliasi NKKIP lengkap (jika rekonsiliasiInput diisi)

  // Breakdown per jenis keluar
  nkkipPerJenis: Partial<Record<JenisKeluar, number>>
  biayaJasaPerJenis: Partial<Record<JenisKeluar, number>>

  // Detail baris (PUC_FULL / PUC_ECONOMIC)
  details: DetailPerUsia[]

  // Tabel probabilitas (PUC_FULL)
  tabelProbabilitas: ProbabilitasOlahan[]

  metode: MetodePerhitungan
}

// ─── Input Estimasi Rata-rata ─────────────────────────────────────────────────
export interface InputEstimasi {
  tanggalPerhitungan: string
  jumlahKaryawan: number
  rataRataUsia: number        // tahun
  rataRataMasaKerja: number   // tahun
  rataRataUpah: number        // Rupiah/bulan
  usiaPensiun: number
  regulasi: Regulasi
  metode: MetodePerhitungan
  asumsiEkonomi: AsumsiEkonomi
  asumsiDemografi: AsumsiDemografi
  gunakanDistribusi: boolean
  distribusi?: DistribusiBucket[]
}

export interface DistribusiBucket {
  label: string           // misal "< 30 tahun"
  jumlahKaryawan: number
  rataRataUsia: number
  rataRataMasaKerja: number
  rataRataUpah: number
}

// ─── Hasil Batch ──────────────────────────────────────────────────────────────
export interface HasilBatch {
  hasil: HasilPerhitungan[]
  totalNKKIP: number
  totalBiayaJasa: number
  totalKaryawan: number
  tanggalPerhitungan: string
  metode: MetodePerhitungan
  ringkasanPerJenis: Partial<Record<JenisKeluar, { nkkip: number; biayaJasa: number }>>
}
