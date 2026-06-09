/**
 * METODE 1 — LIQUIDATION BASIS (slide 75, kolom kiri "Perhitungan Paling Sederhana")
 * Diasumsikan perusahaan tutup pada tanggal perhitungan.
 * Tidak ada proyeksi: gaji SAAT INI, MK SAAT INI, tanpa diskonto.
 * Berbeda dari Contoh 3 (PUC_SIMPLE) yang masih memperhitungkan MK total ke pensiun.
 */

import type { InputPerhitungan, HasilPerhitungan, DetailPerUsia } from './types'
import { hitungImbalan } from './benefit'
import { getFaktorPSG, getFaktorUPMK } from './tables'
import { hitungAtribusi } from './attribution'

function parseDate(s: string): Date { return new Date(s + 'T00:00:00') }
function selisihTahun(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

export function hitungLiquidation(input: InputPerhitungan): HasilPerhitungan {
  const { karyawan, tanggalPerhitungan, usiaPensiun, regulasi, formulaResign } = input

  const tglLahir    = parseDate(karyawan.tanggalLahir)
  const tglMasuk    = parseDate(karyawan.tanggalMasuk)
  const tglHitung   = parseDate(tanggalPerhitungan)

  const usiaSekarang = selisihTahun(tglLahir, tglHitung)
  const usiaMasuk    = selisihTahun(tglLahir, tglMasuk)

  const masaKerjaLalu      = Math.round(selisihTahun(tglMasuk, tglHitung) * 10000) / 10000
  const masaKerjaTotal     = usiaPensiun - usiaMasuk
  const masaKerjaMendatang = Math.max(0, usiaPensiun - usiaSekarang)

  // Liquidation: gaji & MK SAAT INI, gunakan formula PENSIUN
  const upah     = karyawan.upahBulanan
  const imbalan  = hitungImbalan(masaKerjaLalu, upah, 'PENSIUN', regulasi, formulaResign.persentaseUPH)

  const faktorPSGPensiun  = getFaktorPSG(masaKerjaLalu)
  const faktorUPMKPensiun = getFaktorUPMK(masaKerjaLalu)

  // Atribusi: pada liquidation, proporsi selalu 1.0 (MK total = MK lalu)
  const atribusi = hitungAtribusi(usiaMasuk, usiaSekarang, usiaPensiun)
  // Override: paksa proporsi 1 karena kita pakai MK saat ini sebagai total
  const nkkip       = imbalan
  const biayaJasa   = masaKerjaLalu > 0 ? imbalan / masaKerjaLalu : 0

  const detail: DetailPerUsia = {
    usia:               Math.floor(usiaSekarang),
    jenisKeluar:        'PENSIUN',
    masaKerja:          masaKerjaLalu,
    proyeksiUpah:       upah,
    faktorPSG:          faktorPSGPensiun,
    faktorUPMK:         faktorUPMKPensiun,
    proyeksiImbalan:    imbalan,
    peluang:            1,
    faktorDiskonto:     1,
    nilaiKini:          imbalan,
    usiaStartAtribusi:  atribusi.usiaStartAtribusi,
    masaKerjaAtribusi:  masaKerjaLalu,
    mkAtribusiLalu:     masaKerjaLalu,
    proporsiAtribusi:   1,
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
    masaKerjaAtribusiMax: Math.min(masaKerjaTotal, 24),
    mkAtribusiLalu:       atribusi.mkAtribusiLalu,
    proyeksiUpahPensiun:  upah,
    faktorPSGPensiun,
    faktorUPMKPensiun,
    proyeksiImbalanPensiun: imbalan,
    nkkip,
    biayaJasaKini:  biayaJasa,
    biayaBunga:     0,
    nkkipPerJenis:       { PENSIUN: nkkip },
    biayaJasaPerJenis:   { PENSIUN: biayaJasa },
    details:             [detail],
    tabelProbabilitas:   [],
    metode:              'LIQUIDATION',
  }
}
