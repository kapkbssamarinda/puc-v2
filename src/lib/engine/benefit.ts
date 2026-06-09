/**
 * Kalkulasi nilai imbalan dalam Rupiah
 *
 * Referensi: PP 35/2021 pasal 40–43, UU 13/2003 pasal 156
 */

import type { JenisKeluar, Regulasi } from './types'
import { hitungFaktorImbalan } from './tables'

/**
 * Hitung nilai imbalan dalam Rupiah.
 *
 * Rumus: imbalan = faktorTotal × upah
 * Lihat hitungFaktorImbalan() di tables.ts untuk detail tiap jenis keluar.
 *
 * @param masaKerja masa kerja dalam tahun desimal (Math.floor dipakai saat lookup)
 * @param upah upah sebulan dalam Rupiah (gaji pokok + tunjangan tetap)
 * @param jenisKeluar jenis peristiwa keluar
 * @param regulasi UUCK_PP35 atau UUK_13_2003
 * @param persentaseUPH persentase UPisah untuk resign, default 0.15
 * @returns nilai imbalan dalam Rupiah
 *
 * Contoh verifikasi 1 (slide 44, Contoh 4 — UUK):
 *   hitungImbalan(11, 12_763_000, 'PENSIUN', 'UUK_13_2003')
 *   PSG(11)=9, UPMK(11)=4
 *   faktorTotal = (2×9 + 1×4)×1.15 = 25.3
 *   → 25.3 × 12,763,000 = 322,903,900 ≈ 322,904,000 ✓
 *
 * Contoh verifikasi 2 (slide 58, Contoh 5 — Resign UUCK):
 *   hitungImbalan(10, 12_155_000, 'MENGUNDURKAN_DIRI', 'UUCK_PP35', 0.15)
 *   PSG(10)=9, UPMK(10)=4
 *   faktorTotal = 0.15×(9+4) = 1.95
 *   → 1.95 × 12,155,000 = 23,702,250 ≈ 23,702,000 ✓
 */
export function hitungImbalan(
  masaKerja: number,
  upah: number,
  jenisKeluar: JenisKeluar,
  regulasi: Regulasi,
  persentaseUPH = 0.15
): number {
  const { faktorTotal } = hitungFaktorImbalan(masaKerja, jenisKeluar, regulasi, persentaseUPH)
  return faktorTotal * upah
}

/**
 * Proyeksikan upah ke usia tertentu menggunakan asumsi kenaikan gaji.
 *
 * Rumus: upahProyeksi = upahSekarang × (1 + rKenaikanGaji)^n
 *
 * @param upahSekarang upah pada tanggal perhitungan (Rupiah)
 * @param rKenaikanGaji tingkat kenaikan gaji desimal per tahun
 * @param tahun jumlah tahun proyeksi ke depan
 * @returns upah proyeksi (Rupiah)
 *
 * Contoh (slide 44): upah=7,500,000, r=5%=0.05, n=11 tahun
 *   → 7,500,000 × (1.05)^11 = 7,500,000 × 1.71034 = 12,827,550
 *   (slide menunjukkan 12,763 ribuan karena pembulatan berbeda)
 */
export function proyeksikanUpah(
  upahSekarang: number,
  rKenaikanGaji: number,
  tahun: number
): number {
  if (tahun <= 0) return upahSekarang
  return upahSekarang * Math.pow(1 + rKenaikanGaji, tahun)
}

/**
 * Hitung faktor diskonto untuk n tahun ke depan.
 *
 * Rumus: faktorDiskonto = (1 + rDiskonto)^(-n) = 1 / (1 + rDiskonto)^n
 *
 * @param rDiskonto tingkat diskonto desimal per tahun
 * @param tahun jumlah tahun ke depan
 * @returns faktor diskonto (antara 0 dan 1)
 */
export function hitungFaktorDiskonto(rDiskonto: number, tahun: number): number {
  if (tahun <= 0) return 1
  return Math.pow(1 + rDiskonto, -tahun)
}
