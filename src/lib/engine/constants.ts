// ============================================================
// KONSTANTA AKTUARIAL & REGULASI
// Referensi: PP No. 35/2021, PSAK 24, DSAK IAI Siaran Pers April 2022
// ============================================================

// ─── Usia & Masa Kerja ────────────────────────────────────
export const USIA_PENSIUN_DEFAULT = 55;
export const MASA_KERJA_MINIMUM_PESANGON = 1; // tahun (PP 35/2021 Pasal 40)

// ─── Asumsi Default (desimal) ─────────────────────────────
// Nilai-nilai ini dalam DESIMAL (bukan persen) sesuai InputPerhitungan
export const DEFAULT_TINGKAT_DISKONTO = 0.0711;           // 7.11% — yield SBN 10yr (2024)
export const DEFAULT_TINGKAT_KENAIKAN_GAJI = 0.05;        // 5%
export const DEFAULT_TINGKAT_PENGUNDURAN_DIRI = 0.02;     // 2%
export const DEFAULT_TINGKAT_CACAT = 0.001;               // 0.1% (flat, ~ 10% mortalita avg)
export const DEFAULT_TINGKAT_MORTALITY = 0.003;           // rata-rata — gunakan TMI_2019 per usia

// Alias untuk backward-compat dengan constants lama
export const DEFAULT_TINGKAT_RESIGN = DEFAULT_TINGKAT_PENGUNDURAN_DIRI;
export const DEFAULT_TINGKAT_DISABILITAS = DEFAULT_TINGKAT_CACAT;

// ─── Tabel UPMK (Uang Pesangon + Masa Kerja) PP 35/2021 ──
// Kolom: [masaKerjaMinimum (tahun), bulanGaji]
// Uang Pesangon (Pasal 40 ayat 2)
export const TABEL_UANG_PESANGON: [number, number][] = [
  [1, 1],
  [2, 2],
  [3, 3],
  [4, 4],
  [5, 5],
  [6, 6],
  [7, 7],
  [8, 8],
  [9, 9],  // >= 9 tahun: 9 bulan gaji (cap)
];

// Uang Penghargaan Masa Kerja (Pasal 40 ayat 3)
export const TABEL_UANG_PENGHARGAAN: [number, number][] = [
  [3, 2],
  [6, 3],
  [9, 4],
  [12, 5],
  [15, 6],
  [18, 7],
  [21, 8],
  [24, 10],  // >= 24 tahun: 10 bulan gaji (cap)
];

// ─── Perhitungan UPMK Total ───────────────────────────────
// Catatan: untuk program imbalan pasca kerja PSAK 24,
// manfaat = Uang Pesangon + Uang Penghargaan Masa Kerja
// (tidak termasuk uang penggantian hak)

// ─── Label & Tooltip ─────────────────────────────────────
export const TOOLTIP_ISTILAH: Record<string, string> = {
  PUC: "Projected Unit Credit — metode aktuarial wajib menurut PSAK 24 yang mengakumulasikan kewajiban secara bertahap setiap tahun masa kerja karyawan.",
  PVDBO: "Present Value of Defined Benefit Obligation — nilai kini dari seluruh imbalan yang dijanjikan perusahaan kepada karyawan.",
  CSC: "Current Service Cost — biaya jasa kini, yaitu kenaikan PVDBO akibat satu tahun tambahan masa kerja karyawan.",
  diskonto: "Tingkat diskonto adalah imbal hasil obligasi pemerintah jangka panjang yang digunakan untuk menghitung nilai kini dari manfaat di masa depan.",
  mortalitas: "Probabilitas karyawan meninggal sebelum mencapai pensiun, berdasarkan tabel mortalitas standar (TMI-2019 atau CSO).",
  turnover: "Probabilitas karyawan keluar/resign sebelum berhak atas manfaat penuh.",
  unitKredit: "Satuan manfaat yang 'diperoleh' karyawan untuk setiap tahun masa kerja. Akumulasinya membentuk total kewajiban.",
};
