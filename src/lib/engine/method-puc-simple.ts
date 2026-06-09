/**
 * METODE 2 — PUC TANPA ASUMSI EKONOMI (Contoh 3)
 * Proyeksi imbalan berdasarkan MK TOTAL saat pensiun, tapi gaji SAAT INI.
 * Tanpa diskonto. Atribusi sesuai DSAK IAI April 2022.
 *
 * Verifikasi (slide 27, Contoh 3):
 *   usia masuk 33, sekarang 43, pensiun 55, UUK
 *   MK total=22, MK lalu=10
 *   PSG(22)=9, UPMK(22)=8 → faktor=(2×9+1×8)×1.15=29.90
 *   startAtribusi=max(33,31)=33, atribusi=22, lalu=10
 *   NKKIP = 29.90 × (10/22) = 13.5909 × Upah ✓
 *   Biaya Jasa = 29.90 / 22 = 1.3591 × Upah ✓
 */

import type { InputPerhitungan, HasilPerhitungan, DetailPerUsia } from './types'
import { hitungImbalan } from './benefit'
import { getFaktorPSG, getFaktorUPMK } from './tables'
import { hitungAtribusi } from './attribution'

function parseDate(s: string): Date { return new Date(s + 'T00:00:00') }
function selisihTahun(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

export function hitungPUCSimple(input: InputPerhitungan): HasilPerhitungan {
  const { karyawan, tanggalPerhitungan, usiaPensiun, regulasi, formulaResign } = input

  const tglLahir  = parseDate(karyawan.tanggalLahir)
  const tglMasuk  = parseDate(karyawan.tanggalMasuk)
  const tglHitung = parseDate(tanggalPerhitungan)

  const usiaSekarang = selisihTahun(tglLahir, tglHitung)
  const usiaMasuk    = selisihTahun(tglLahir, tglMasuk)

  const masaKerjaLalu      = Math.round(selisihTahun(tglMasuk, tglHitung) * 10000) / 10000
  const masaKerjaTotal     = Math.round((usiaPensiun - usiaMasuk) * 10000) / 10000
  const masaKerjaMendatang = Math.max(0, usiaPensiun - usiaSekarang)

  const upah = karyawan.upahBulanan

  // Imbalan di usia pensiun: MK total, gaji SAAT INI (tidak naik)
  const imbalanPensiun  = hitungImbalan(masaKerjaTotal, upah, 'PENSIUN', regulasi, formulaResign.persentaseUPH)
  const faktorPSGPensiun  = getFaktorPSG(masaKerjaTotal)
  const faktorUPMKPensiun = getFaktorUPMK(masaKerjaTotal)

  // Atribusi DSAK IAI 2022
  const atribusi = hitungAtribusi(usiaMasuk, usiaSekarang, usiaPensiun)

  // Diskonto = 0 → nilaiKini = proyeksiImbalan
  const nkkip     = imbalanPensiun * atribusi.proporsi
  const biayaJasa = atribusi.masaKerjaAtribusi > 0
    ? imbalanPensiun * atribusi.biayaJasaPerUnit
    : 0

  const detail: DetailPerUsia = {
    usia:               Math.floor(usiaSekarang),
    jenisKeluar:        'PENSIUN',
    masaKerja:          masaKerjaTotal,
    proyeksiUpah:       upah,
    faktorPSG:          faktorPSGPensiun,
    faktorUPMK:         faktorUPMKPensiun,
    proyeksiImbalan:    imbalanPensiun,
    peluang:            1,
    faktorDiskonto:     1,
    nilaiKini:          imbalanPensiun,
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
    proyeksiUpahPensiun:  upah,
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
    metode:             'PUC_SIMPLE',
  }
}
