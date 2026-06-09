/**
 * Tabel PSG/UPMK dan formula imbalan
 *
 * Referensi: PP No. 35/2021 (UUCK) dan UU No. 13/2003 (UUK)
 * Slide materi: 12, 13, 85
 */

import type { JenisKeluar, Regulasi } from './types'

// ─── Tabel Uang Pesangon (PSG) ────────────────────────────────────────────────
/**
 * Faktor PSG berdasarkan masa kerja — PP 35/2021 (sama dengan UUK 13/2003).
 * Gunakan Math.floor(masaKerja) sebelum lookup.
 *
 * Tabel resmi PP 35/2021 Pasal 40 ayat 2:
 *   MK < 1  → 1   |  1≤MK<2  → 2   |  2≤MK<3  → 3
 *   3≤MK<4  → 4   |  4≤MK<5  → 5   |  5≤MK<6  → 6
 *   6≤MK<7  → 7   |  7≤MK<8  → 8   |  MK≥8    → 9 (cap)
 *
 * Boundary cap adalah MK≥8, BUKAN MK≥9.
 * Beberapa materi pelatihan IAI mencantumkan "MK≥9 → 9" di baris terakhir tabel,
 * yang menimbulkan kesan ada gap untuk MK=8.x. Ini adalah typo ringkasan —
 * baris sebelumnya ("7≤MK<8 → 8") membuktikan MK=8 sudah masuk cap 9 bulan.
 * Kode ini mengikuti bunyi pasal PP 35/2021 yang sebenarnya.
 *
 * @param masaKerja masa kerja dalam tahun desimal
 * @returns jumlah bulan gaji PSG
 *
 * Contoh: getFaktorPSG(11) → 9, getFaktorPSG(8.0) → 9, getFaktorPSG(7.9) → 8
 */
export function getFaktorPSG(masaKerja: number): number {
  const mk = Math.floor(Math.round(masaKerja * 10000) / 10000)
  if (mk >= 8) return 9
  if (mk >= 7) return 8
  if (mk >= 6) return 7
  if (mk >= 5) return 6
  if (mk >= 4) return 5
  if (mk >= 3) return 4
  if (mk >= 2) return 3
  if (mk >= 1) return 2
  return 1 // MK < 1 tahun tetap mendapat 1 bulan
}

// ─── Tabel Uang Penghargaan Masa Kerja (UPMK) ────────────────────────────────
/**
 * Faktor UPMK berdasarkan masa kerja — PP 35/2021 (sama dengan UUK 13/2003).
 *
 * Tabel (slide 13):
 *   MK < 3   → 0   |  3≤MK<6   → 2   |  6≤MK<9   → 3
 *   9≤MK<12  → 4   |  12≤MK<15 → 5   |  15≤MK<18 → 6
 *   18≤MK<21 → 7   |  21≤MK<24 → 8   |  MK≥24    → 10 (cap)
 *
 * Catatan: Ada lompatan 8→10 (tidak ada 9) pada MK≥24 tahun.
 * Cap 24 tahun ini yang menentukan MAX_ATRIBUSI_TAHUN di attribution.ts.
 *
 * @param masaKerja masa kerja dalam tahun desimal
 * @returns jumlah bulan gaji UPMK
 *
 * Contoh: getFaktorUPMK(11) → 4, getFaktorUPMK(24) → 10, getFaktorUPMK(2) → 0
 */
export function getFaktorUPMK(masaKerja: number): number {
  const mk = Math.floor(Math.round(masaKerja * 10000) / 10000)
  if (mk >= 24) return 10
  if (mk >= 21) return 8
  if (mk >= 18) return 7
  if (mk >= 15) return 6
  if (mk >= 12) return 5
  if (mk >= 9)  return 4
  if (mk >= 6)  return 3
  if (mk >= 3)  return 2
  return 0 // MK < 3 tahun tidak mendapat UPMK
}

// ─── Hasil Faktor Imbalan ─────────────────────────────────────────────────────
export interface FaktorImbalan {
  faktorPSG: number      // bulan gaji dari tabel PSG
  faktorUPMK: number     // bulan gaji dari tabel UPMK
  multiplierPSG: number  // koefisien perkalian PSG (sesuai jenis keluar & regulasi)
  multiplierUPMK: number // koefisien perkalian UPMK
  faktorTotal: number    // total bulan gaji = multiplierPSG×PSG + multiplierUPMK×UPMK
}

