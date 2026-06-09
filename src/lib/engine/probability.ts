/**
 * Tabel mortalita dan probabilitas aktuarial "olahan"
 *
 * Referensi:
 *   - Tabel Mortalita Indonesia IV 2019 (TMI-2019) — slide 38
 *   - Metode decrements — slide 49–53
 */

import type { AsumsiDemografi, ProbabilitasOlahan } from './types'

// ─── Tabel Mortalita Indonesia IV 2019 (TMI-2019) ────────────────────────────
/**
 * Tingkat mortalita qx (probabilitas meninggal dalam setahun) per usia.
 * Nilai dari slide 38 (anchor): 25, 30, 35, 40, 45, 50, 55.
 * Nilai usia lain: interpolasi linear antar anchor.
 * Usia di luar 18–60: ekstrapolasi dari slope terdekat.
 *
 * Anchor (slide 38):
 *   Usia | Male     | Female
 *   25   | 0.00052  | 0.00038
 *   30   | 0.00075  | 0.00056
 *   35   | 0.00107  | 0.00080
 *   40   | 0.00173  | 0.00118
 *   45   | 0.00302  | 0.00187
 *   50   | 0.00508  | 0.00305
 *   55   | 0.00789  | 0.00483
 *
 * Tingkat cacat = 10% × mortalita usia x (slide 38, catatan).
 */
export const TMI_2019: Record<number, { male: number; female: number }> = {
  // ── Usia 18–24 (ekstrapolasi mundur dari slope 25→30) ──
  // Male slope: (0.00075 − 0.00052) / 5 = 0.000046/tahun
  // Female slope: (0.00056 − 0.00038) / 5 = 0.000036/tahun
  18: { male: 0.000198, female: 0.000128 },
  19: { male: 0.000244, female: 0.000164 },
  20: { male: 0.000290, female: 0.000200 },
  21: { male: 0.000336, female: 0.000236 },
  22: { male: 0.000382, female: 0.000272 },
  23: { male: 0.000428, female: 0.000308 },
  24: { male: 0.000474, female: 0.000344 },
  // ── Anchor 25 ──
  25: { male: 0.000520, female: 0.000380 },
  // ── Usia 26–29 (interpolasi linear 25→30) ──
  26: { male: 0.000566, female: 0.000416 },
  27: { male: 0.000612, female: 0.000452 },
  28: { male: 0.000658, female: 0.000488 },
  29: { male: 0.000704, female: 0.000524 },
  // ── Anchor 30 ──
  30: { male: 0.000750, female: 0.000560 },
  // ── Usia 31–34 (interpolasi linear 30→35, slope male 0.000064, female 0.000048) ──
  31: { male: 0.000814, female: 0.000608 },
  32: { male: 0.000878, female: 0.000656 },
  33: { male: 0.000942, female: 0.000704 },
  34: { male: 0.001006, female: 0.000752 },
  // ── Anchor 35 ──
  35: { male: 0.001070, female: 0.000800 },
  // ── Usia 36–39 (interpolasi linear 35→40, slope male 0.000132, female 0.000076) ──
  36: { male: 0.001202, female: 0.000876 },
  37: { male: 0.001334, female: 0.000952 },
  38: { male: 0.001466, female: 0.001028 },
  39: { male: 0.001598, female: 0.001104 },
  // ── Anchor 40 ──
  40: { male: 0.001730, female: 0.001180 },
  // ── Usia 41–44 (interpolasi linear 40→45, slope male 0.000258, female 0.000138) ──
  41: { male: 0.001988, female: 0.001318 },
  42: { male: 0.002246, female: 0.001456 },
  43: { male: 0.002504, female: 0.001594 },
  44: { male: 0.002762, female: 0.001732 },
  // ── Anchor 45 ──
  45: { male: 0.003020, female: 0.001870 },
  // ── Usia 46–49 (interpolasi linear 45→50, slope male 0.000412, female 0.000236) ──
  46: { male: 0.003432, female: 0.002106 },
  47: { male: 0.003844, female: 0.002342 },
  48: { male: 0.004256, female: 0.002578 },
  49: { male: 0.004668, female: 0.002814 },
  // ── Anchor 50 ──
  50: { male: 0.005080, female: 0.003050 },
  // ── Usia 51–54 (interpolasi linear 50→55, slope male 0.000562, female 0.000356) ──
  51: { male: 0.005642, female: 0.003406 },
  52: { male: 0.006204, female: 0.003762 },
  53: { male: 0.006766, female: 0.004118 },
  54: { male: 0.007328, female: 0.004474 },
  // ── Anchor 55 ──
  55: { male: 0.007890, female: 0.004830 },
  // ── Usia 56–60 (ekstrapolasi maju dari slope 50→55) ──
  56: { male: 0.008452, female: 0.005186 },
  57: { male: 0.009014, female: 0.005542 },
  58: { male: 0.009576, female: 0.005898 },
  59: { male: 0.010138, female: 0.006254 },
  60: { male: 0.010700, female: 0.006610 },
}

/**
 * Ambil tingkat mortalita untuk usia tertentu dari TMI-2019.
 * Usia di luar [18, 60] di-clamp ke batas tabel.
 */
