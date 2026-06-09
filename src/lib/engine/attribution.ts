/**
 * Logika Atribusi sesuai Siaran Pers DSAK IAI, April 2022
 *
 * PRINSIP UTAMA:
 * Karena faktor imbalan (PSG + UPMK) mencapai MAKSIMUM pada MK = 24 tahun
 * (PSG cap 9 pada MK≥8, UPMK cap 10 pada MK≥24 — angka 24 yang menentukan),
 * maka setiap tambahan MK setelah 24 tahun TIDAK menambah imbalan.
 * Oleh karena itu, PSAK 24 mengharuskan atribusi dilakukan hanya atas
 * 24 tahun TERAKHIR sebelum pensiun.
 *
 * KONSEKUENSI:
 * - Atribusi TIDAK selalu dimulai dari tanggal masuk kerja
 * - Dimulai dari usia: max(usiaMasuk, usiaPensiun − 24)
 *
 * PERBANDINGAN METODE (slide 86):
 *
 * Karyawan A: masuk usia 20, sekarang usia 25, pensiun 55
 *   Cara lama : proporsi = (25−20)/(55−20) = 5/35
 *   Cara BARU : startAtribusi = max(20, 55−24) = 31
 *               mkAtribusiLalu  = max(0, 25−31) = 0
 *               NKKIP = 0 ← akrual belum dimulai!
 *
 * Karyawan B: masuk usia 20, sekarang usia 35, pensiun 55
 *   Cara lama : proporsi = 15/35
 *   Cara BARU : startAtribusi = 31
 *               mkAtribusiLalu  = 35−31 = 4
 *               masaKerjaAtribusi = 24
 *               proporsi = 4/24 (bukan 15/35)
 *
 * Karyawan C: masuk usia 35, sekarang usia 46, pensiun 55
 *   Cara BARU : startAtribusi = max(35, 31) = 35 (masuk setelah 31, tidak berubah)
 *               masaKerjaAtribusi = 55−35 = 20 = min(20, 24)
 *               mkAtribusiLalu  = 46−35 = 11
 *               proporsi = 11/20 (sama dengan cara lama)
 */

/** Maksimum tahun atribusi — ditentukan oleh cap UPMK di 24 tahun. */
export const MAX_ATRIBUSI_TAHUN = 24

// ─── Hasil Atribusi ───────────────────────────────────────────────────────────
export interface HasilAtribusi {
  usiaStartAtribusi: number    // usia mulai atribusi = max(usiaMasuk, usiaAkhir − 24)
  masaKerjaAtribusi: number    // denominator: usiaAkhir − usiaStartAtribusi
  mkAtribusiLalu: number       // numerator: max(0, usiaSekarang − usiaStartAtribusi)
  proporsi: number             // mkAtribusiLalu / masaKerjaAtribusi
  biayaJasaPerUnit: number     // 1 / masaKerjaAtribusi (dikalikan nilaiKini → CSC per usia)
}

/**
 * Hitung parameter atribusi untuk satu karyawan pada tanggal perhitungan.
 *
 * @param usiaMasuk usia karyawan saat masuk kerja (tahun)
 * @param usiaSekarang usia karyawan pada tanggal perhitungan (tahun)
 * @param usiaPensiun usia pensiun normal (default 55)
 * @param usiaKeluar usia peristiwa keluar dini (untuk resign/meninggal/cacat < pensiun).
 *   Jika tidak diisi, gunakan usiaPensiun sebagai endpoint atribusi.
 * @returns parameter atribusi siap pakai
 *
 * Verifikasi Karyawan A (slide 86):
 *   hitungAtribusi(20, 25, 55) → { usiaStart:31, mkAtribusi:24, mkLalu:0, proporsi:0 }
 *
 * Verifikasi Karyawan B:
 *   hitungAtribusi(20, 35, 55) → { usiaStart:31, mkAtribusi:24, mkLalu:4, proporsi:0.1667 }
 *
 * Verifikasi Karyawan C:
 *   hitungAtribusi(35, 46, 55) → { usiaStart:35, mkAtribusi:20, mkLalu:11, proporsi:0.55 }
 */
export function hitungAtribusi(
  usiaMasuk: number,
  usiaSekarang: number,
  usiaPensiun: number,
  usiaKeluar?: number
): HasilAtribusi {
  // Endpoint: usia saat peristiwa (pensiun atau keluar dini)
  const usiaAkhir = usiaKeluar ?? usiaPensiun

  // Usia mulai atribusi: geser mundur maksimal 24 tahun dari endpoint
  const usiaStartAtribusi = Math.max(usiaMasuk, usiaAkhir - MAX_ATRIBUSI_TAHUN)

  // Denominator: panjang jendela atribusi (≤ 24)
  const masaKerjaAtribusi = usiaAkhir - usiaStartAtribusi

  // Numerator: berapa tahun dari jendela atribusi sudah dijalani
  const mkAtribusiLalu = Math.max(0, usiaSekarang - usiaStartAtribusi)

  // Guard: jika masaKerjaAtribusi = 0 (edge case: usiaMasuk = usiaAkhir)
  if (masaKerjaAtribusi <= 0) {
    return {
      usiaStartAtribusi,
      masaKerjaAtribusi: 0,
      mkAtribusiLalu: 0,
      proporsi: 0,
      biayaJasaPerUnit: 0,
    }
  }

  const proporsi = mkAtribusiLalu / masaKerjaAtribusi
  const biayaJasaPerUnit = 1 / masaKerjaAtribusi

  return {
    usiaStartAtribusi,
    masaKerjaAtribusi,
    mkAtribusiLalu,
    proporsi,
    biayaJasaPerUnit,
  }
}

/**
 * Hitung usia masuk kerja dari tanggal lahir dan tanggal masuk.
 *
 * @param tanggalLahir date object
 * @param tanggalMasuk date object
 * @returns usia saat masuk kerja (tahun desimal)
 */
export function hitungUsiaMasuk(tanggalLahir: Date, tanggalMasuk: Date): number {
  const msPerTahun = 365.25 * 24 * 60 * 60 * 1000
  return Math.max(0, (tanggalMasuk.getTime() - tanggalLahir.getTime()) / msPerTahun)
}