// ─── Faktor Imbalan Per Jenis Keluar & Regulasi ───────────────────────────────
/**
 * Hitung faktor imbalan total berdasarkan jenis keluar dan regulasi.
 *
 * UUCK / PP 35/2021 (slide 12):
 *   PENSIUN          : 1.75×PSG + 1×UPMK
 *   MENINGGAL        : 2×PSG    + 1×UPMK
 *   CACAT            : 2×PSG    + 1×UPMK
 *   MENGUNDURKAN_DIRI: UPisah = persentaseUPH × (1×PSG + 1×UPMK)
 *
 * UUK No. 13/2003 (slide 85):
 *   PENSIUN          : (2×PSG + 1×UPMK) × 1.15
 *   MENINGGAL        : (2×PSG + 1×UPMK) × 1.15
 *   CACAT            : (2×PSG + 2×UPMK) × 1.15
 *   MENGUNDURKAN_DIRI: UPisah = persentaseUPH × (1×PSG + 1×UPMK)
 *
 * @param masaKerja masa kerja (tahun desimal — akan di-floor sebelum lookup)
 * @param jenisKeluar jenis peristiwa keluar
 * @param regulasi UUCK_PP35 atau UUK_13_2003
 * @param persentaseUPH persentase UPisah untuk resign, default 0.15 (15%)
 *
 * Contoh verifikasi (slide 44, Contoh 4):
 *   MK=11, PENSIUN, UUK_13_2003
 *   PSG=9, UPMK=4
 *   faktorTotal = (2×9 + 1×4)×1.15 = 22×1.15 = 25.3
 *   imbalan = 25.3 × 12,763 = 322,904 ✓
 *
 * Contoh verifikasi (slide 58, Contoh 5):
 *   MK=10, MENGUNDURKAN_DIRI, UUCK_PP35, persentaseUPH=0.15
 *   PSG=9, UPMK=4
 *   faktorTotal = 0.15×(9+4) = 0.15×13 = 1.95
 *   imbalan = 1.95 × 12,155 = 23,702 ✓
 */
export function hitungFaktorImbalan(
  masaKerja: number,
  jenisKeluar: JenisKeluar,
  regulasi: Regulasi,
  persentaseUPH = 0.15
): FaktorImbalan {
  const faktorPSG = getFaktorPSG(masaKerja)
  const faktorUPMK = getFaktorUPMK(masaKerja)

  if (regulasi === 'UUCK_PP35') {
    if (jenisKeluar === 'PENSIUN') {
      return {
        faktorPSG, faktorUPMK,
        multiplierPSG: 1.75, multiplierUPMK: 1,
        faktorTotal: 1.75 * faktorPSG + faktorUPMK,
      }
    }
    if (jenisKeluar === 'MENINGGAL' || jenisKeluar === 'CACAT') {
      return {
        faktorPSG, faktorUPMK,
        multiplierPSG: 2, multiplierUPMK: 1,
        faktorTotal: 2 * faktorPSG + faktorUPMK,
      }
    }
    // MENGUNDURKAN_DIRI — UPisah
    return {
      faktorPSG, faktorUPMK,
      multiplierPSG: persentaseUPH, multiplierUPMK: persentaseUPH,
      faktorTotal: persentaseUPH * (faktorPSG + faktorUPMK),
    }
  }

  // UUK_13_2003
  if (jenisKeluar === 'PENSIUN' || jenisKeluar === 'MENINGGAL') {
    return {
      faktorPSG, faktorUPMK,
      multiplierPSG: 2 * 1.15, multiplierUPMK: 1 * 1.15,
      faktorTotal: (2 * faktorPSG + faktorUPMK) * 1.15,
    }
  }
  if (jenisKeluar === 'CACAT') {
    return {
      faktorPSG, faktorUPMK,
      multiplierPSG: 2 * 1.15, multiplierUPMK: 2 * 1.15,
      faktorTotal: (2 * faktorPSG + 2 * faktorUPMK) * 1.15,
    }
  }
  // MENGUNDURKAN_DIRI — UPisah (sama antara dua regulasi)
  return {
    faktorPSG, faktorUPMK,
    multiplierPSG: persentaseUPH, multiplierUPMK: persentaseUPH,
    faktorTotal: persentaseUPH * (faktorPSG + faktorUPMK),
  }
}