function getMortalitaRate(usia: number, jenisKelamin: 'L' | 'P'): number {
  const clampedAge = Math.max(18, Math.min(60, Math.floor(usia)))
  const rates = TMI_2019[clampedAge]
  return jenisKelamin === 'L' ? rates.male : rates.female
}

// ─── Buat Tabel Probabilitas Olahan ──────────────────────────────────────────
/**
 * Bangun tabel probabilitas aktuarial "olahan" dari asumsi demografi mentah.
 *
 * Proses multiple-decrement (slide 49–53):
 *   Dimulai dengan peluangTetapBekerja = 1.0 pada usia sekarang.
 *   Setiap tahun, sebagian karyawan keluar karena resign, meninggal, atau cacat.
 *   Sisanya terus bekerja sampai pensiun.
 *
 * Untuk setiap usia x (dari usiaSekarang sampai usiaPensiun − 1):
 *   qMeninggal  = TMI_2019[x] (jika gunakanMortalita) atau 0
 *   qCacat      = 0.1 × qMeninggal (jika gunakanMortalita) atau tingkatCacat (flat)
 *   qResign     = tingkatPengunduranDiri (flat, per tahun)
 *   qTotal      = qMeninggal + qCacat + qResign
 *
 *   peluangMeninggal[x]  = tetapBekerja[x] × qMeninggal
 *   peluangCacat[x]      = tetapBekerja[x] × qCacat
 *   peluangUndurDiri[x]  = tetapBekerja[x] × qResign
 *   tetapBekerja[x+1]    = tetapBekerja[x] × (1 − qTotal)
 *
 * Pada usia pensiun:
 *   peluangPensiun = tetapBekerja (semua yang tersisa pensiun)
 *
 * Verifikasi (slide 49 — hanya resign 2%, tanpa mortalita/cacat):
 *   Usia 50: tetap=1.00000, resign=0.02000
 *   Usia 51: tetap=0.98000, resign=0.01960
 *   Usia 52: tetap=0.96040, resign=0.01921
 *   Usia 53: tetap=0.94119, resign=0.01882
 *   Usia 54: tetap=0.92237, resign=0.01845
 *   Usia 55: tetap=0.90392, pensiun=0.90392
 *   Jumlah semua peluang = 1.00000 ✓
 *
 * @param usiaSekarang usia karyawan pada tanggal perhitungan (integer)
 * @param usiaPensiun usia pensiun normal (integer)
 * @param jenisKelamin 'L' (laki-laki) atau 'P' (perempuan)
 * @param asumsi asumsi demografi
 */
export function buatTabelProbabilitas(
  usiaSekarang: number,
  usiaPensiun: number,
  jenisKelamin: 'L' | 'P',
  asumsi: AsumsiDemografi
): ProbabilitasOlahan[] {
  const result: ProbabilitasOlahan[] = []
  const usiaAwal = Math.ceil(usiaSekarang)

  if (usiaAwal > usiaPensiun) return result

  let tetapBekerja = 1.0

  for (let usia = usiaAwal; usia <= usiaPensiun; usia++) {
    if (usia === usiaPensiun) {
      // Semua yang masih aktif di usia pensiun → pensiun
      result.push({
        usia,
        peluangTetapBekerja: tetapBekerja,
        peluangPensiun: tetapBekerja,
        peluangMeninggal: 0,
        peluangCacat: 0,
        peluangUndurDiri: 0,
      })
    } else {
      // Tingkat mortalita dan cacat per tahun
      let qMeninggal: number
      let qCacat: number

      if (asumsi.gunakanMortalita) {
        // Tingkat usia-variabel dari TMI-2019; cacat = 10% × mortalita (slide 38)
        qMeninggal = getMortalitaRate(usia, jenisKelamin)
        qCacat = 0.1 * qMeninggal
      } else {
        qMeninggal = 0
        qCacat = asumsi.tingkatCacat  // flat rate jika tidak pakai TMI
      }

      const qResign = asumsi.tingkatPengunduranDiri
      const qTotal = qMeninggal + qCacat + qResign

      const peluangMeninggal = tetapBekerja * qMeninggal
      const peluangCacat     = tetapBekerja * qCacat
      const peluangUndurDiri = tetapBekerja * qResign

      result.push({
        usia,
        peluangTetapBekerja: tetapBekerja,
        peluangPensiun: 0,
        peluangMeninggal,
        peluangCacat,
        peluangUndurDiri,
      })

      tetapBekerja = tetapBekerja * (1 - qTotal)
    }
  }

  return result
}

/**
 * Validasi: jumlah semua peluang dalam tabel harus = 1.0 (± epsilon).
 * Berguna untuk debugging; return selisih dari 1.0.
 */
export function validasiTabelProbabilitas(tabel: ProbabilitasOlahan[]): number {
  const total = tabel.reduce((sum, row) => {
    return sum + row.peluangPensiun + row.peluangMeninggal + row.peluangCacat + row.peluangUndurDiri
  }, 0)
  return Math.abs(1 - total)
}
