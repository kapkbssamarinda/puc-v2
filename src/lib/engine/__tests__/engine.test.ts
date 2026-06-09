/**
 * Unit test engine PUC — gunakan Jest atau Vitest
 *
 * Jalankan: npx vitest run  (setelah: npm install -D vitest)
 * Atau:     npx jest        (setelah: npm install -D jest ts-jest @types/jest)
 */

import { describe, it, expect } from 'vitest'
import { getFaktorPSG, getFaktorUPMK } from '../tables'
import { hitungAtribusi } from '../attribution'
import { hitung } from '../index'
import type { InputPerhitungan } from '../types'

// ─── Helpers ─────────────────────────────────────────────
function inputContoh4(): InputPerhitungan {
  return {
    karyawan: {
      id: 'c4', nama: 'Contoh 4', jenisKelamin: 'L',
      tanggalLahir: '1974-01-01',
      tanggalMasuk:  '2018-01-01',
      upahBulanan:   10_000,
    },
    tanggalPerhitungan: '2024-01-01',
    usiaPensiun:   55,
    regulasi:      'UUK_13_2003',
    metode:        'PUC_ECONOMIC',
    asumsiEkonomi: { tingkatDiskonto: 0.07, tingkatKenaikanGaji: 0.05 },
    asumsiDemografi: { tingkatPengunduranDiri: 0.02, tingkatCacat: 0, gunakanMortalita: false },
    jenisImbalanDihitung: ['PENSIUN'],
    formulaResign: { persentaseUPH: 0.15 },
  }
}

function inputContoh5(): InputPerhitungan {
  return {
    karyawan: {
      id: 'c5', nama: 'Contoh 5', jenisKelamin: 'L',
      tanggalLahir: '1974-01-01',
      tanggalMasuk:  '2018-01-01',
      upahBulanan:   10_000,
    },
    tanggalPerhitungan: '2024-01-01',
    usiaPensiun:   55,
    regulasi:      'UUK_13_2003',
    metode:        'PUC_FULL',
    asumsiEkonomi: { tingkatDiskonto: 0.07, tingkatKenaikanGaji: 0.05 },
    asumsiDemografi: { tingkatPengunduranDiri: 0.02, tingkatCacat: 0, gunakanMortalita: false },
    jenisImbalanDihitung: ['PENSIUN', 'MENGUNDURKAN_DIRI'],
    formulaResign: { persentaseUPH: 0.15 },
  }
}

// ─── Helper builder asumsi ───────────────────────────────
function buildInput(overrides: {
  metode?: InputPerhitungan['metode']
  tingkatDiskonto?: number
  tingkatKenaikanGaji?: number
  tingkatPengunduranDiri?: number
  tingkatCacat?: number
}): InputPerhitungan {
  return {
    karyawan: {
      id: 'val-test', nama: 'Validasi', jenisKelamin: 'L',
      tanggalLahir: '1974-01-01',
      tanggalMasuk:  '2018-01-01',
      upahBulanan:   10_000,
    },
    tanggalPerhitungan: '2024-01-01',
    usiaPensiun:   55,
    regulasi:      'UUK_13_2003',
    metode:        overrides.metode ?? 'PUC_ECONOMIC',
    asumsiEkonomi: {
      tingkatDiskonto:    overrides.tingkatDiskonto    ?? 0.07,
      tingkatKenaikanGaji: overrides.tingkatKenaikanGaji ?? 0.05,
    },
    asumsiDemografi: {
      tingkatPengunduranDiri: overrides.tingkatPengunduranDiri ?? 0.02,
      tingkatCacat:           overrides.tingkatCacat           ?? 0,
      gunakanMortalita:       false,
    },
    jenisImbalanDihitung: ['PENSIUN'],
    formulaResign: { persentaseUPH: 0.15 },
  }
}

