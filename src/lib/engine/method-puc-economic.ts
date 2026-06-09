/**
 * METODE 3 — PUC DENGAN ASUMSI EKONOMI (Contoh 4)
 * Gaji diproyeksikan + imbalan masa depan didiskonto. Probabilitas = 1.0.
 *
 * Verifikasi (slide 44, Contoh 4):
 *   usia masuk 44, sekarang 50, pensiun 55, UUK
 *   upah=10.000, diskonto=7%, kenaikanGaji=5%, MK mendatang=5
 *   proyeksiUpah = 10.000 × 1.05^5 = 12.763
 *   imbalan = (2×9+1×4)×1.15 × 12.763 = 25.3 × 12.763 = 322.899
 *   nilaiKini = 322.899 × 1.07^-5 = 230.223
 *   startAtribusi=max(44,31)=44, atribusi=11, lalu=6
 *   NKKIP = 230.223 × 6/11 = 125.576 ✓
 *   Biaya Jasa = 230.223 / 11 = 20.929 ✓
 */

import type { InputPerhitungan, HasilPerhitungan, DetailPerUsia } from './types'
import { hitungImbalan, proyeksikanUpah, hitungFaktorDiskonto } from './benefit'
import { getFaktorPSG, getFaktorUPMK } from './tables'
import { hitungAtribusi } from './attribution'

function parseDate(s: string): Date { return new Date(s + 'T00:00:00') }
function selisihTahun(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

export function hitungPUCEconomic(input: InputPerhitungan): HasilPerhitungan {
  const { karyawan, tanggalPerhitungan, usiaPensiun, regulasi, asumsiEkonomi, formulaResign } = input

  const tglLahir  = parseDate(karyawan.tanggalLahir)
  const tglMasuk  = parseDate(karyawan.tanggalMasuk)
  const tglHitung = parseDate(tanggalPerhitungan)

  const usiaSekarang = selisihTahun(tglLahir, tglHitung)
  const usiaMasuk    = selisihTahun(tglLahir, tglMasuk)

  const masaKerjaLalu      = Math.round(selisihTahun(tglMasuk, tglHitung) * 10000) / 10000
  const masaKerjaTotal     = Math.round((usiaPensiun - usiaMasuk) * 10000) / 10000
  const masaKerjaMendatang = Math.max(0, usiaPensiun - usiaSekarang)

  const { tingkatDiskonto, tingkatKenaikanGaji } = asumsiEkonomi
  const upah = karyawan.upahBulanan

  // Proyeksi upah di usia pensiun
  const proyeksiUpahPensiun = proyeksikanUpah(upah, tingkatKenaikanGaji, masaKerjaMendatang)

  // Imbalan di usia pensiun menggunakan MK total dan upah proyeksi
  const imbalanPensiun    = hitungImbalan(masaKerjaTotal, proyeksiUpahPensiun, 'PENSIUN', regulasi, formulaResign.persentaseUPH)
  const faktorPSGPensiun  = getFaktorPSG(masaKerjaTotal)
  const faktorUPMKPensiun = getFaktorUPMK(masaKerjaTotal)

  // Diskonto ke tanggal perhitungan
  const faktorDiskontoVal = hitungFaktorDiskonto(tingkatDiskonto, masaKerjaMendatang)
  const nilaiKiniImbalan  = imbalanPensiun * faktorDiskontoVal

  // Atribusi DSAK IAI 2022
  const atribusi = hitungAtribusi(usiaMasuk, usiaSekarang, usiaPensiun)

  const nkkip     = nilaiKiniImbalan * atribusi.proporsi
  const biayaJasa = atribusi.masaKerjaAtribusi > 0
    ? nilaiKiniImbalan * atribusi.biayaJasaPerUnit
    : 0

  const detail: DetailPerUsia = {
    usia:               Math.floor(usiaPensiun),
    jenisKeluar:        'PENSIUN',
    masaKerja:          masaKerjaTotal,
    proyeksiUpah:       proyeksiUpahPensiun,
    faktorPSG:          faktorPSGPensiun,
    faktorUPMK:         faktorUPMKPensiun,
    proyeksiImbalan:    imbalanPensiun,
    peluang:            1,
    faktorDiskonto:     faktorDiskontoVal,
    nilaiKini:          nilaiKiniImbalan,
    usiaStartAtribusi:  atribusi.usiaStartAtribusi,
    masaKerjaAtribusi:  atribusi.masaKerjaAtribusi,
    mkAtribusiLalu:     atribusi.mkAtribusiLalu,
    proporsiAtribusi:   atribusi.proporsi,
    kontribusiNKKIP:    nkkip,
    kontribusiBiayaJasa: biayaJasa,
  }

  return {
    input,
    usiaSekarang,
    usiaMasuk,
    masaKerjaLalu,
    masaKerjaTotal,
    masaKerjaMendatang,
    usiaStartAtribusi:    atribusi.usiaStartAtribusi,
    masaKerjaAtribusiMax: atribusi.masaKerjaAtribusi,
    mkAtribusiLalu:       atribusi.mkAtribusiLalu,
    proyeksiUpahPensiun,
    faktorPSGPensiun,
    faktorUPMKPensiun,
    proyeksiImbalanPensiun: imbalanPensiun,
    nkkip,
    biayaJasaKini:  biayaJasa,
    biayaBunga:     0,
    nkkipPerJenis:      { PENSIUN: nkkip },
    biayaJasaPerJenis:  { PENSIUN: biayaJasa },
    details:            [detail],
    tabelProbabilitas:  [],
    metode:             'PUC_ECONOMIC',
  }
}
