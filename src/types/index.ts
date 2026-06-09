// ============================================================
// TIPE DATA INTI — PUC Kalkulator Imbalan Pasca Kerja
// ============================================================

// ─── Metode Perhitungan ────────────────────────────────────
export type MetodePerhitungan =
  | "LIQUIDATION"       // Pesangon saat ini (non-PSAK, baseline)
  | "PUC_NO_ECON"       // PUC tanpa asumsi ekonomi (Contoh 3 DSAK IAI 2022)
  | "PUC_WITH_ECON"     // PUC + diskonto + kenaikan gaji (Contoh 4)
  | "PUC_COMPREHENSIVE"; // PUC + demografi (Contoh 5) — standar audit

// ─── Input Karyawan ────────────────────────────────────────
export interface DataKaryawan {
  nama: string;
  nik: string;
  tanggalLahir: string;      // ISO date string "YYYY-MM-DD"
  tanggalMasuk: string;      // ISO date string "YYYY-MM-DD"
  tanggalReferensi: string;  // ISO date string "YYYY-MM-DD" (tanggal valuasi)
  tanggalPensiun?: string;   // Opsional — jika dikosongkan, dihitung otomatis dari usiaPensiun
  usiaPensiun: number;       // Usia pensiun normal (default: 55)
  gajiPokok: number;         // Gaji pokok per bulan (Rupiah)
  jabatan?: string;
  divisi?: string;
}

// ─── Asumsi Aktuarial ──────────────────────────────────────
export interface AsumsiEkonomi {
  tingkatDiskonto: number;        // % per tahun, e.g. 6.5
  tingkatKenaikanGaji: number;    // % per tahun, e.g. 8.0
}

export interface AsumsiDemografi {
  tingkatMortality: number;       // % per tahun (dari tabel mortalitas CSO/TMI)
  tingkatResign: number;          // % per tahun (turnover)
  tingkatDisabilitas: number;     // % per tahun
}

export interface AsumsiAktuarial {
  ekonomi?: AsumsiEkonomi;
  demografi?: AsumsiDemografi;
}

// ─── Parameter Formula Manfaat ─────────────────────────────
export interface FormulaManfaat {
  sumber: "UU_CIPTA_KERJA" | "PERJANJIAN_KERJA" | "MANUAL";
  // UU Cipta Kerja: menggunakan tabel UPMK PP 35/2021
  // MANUAL: user input langsung persentase gaji × masa kerja
  persentasePerTahun?: number;    // Hanya untuk MANUAL
  maksimumBulanGaji?: number;     // Cap manfaat (default: sesuai regulasi)
}

// ─── Hasil Per Karyawan ────────────────────────────────────
export interface HasilKaryawan {
  karyawan: DataKaryawan;
  metode: MetodePerhitungan;
  asumsi: AsumsiAktuarial;
  formula: FormulaManfaat;

  // Data turunan
  usia: number;               // Usia pada tanggal referensi (desimal)
  masaKerja: number;          // Masa kerja (desimal)
  masaKerjaReguler: number;   // Masa kerja dibulatkan (sesuai aturan PSG/UPMK)
  sisaMasaKerja: number;      // Sisa masa kerja hingga pensiun
  gajiProyeksi: number;       // Gaji saat pensiun (jika ada asumsi kenaikan gaji)

  // Komponen liabilitas utama
  manfaatPadaPensiun: number;         // Projected benefit obligation (PBO) saat pensiun
  currentServiceCost: number;         // Biaya jasa kini (tahun berjalan)
  presentValueObligation: number;     // Present value of defined benefit obligation (PVDBO)
  pastServiceCost?: number;           // Biaya jasa lalu (jika ada perubahan program)

  // Atribusi
  unitKreditAkumulasi: number;        // Unit kredit yang sudah diakui s.d. tanggal referensi
  unitKreditTahunIni: number;         // Unit kredit tahun berjalan

  // Rekonsiliasi (untuk laporan keuangan)
  rekonsiliasi?: RekonsiliasiNKKIP;

  // Langkah-langkah perhitungan (untuk transparansi)
  langkahPerhitungan: LangkahPerhitungan[];
}

// ─── Rekonsiliasi NKKIP ────────────────────────────────────
export interface RekonsiliasiNKKIP {
  awalPeriode: number;
  currentServiceCost: number;
  interestCost: number;
  actuarialGainLoss: number;
  benefitPaid: number;
  akhirPeriode: number;
}

// ─── Langkah Perhitungan (Transparansi) ───────────────────
export interface LangkahPerhitungan {
  urutan: number;
  label: string;
  deskripsi: string;
  nilai?: number;
  satuan?: "rupiah" | "persen" | "tahun" | "bulan" | "unit";
  rumus?: string;
  tooltip?: string;
}

// ─── Hasil Batch ───────────────────────────────────────────
export interface HasilBatch {
  tanggalHitung: string;
  metode: MetodePerhitungan;
  asumsi: AsumsiAktuarial;
  formula: FormulaManfaat;
  daftarHasil: HasilKaryawan[];
  total: {
    presentValueObligation: number;
    currentServiceCost: number;
    jumlahKaryawan: number;
  };
}

// ─── Input Estimasi Rata-rata ──────────────────────────────
export interface InputEstimasi {
  jumlahKaryawan: number;
  usiaRata: number;
  masaKerjaRata: number;
  gajiRata: number;
  usiaPensiun: number;
  metode: MetodePerhitungan;
  asumsi: AsumsiAktuarial;
  formula: FormulaManfaat;
}

// ─── Tipe untuk Form ───────────────────────────────────────
export type FormInputKalkulator = Omit<DataKaryawan, "tanggalReferensi"> & {
  tanggalReferensi: string;
  metode: MetodePerhitungan;
  asumsi: AsumsiAktuarial;
  formula: FormulaManfaat;
};

// ─── Tipe CSV ──────────────────────────────────────────────
export interface CSVRowKaryawan {
  nama: string;
  nik: string;
  tanggal_lahir: string;
  tanggal_masuk: string;
  usia_pensiun?: string;
  gaji_pokok: string;
  jabatan?: string;
  divisi?: string;
}
