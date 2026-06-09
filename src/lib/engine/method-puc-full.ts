/**
 * METODE 4 — PUC KOMPREHENSIF (Contoh 5)
 * Setiap usia: imbalan × probabilitas × diskonto × atribusi.
 * Memperhitungkan semua jenis keluar (resign, meninggal, cacat, pensiun).
 *
 * Verifikasi (slide 55–64, Contoh 5):
 *   usia masuk 44, sekarang 50, pensiun 55, UUCK, resign 2%
 *   upah=10.000 (ribuan), diskonto=7%, kenaikan gaji=5%
 *
 *   Pensiun (n=5): peluang=0.90392, imbalan=322.899, nilaiKini=208.103
 *     NKKIP pensiun = 208.103 × 6/11 = 113.511 ✓
 *   Resign usia 54 (n=4): peluang=0.01845, imbalan=23.702, nilaiKini=0.334
 *     Kontribusi NKKIP = 0.334 × 6/10 = 0.200 (×ribuan = 200) ✓
 *   Total NKKIP = 114.764 ✓
 *   Total Biaya Jasa = 19.127 ✓
 */

import type {
  InputPerhitungan, HasilPerhitungan, DetailPerUsia,
  JenisKeluar, ProbabilitasOlahan,
} from './types'
import { hitungImbalan, proyeksikanUpah, hitungFaktorDiskonto } from './benefit'
import { getFaktorPSG, getFaktorUPMK } from './tables'
import { hitungAtribusi } from './attribution'
import { buatTabelProbabilitas } from './probability'