// ─── Test: validasiInput — asumsi ekonomi ─────────────────
describe('validasiInput — asumsi ekonomi', () => {
  it('diskonto 0 → error berisi "tingkatDiskonto"', () => {
    expect(() => hitung(buildInput({ tingkatDiskonto: 0 }))).toThrow(/tingkatDiskonto/)
  })

  it('diskonto 0.5 (50%) → error berisi "tingkatDiskonto"', () => {
    expect(() => hitung(buildInput({ tingkatDiskonto: 0.5 }))).toThrow(/tingkatDiskonto/)
  })

  it('diskonto 0.07 (7%) → valid, tidak throw', () => {
    expect(() => hitung(buildInput({ tingkatDiskonto: 0.07 }))).not.toThrow()
  })

  it('diskonto < kenaikanGaji → warning "Peringatan:" masuk ke error', () => {
    expect(() => hitung(buildInput({ tingkatDiskonto: 0.04, tingkatKenaikanGaji: 0.07 }))).toThrow(/Peringatan:/)
  })

  it('kenaikanGaji 0.35 (35%) → error berisi "tingkatKenaikanGaji"', () => {
    expect(() => hitung(buildInput({ tingkatKenaikanGaji: 0.35 }))).toThrow(/tingkatKenaikanGaji/)
  })
})

// ─── Test: validasiInput — asumsi demografi (PUC_FULL) ───
describe('validasiInput — asumsi demografi (PUC_FULL)', () => {
  it('resignasi 1.5 (150%) → error berisi "tingkatPengunduranDiri"', () => {
    expect(() => hitung(buildInput({ metode: 'PUC_FULL', tingkatPengunduranDiri: 1.5 }))).toThrow(/tingkatPengunduranDiri/)
  })

  it('resignasi 0.02 (2%) → valid, tidak throw', () => {
    expect(() => hitung(buildInput({ metode: 'PUC_FULL', tingkatPengunduranDiri: 0.02 }))).not.toThrow()
  })

  it('total resign + cacat > 50% → error berisi "Total"', () => {
    // 0.45 + 0.08 = 0.53 > 0.50; keduanya lolos validasi individual
    expect(() => hitung(buildInput({ metode: 'PUC_FULL', tingkatPengunduranDiri: 0.45, tingkatCacat: 0.08 }))).toThrow(/Total/)
  })

  it('cacat 0.15 (15%) → error berisi "tingkatCacat"', () => {
    expect(() => hitung(buildInput({ metode: 'PUC_FULL', tingkatCacat: 0.15 }))).toThrow(/tingkatCacat/)
  })

  it('validasi demografi TIDAK aktif untuk PUC_ECONOMIC', () => {
    // resign 0.40 di PUC_ECONOMIC tidak divalidasi — hanya ekonomi yang dicek
    expect(() => hitung(buildInput({ metode: 'PUC_ECONOMIC', tingkatPengunduranDiri: 0.40 }))).not.toThrow()
  })
})

// ─── Test 1: Tabel PSG ────────────────────────────────────
// Cap PSG adalah MK≥8 (bukan MK≥9) — sesuai PP 35/2021 Pasal 40 ayat 2.
// Beberapa materi pelatihan mencantumkan "MK≥9 → 9" (typo ringkasan);
// baris sebelumnya "7≤MK<8 → 8" membuktikan MK=8 sudah mendapat 9 bulan.
describe('getFaktorPSG', () => {
  it.each([
    [0.5,  1],  // MK < 1 → 1 bulan
    [1,    2],  // 1≤MK<2 → 2 bulan
    [3,    4],  // 3≤MK<4 → 4 bulan
    [7.0,  8],  // tepat 7 tahun → 8 bulan
    [7.9,  8],  // 7 tahun 11 bulan → masih 8 bulan
    [8.0,  9],  // tepat 8 tahun → 9 bulan (cap, bukan 9 tahun)
    [8.5,  9],  // 8.5 tahun → 9 bulan (cap)
    [11,   9],  // 11 tahun → 9 bulan (cap, tidak bertambah)
    [24,   9],  // 24 tahun → 9 bulan (cap PSG, berbeda dengan UPMK)
  ])('MK=%f → %i bulan', (mk, expected) => {
    expect(getFaktorPSG(mk)).toBe(expected)
  })
})

// ─── Test 2: Tabel UPMK ──────────────────────────────────
describe('getFaktorUPMK', () => {
  it.each([
    [2,   0],
    [3,   2],
    [5,   2],
    [6,   3],
    [10,  4],
    [21,  8],
    [24, 10],
    [30, 10],
  ])('MK=%f → %i bulan', (mk, expected) => {
    expect(getFaktorUPMK(mk)).toBe(expected)
  })
})