function parseDate(s: string): Date { return new Date(s + 'T00:00:00') }
function selisihTahun(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

export function hitungPUCFull(input: InputPerhitungan): HasilPerhitungan {
  const {
    karyawan, tanggalPerhitungan, usiaPensiun,
    regulasi, asumsiEkonomi, asumsiDemografi,
    jenisImbalanDihitung, formulaResign,
  } = input

  const tglLahir  = parseDate(karyawan.tanggalLahir)
  const tglMasuk  = parseDate(karyawan.tanggalMasuk)
  const tglHitung = parseDate(tanggalPerhitungan)

  const usiaSekarang = selisihTahun(tglLahir, tglHitung)
  const usiaMasuk    = selisihTahun(tglLahir, tglMasuk)

  const masaKerjaLalu      = selisihTahun(tglMasuk, tglHitung)
  const masaKerjaTotal     = usiaPensiun - usiaMasuk
  const masaKerjaMendatang = Math.max(0, usiaPensiun - usiaSekarang)

  const { tingkatDiskonto, tingkatKenaikanGaji } = asumsiEkonomi
  const upah          = karyawan.upahBulanan
  const usiaAwalInt   = Math.ceil(usiaSekarang)

  // Tabel probabilitas olahan
  const tabelProbabilitas = buatTabelProbabilitas(
    usiaSekarang, usiaPensiun, karyawan.jenisKelamin, asumsiDemografi
  )

  // Indeks tabel by usia
  const probByUsia = new Map<number, ProbabilitasOlahan>()
  for (const row of tabelProbabilitas) probByUsia.set(row.usia, row)

  const details: DetailPerUsia[] = []
  const nkkipPerJenis: Partial<Record<JenisKeluar, number>> = {}
  const biayaJasaPerJenis: Partial<Record<JenisKeluar, number>> = {}

  // Helper untuk akumulasi
  function tambah(map: Partial<Record<JenisKeluar, number>>, k: JenisKeluar, v: number) {
    map[k] = (map[k] ?? 0) + v
  }

  // Iterasi per usia
  for (let usia = usiaAwalInt; usia <= usiaPensiun; usia++) {
    const n    = usia - usiaSekarang         // tahun dari sekarang
    const prob = probByUsia.get(usia)
    if (!prob) continue

    const proyeksiUpahX   = proyeksikanUpah(upah, tingkatKenaikanGaji, n)
    const faktorDiskontoX = hitungFaktorDiskonto(tingkatDiskonto, n)
    const mkX             = Math.round((masaKerjaLalu + n) * 10000) / 10000  // MK pada usia x

    // Pasangan (jenis keluar, peluang) yang relevan untuk usia ini
    type KejadianEntry = { jenis: JenisKeluar; peluang: number }
    const kejadian: KejadianEntry[] = []

    if (usia === usiaPensiun) {
      if (jenisImbalanDihitung.includes('PENSIUN')) {
        kejadian.push({ jenis: 'PENSIUN', peluang: prob.peluangPensiun })
      }
    } else {
      if (jenisImbalanDihitung.includes('MENGUNDURKAN_DIRI') && prob.peluangUndurDiri > 0) {
        kejadian.push({ jenis: 'MENGUNDURKAN_DIRI', peluang: prob.peluangUndurDiri })
      }
      if (jenisImbalanDihitung.includes('MENINGGAL') && prob.peluangMeninggal > 0) {
        kejadian.push({ jenis: 'MENINGGAL', peluang: prob.peluangMeninggal })
      }
      if (jenisImbalanDihitung.includes('CACAT') && prob.peluangCacat > 0) {
        kejadian.push({ jenis: 'CACAT', peluang: prob.peluangCacat })
      }
    }

    for (const { jenis, peluang } of kejadian) {
      if (peluang <= 0) continue

      const imbalanX = hitungImbalan(mkX, proyeksiUpahX, jenis, regulasi, formulaResign.persentaseUPH)
      if (imbalanX <= 0) continue

      const nilaiKiniX = peluang * imbalanX * faktorDiskontoX

      // Atribusi: endpoint = usia keluar (bukan usia pensiun, untuk keluar dini)
      const atribusi = hitungAtribusi(usiaMasuk, usiaSekarang, usiaPensiun, usia)

      const kontribusiNKKIP    = nilaiKiniX * atribusi.proporsi
      const kontribusiBiayaJasa = atribusi.masaKerjaAtribusi > 0
        ? nilaiKiniX * atribusi.biayaJasaPerUnit
        : 0

      details.push({
        usia,
        jenisKeluar:        jenis,
        masaKerja:          mkX,
        proyeksiUpah:       proyeksiUpahX,
        faktorPSG:          getFaktorPSG(mkX),
        faktorUPMK:         getFaktorUPMK(mkX),
        proyeksiImbalan:    imbalanX,
        peluang,
        faktorDiskonto:     faktorDiskontoX,
        nilaiKini:          nilaiKiniX,
        usiaStartAtribusi:  atribusi.usiaStartAtribusi,
        masaKerjaAtribusi:  atribusi.masaKerjaAtribusi,
        mkAtribusiLalu:     atribusi.mkAtribusiLalu,
        proporsiAtribusi:   atribusi.proporsi,
        kontribusiNKKIP,
        kontribusiBiayaJasa,
      })

      tambah(nkkipPerJenis, jenis, kontribusiNKKIP)
      tambah(biayaJasaPerJenis, jenis, kontribusiBiayaJasa)
    }
  }

  const nkkip     = Object.values(nkkipPerJenis).reduce((s, v) => s + v, 0)
  const biayaJasa = Object.values(biayaJasaPerJenis).reduce((s, v) => s + v, 0)

  // Proyeksi pensiun (untuk display)
  const proyeksiUpahPensiun   = proyeksikanUpah(upah, tingkatKenaikanGaji, masaKerjaMendatang)
  const imbalanPensiun        = hitungImbalan(masaKerjaTotal, proyeksiUpahPensiun, 'PENSIUN', regulasi, formulaResign.persentaseUPH)
  const faktorPSGPensiun      = getFaktorPSG(masaKerjaTotal)
  const faktorUPMKPensiun     = getFaktorUPMK(masaKerjaTotal)
  const atribusiPensiun       = hitungAtribusi(usiaMasuk, usiaSekarang, usiaPensiun)

  return {
    input,
    usiaSekarang,
    usiaMasuk,
    masaKerjaLalu,
    masaKerjaTotal,
    masaKerjaMendatang,
    usiaStartAtribusi:    atribusiPensiun.usiaStartAtribusi,
    masaKerjaAtribusiMax: atribusiPensiun.masaKerjaAtribusi,
    mkAtribusiLalu:       atribusiPensiun.mkAtribusiLalu,
    proyeksiUpahPensiun,
    faktorPSGPensiun,
    faktorUPMKPensiun,
    proyeksiImbalanPensiun: imbalanPensiun,
    nkkip,
    biayaJasaKini:  biayaJasa,
    biayaBunga:     0,
    nkkipPerJenis,
    biayaJasaPerJenis,
    details,
    tabelProbabilitas,
    metode: 'PUC_FULL',
  }
}