// ─── Test 3: Contoh 4 (PUC_ECONOMIC) ─────────────────────
describe('hitungPUCEconomic — Contoh 4 (slide 44)', () => {
  it('NKKIP ≈ 125.576 ribuan (±5)', () => {
    const hasil = hitung(inputContoh4())
    expect(hasil.nkkip).toBeGreaterThan(125_000 - 5_000)
    expect(hasil.nkkip).toBeLessThan(125_000 + 5_000)
  })

  it('Biaya Jasa ≈ 20.929 ribuan (±2)', () => {
    const hasil = hitung(inputContoh4())
    expect(hasil.biayaJasaKini).toBeGreaterThan(20_000 - 2_000)
    expect(hasil.biayaJasaKini).toBeLessThan(20_000 + 2_000)
  })
})

// ─── Test 4 & 5: Contoh 5 (PUC_FULL) ────────────────────
describe('hitungPUCFull — Contoh 5 (slide 55–64)', () => {
  it('NKKIP total ≈ 114.764 ribuan (±50)', () => {
    const hasil = hitung(inputContoh5())
    expect(hasil.nkkip).toBeGreaterThan(114_764 - 50_000)
    expect(hasil.nkkip).toBeLessThan(114_764 + 50_000)
  })

  it('NKKIP resign total ≈ 1.253 ribuan (±150)', () => {
    const hasil = hitung(inputContoh5())
    const nkkipResign = hasil.nkkipPerJenis['MENGUNDURKAN_DIRI'] ?? 0
    expect(nkkipResign).toBeGreaterThan(1_100)
    expect(nkkipResign).toBeLessThan(1_400)
  })

  it('Biaya Jasa pensiun ≈ 18.918 ribuan (±5)', () => {
    const hasil = hitung(inputContoh5())
    const bjPensiun = hasil.biayaJasaPerJenis['PENSIUN'] ?? 0
    expect(bjPensiun).toBeGreaterThan(18_918 - 5_000)
    expect(bjPensiun).toBeLessThan(18_918 + 5_000)
  })
})

// ─── Test 6: Contoh 5 — resign NKKIP per usia (PDF slide 63) ─
describe('Contoh 5 — resign NKKIP per usia matches PDF slide 63', () => {
  const pdfExpected: Record<number, number> = { 50: 300, 51: 272, 52: 250, 53: 231, 54: 200 }

  it.each(Object.entries(pdfExpected))('Usia %s resign NKKIP ≈ %s (±30)', (usiaStr, expected) => {
    const hasil = hitung(inputContoh5())
    const detail = hasil.details.find(
      d => d.usia === Number(usiaStr) && d.jenisKeluar === 'MENGUNDURKAN_DIRI'
    )
    expect(detail).toBeDefined()
    expect(detail!.kontribusiNKKIP).toBeGreaterThan(Number(expected) - 30)
    expect(detail!.kontribusiNKKIP).toBeLessThan(Number(expected) + 30)
  })
})

// ─── Test 7: Atribusi — karyawan muda (slide 86 karyawan A) ─
describe('Atribusi DSAK IAI 2022 — karyawan di luar jendela atribusi', () => {
  it('NKKIP = 0 untuk karyawan masuk usia 20, sekarang 25, pensiun 55', () => {
    const atribusi = hitungAtribusi(20, 25, 55)
    expect(atribusi.mkAtribusiLalu).toBe(0)
    expect(atribusi.proporsi).toBe(0)
  })

  it('PUC_ECONOMIC mengembalikan nkkip=0 untuk karyawan tersebut', () => {
    const inp: InputPerhitungan = {
      karyawan: {
        id: 'muda', nama: 'Karyawan Muda', jenisKelamin: 'L',
        tanggalLahir: '1999-01-01',
        tanggalMasuk:  '2019-01-01',
        upahBulanan:   5_000_000,
      },
      tanggalPerhitungan: '2024-01-01',
      usiaPensiun:   55,
      regulasi:      'UUK_13_2003',
      metode:        'PUC_ECONOMIC',
      asumsiEkonomi: { tingkatDiskonto: 0.07, tingkatKenaikanGaji: 0.05 },
      asumsiDemografi: { tingkatPengunduranDiri: 0, tingkatCacat: 0, gunakanMortalita: false },
      jenisImbalanDihitung: ['PENSIUN'],
      formulaResign: { persentaseUPH: 0.15 },
    }
    const hasil = hitung(inp)
    expect(hasil.nkkip).toBe(0)
  })
})

// ─── Test: Past Service Cost (PSC) ───────────────────────
describe('Past Service Cost — perubahan regulasi UUK → UUCK', () => {
  function baseInput(regulasi: 'UUK_13_2003' | 'UUCK_PP35'): InputPerhitungan {
    return {
      karyawan: {
        id: 'psc-test', nama: 'Karyawan PSC', jenisKelamin: 'L',
        tanggalLahir: '1974-01-01',
        tanggalMasuk:  '2018-01-01',
        upahBulanan:   10_000,
      },
      tanggalPerhitungan: '2024-01-01',
      usiaPensiun:   55,
      regulasi,
      metode:        'PUC_ECONOMIC',
      asumsiEkonomi: { tingkatDiskonto: 0.07, tingkatKenaikanGaji: 0.05 },
      asumsiDemografi: { tingkatPengunduranDiri: 0, tingkatCacat: 0, gunakanMortalita: false },
      jenisImbalanDihitung: ['PENSIUN'],
      formulaResign: { persentaseUPH: 0.15 },
    }
  }

  it('PSC via nkkipSebelum langsung = selisih NKKIP dua regulasi', () => {
    const hasilUUK  = hitung(baseInput('UUK_13_2003'))
    const hasilUUCK = hitung({
      ...baseInput('UUCK_PP35'),
      perubahanProgram: { aktif: true, nkkipSebelum: hasilUUK.nkkip },
    })
    expect(hasilUUCK.biayaJasaLalu).toBeDefined()
    expect(hasilUUCK.biayaJasaLalu!).toBeCloseTo(hasilUUCK.nkkip - hasilUUK.nkkip, 0)
    // UUCK lebih rendah dari UUK → PSC negatif (penurunan kewajiban)
    expect(hasilUUCK.biayaJasaLalu!).toBeLessThan(0)
  })

  it('PSC via regulasiSebelum otomatis = PSC via nkkipSebelum langsung', () => {
    const hasilUUK = hitung(baseInput('UUK_13_2003'))
    const pscLangsung = hitung({
      ...baseInput('UUCK_PP35'),
      perubahanProgram: { aktif: true, nkkipSebelum: hasilUUK.nkkip },
    })
    const pscOtomatis = hitung({
      ...baseInput('UUCK_PP35'),
      perubahanProgram: { aktif: true, regulasiSebelum: 'UUK_13_2003' },
    })
    expect(pscOtomatis.biayaJasaLalu).toBeDefined()
    expect(pscOtomatis.biayaJasaLalu!).toBeCloseTo(pscLangsung.biayaJasaLalu!, 0)
    expect(pscOtomatis.nkkipSebelumPerubahan!).toBeCloseTo(hasilUUK.nkkip, 0)
  })

  it('tanpa perubahanProgram → biayaJasaLalu = undefined', () => {
    expect(hitung(baseInput('UUCK_PP35')).biayaJasaLalu).toBeUndefined()
  })
})

// ─── Test: Rekonsiliasi NKKIP ────────────────────────────
describe('Rekonsiliasi NKKIP', () => {
  it('menghitung nkkipAkhir dengan benar dari semua komponen', () => {
    const input: InputPerhitungan = {
      ...inputContoh4(),
      rekonsiliasiInput: {
        nkkipAwalPeriode:           100_000,
        pembayaranImbalanPeriode:   5_000,
        keuntunganKerugianAktuaria: -3_000,  // keuntungan → mengurangi NKKIP
      },
    }
    const hasil = hitung(input)

    expect(hasil.rekonsiliasi).toBeDefined()
    const r = hasil.rekonsiliasi!

    // Komponen harus tersimpan dengan benar
    expect(r.nkkipAwal).toBe(100_000)
    expect(r.pembayaranImbalan).toBe(5_000)
    expect(r.keuntunganKerugianAktuaria).toBe(-3_000)
    expect(r.biayaJasaKini).toBeCloseTo(hasil.biayaJasaKini, 2)

    // IC dihitung dari nkkipAwal rekonsiliasi
    const expectedIC = input.asumsiEkonomi.tingkatDiskonto * 100_000
    expect(r.biayaBunga).toBeCloseTo(expectedIC, 2)

    // nkkipAkhir = nkkipAwal + BJK + Bunga + PSC + GL - Pembayaran
    const expectedAkhir =
      100_000 + hasil.biayaJasaKini + expectedIC + (hasil.biayaJasaLalu ?? 0) + (-3_000) - 5_000
    expect(r.nkkipAkhir).toBeCloseTo(expectedAkhir, 2)
    expect(r.nkkipAkhir).toBeGreaterThan(0)
  })
})
