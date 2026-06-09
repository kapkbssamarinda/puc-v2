// ─── Domain Fondasi ───────────────────────────────────────
export * from './types'
export * from './tables'
export * from './benefit'
export * from './attribution'
export * from './probability'

// ─── Konstanta Skalar ─────────────────────────────────────
export {
  USIA_PENSIUN_DEFAULT,
  DEFAULT_TINGKAT_DISKONTO,
  DEFAULT_TINGKAT_KENAIKAN_GAJI,
  DEFAULT_TINGKAT_PENGUNDURAN_DIRI,
} from './constants'

// ─── Metode Perhitungan ───────────────────────────────────
export { hitungLiquidation }   from './method-liquidation'
export { hitungPUCSimple }     from './method-puc-simple'
export { hitungPUCEconomic }   from './method-puc-economic'
export { hitungPUCFull }       from './method-puc-full'

// ─── API Utama ────────────────────────────────────────────
import type { InputPerhitungan, HasilPerhitungan, HasilBatch, InputEstimasi, JenisKeluar } from './types'
import { hitungLiquidation } from './method-liquidation'
import { hitungPUCSimple }   from './method-puc-simple'
import { hitungPUCEconomic } from './method-puc-economic'
import { hitungPUCFull }     from './method-puc-full'

function parseDate(s: string): Date { return new Date(s + 'T00:00:00') }
function selisihTahun(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

/** Validasi input dan kembalikan pesan error (array kosong = valid). */
function validasiInput(input: InputPerhitungan): string[] {
  const errors: string[] = []
  const { karyawan, tanggalPerhitungan, usiaPensiun } = input

  const tglLahir  = parseDate(karyawan.tanggalLahir)
  const tglMasuk  = parseDate(karyawan.tanggalMasuk)
  const tglHitung = parseDate(tanggalPerhitungan)

  if (isNaN(tglLahir.getTime()))  errors.push('tanggalLahir tidak valid')
  if (isNaN(tglMasuk.getTime()))  errors.push('tanggalMasuk tidak valid')
  if (isNaN(tglHitung.getTime())) errors.push('tanggalPerhitungan tidak valid')

  if (errors.length > 0) return errors

  const usiaMasukThn = selisihTahun(tglLahir, tglMasuk)
  if (usiaMasukThn < 15) errors.push('Usia masuk kerja minimal 15 tahun')

  const usiaSekarang = selisihTahun(tglLahir, tglHitung)
  if (tglMasuk >= tglHitung) errors.push('tanggalMasuk harus sebelum tanggalPerhitungan')
  if (usiaSekarang >= usiaPensiun) errors.push('Karyawan sudah melewati usia pensiun')
  if (usiaPensiun < 45 || usiaPensiun > 65) errors.push('Usia pensiun harus 45–65 tahun')
  if (karyawan.upahBulanan <= 0) errors.push('upahBulanan harus > 0')

  // ── Validasi asumsi ekonomi (semua metode kecuali LIQUIDATION) ──
  if (input.metode !== 'LIQUIDATION') {
    const { tingkatDiskonto, tingkatKenaikanGaji } = input.asumsiEkonomi

    const diskontoPct = (tingkatDiskonto * 100).toFixed(2)
    if (tingkatDiskonto < 0.001 || tingkatDiskonto > 0.30) {
      errors.push(`tingkatDiskonto harus antara 0.1% dan 30% (saat ini: ${diskontoPct}%)`)
    }

    const kenaikanPct = (tingkatKenaikanGaji * 100).toFixed(2)
    if (tingkatKenaikanGaji < 0 || tingkatKenaikanGaji > 0.30) {
      errors.push(`tingkatKenaikanGaji harus antara 0% dan 30% (saat ini: ${kenaikanPct}%)`)
    }

    if (tingkatDiskonto >= 0.001 && tingkatDiskonto <= 0.30 &&
        tingkatKenaikanGaji >= 0 && tingkatKenaikanGaji <= 0.30 &&
        tingkatDiskonto <= tingkatKenaikanGaji) {
      errors.push(
        `Peringatan: Tingkat diskonto (${diskontoPct}%) harus lebih besar dari kenaikan gaji (${kenaikanPct}%) — present value akan melebihi nominal`
      )
    }
  }

  // ── Validasi asumsi demografi (hanya PUC_FULL) ──
  if (input.metode === 'PUC_FULL') {
    const { tingkatPengunduranDiri, tingkatCacat } = input.asumsiDemografi

    const resignPct = (tingkatPengunduranDiri * 100).toFixed(2)
    if (tingkatPengunduranDiri < 0 || tingkatPengunduranDiri > 0.50) {
      errors.push(`tingkatPengunduranDiri melebihi 50% per tahun — periksa kembali input (saat ini: ${resignPct}%)`)
    }

    const cacatPct = (tingkatCacat * 100).toFixed(2)
    if (tingkatCacat < 0 || tingkatCacat > 0.10) {
      errors.push(`tingkatCacat harus antara 0% dan 10% per tahun (saat ini: ${cacatPct}%)`)
    }

    if (tingkatPengunduranDiri >= 0 && tingkatPengunduranDiri <= 0.50 &&
        tingkatCacat >= 0 && tingkatCacat <= 0.10 &&
        tingkatPengunduranDiri + tingkatCacat > 0.50) {
      const totalPct = ((tingkatPengunduranDiri + tingkatCacat) * 100).toFixed(2)
      errors.push(`Total tingkatPengunduranDiri + tingkatCacat (${totalPct}%) tidak boleh melebihi 50%`)
    }
  }

  return errors
}

/**
 * Hitung kewajiban imbalan pasca kerja untuk satu karyawan.
 * Otomatis dispatch ke metode yang dipilih di input.metode.
 *
 * @throws Error jika input tidak valid
 */
export function hitung(input: InputPerhitungan): HasilPerhitungan {
  const errors = validasiInput(input)
  if (errors.length > 0) throw new Error(`Input tidak valid: ${errors.join('; ')}`)

  let hasil: HasilPerhitungan
  switch (input.metode) {
    case 'LIQUIDATION':  hasil = hitungLiquidation(input); break
    case 'PUC_SIMPLE':   hasil = hitungPUCSimple(input);   break
    case 'PUC_ECONOMIC': hasil = hitungPUCEconomic(input); break
    case 'PUC_FULL':     hasil = hitungPUCFull(input);     break
  }

  // IC = r_diskonto × NKKIP_awal_periode (PSAK 24 par. 120)
  // rekonsiliasiInput.nkkipAwalPeriode digunakan sebagai fallback jika input.nkkipAwalPeriode tidak diisi
  const nkkipAwalIC =
    (input.nkkipAwalPeriode && input.nkkipAwalPeriode > 0 ? input.nkkipAwalPeriode : null) ??
    (input.rekonsiliasiInput?.nkkipAwalPeriode && input.rekonsiliasiInput.nkkipAwalPeriode > 0
      ? input.rekonsiliasiInput.nkkipAwalPeriode
      : null)
  if (nkkipAwalIC && (input.metode === 'PUC_ECONOMIC' || input.metode === 'PUC_FULL')) {
    hasil.biayaBunga = input.asumsiEkonomi.tingkatDiskonto * nkkipAwalIC
  }

  // PSC = NKKIP_baru - NKKIP_lama (PSAK 24 par. 100-101)
  if (input.perubahanProgram?.aktif) {
    const pp = input.perubahanProgram
    if (pp.nkkipSebelum !== undefined) {
      hasil.biayaJasaLalu = hasil.nkkip - pp.nkkipSebelum
      hasil.nkkipSebelumPerubahan = pp.nkkipSebelum
    } else if (pp.regulasiSebelum !== undefined || pp.persentaseUPHSebelum !== undefined) {
      const inputLama: InputPerhitungan = {
        ...input,
        regulasi:      pp.regulasiSebelum ?? input.regulasi,
        formulaResign: { persentaseUPH: pp.persentaseUPHSebelum ?? input.formulaResign.persentaseUPH },
        perubahanProgram: undefined,
      }
      try {
        const hasilLama = hitung(inputLama)
        hasil.biayaJasaLalu = hasil.nkkip - hasilLama.nkkip
        hasil.nkkipSebelumPerubahan = hasilLama.nkkip
      } catch {
        // Jika kalkulasi lama gagal, lewati PSC
      }
    }
  }

  // Rekonsiliasi NKKIP = nkkipAwal + BJK + Bunga + PSC + GL − Pembayaran (PSAK 24)
  const ri = input.rekonsiliasiInput
  if (ri?.nkkipAwalPeriode !== undefined) {
    const nkkipAwal = ri.nkkipAwalPeriode
    const bjk       = hasil.biayaJasaKini
    const bunga     = hasil.biayaBunga ?? 0
    const psc       = hasil.biayaJasaLalu ?? 0
    const gl        = ri.keuntunganKerugianAktuaria ?? 0
    const bayar     = ri.pembayaranImbalanPeriode ?? 0
    hasil.rekonsiliasi = {
      nkkipAwal,
      biayaJasaKini: bjk,
      biayaBunga:    bunga,
      biayaJasaLalu: psc,
      keuntunganKerugianAktuaria: gl,
      pembayaranImbalan: bayar,
      nkkipAkhir: nkkipAwal + bjk + bunga + psc + gl - bayar,
    }
  }

  return hasil
}

/**
 * Hitung kewajiban untuk banyak karyawan sekaligus.
 * Karyawan yang gagal validasi dilewati (tidak melempar error).
 */
export function hitungBatch(inputs: InputPerhitungan[]): HasilBatch {
  if (inputs.length === 0) {
    throw new Error('Input batch tidak boleh kosong')
  }

  const hasil: HasilPerhitungan[] = []
  for (const inp of inputs) {
    const errors = validasiInput(inp)
    if (errors.length === 0) hasil.push(hitung(inp))
  }

  const ringkasanPerJenis: Partial<Record<JenisKeluar, { nkkip: number; biayaJasa: number }>> = {}
  for (const h of hasil) {
    for (const [jenis, val] of Object.entries(h.nkkipPerJenis) as [JenisKeluar, number][]) {
      if (!ringkasanPerJenis[jenis]) ringkasanPerJenis[jenis] = { nkkip: 0, biayaJasa: 0 }
      ringkasanPerJenis[jenis]!.nkkip += val
    }
    for (const [jenis, val] of Object.entries(h.biayaJasaPerJenis) as [JenisKeluar, number][]) {
      if (!ringkasanPerJenis[jenis]) ringkasanPerJenis[jenis] = { nkkip: 0, biayaJasa: 0 }
      ringkasanPerJenis[jenis]!.biayaJasa += val
    }
  }

  return {
    hasil,
    totalNKKIP:           hasil.reduce((s, h) => s + h.nkkip, 0),
    totalBiayaJasa:       hasil.reduce((s, h) => s + h.biayaJasaKini, 0),
    totalKaryawan:        hasil.length,
    tanggalPerhitungan:   inputs[0].tanggalPerhitungan,
    metode:               inputs[0].metode,
    ringkasanPerJenis,
  }
}

/**
 * Estimasi rata-rata karyawan.
 * Buat "karyawan fiktif" dari data rata-rata, hitung, lalu kalikan jumlah karyawan.
 * Jika gunakanDistribusi=true, hitung per bucket usia/MK/upah lalu jumlahkan.
 */
export function hitungEstimasi(input: InputEstimasi): HasilBatch {
  const { tanggalPerhitungan, usiaPensiun, regulasi, metode,
          asumsiEkonomi, asumsiDemografi, jumlahKaryawan,
          rataRataUsia, rataRataMasaKerja, rataRataUpah,
          gunakanDistribusi, distribusi } = input

  // Tanggal lahir fiktif berdasarkan rata-rata usia
  const tglHitung    = parseDate(tanggalPerhitungan)
  const msPerTahun   = 365.25 * 24 * 60 * 60 * 1000
  const tglLahirFiktif = new Date(tglHitung.getTime() - rataRataUsia * msPerTahun)
  const tglMasukFiktif = new Date(tglHitung.getTime() - rataRataMasaKerja * msPerTahun)

  const defaultResign = { persentaseUPH: 0.15 }
  const defaultJenis: JenisKeluar[] = ['PENSIUN', 'MENGUNDURKAN_DIRI', 'MENINGGAL', 'CACAT']

  if (gunakanDistribusi && distribusi && distribusi.length > 0) {
    const inputs: InputPerhitungan[] = distribusi.map((bucket, i) => {
      const tglL = new Date(tglHitung.getTime() - bucket.rataRataUsia * msPerTahun)
      const tglM = new Date(tglHitung.getTime() - bucket.rataRataMasaKerja * msPerTahun)
      return {
        karyawan: {
          id:            `est-bucket-${i}`,
          nama:          bucket.label,
          tanggalLahir:  tglL.toISOString().slice(0, 10),
          tanggalMasuk:  tglM.toISOString().slice(0, 10),
          upahBulanan:   bucket.rataRataUpah,
          jenisKelamin:  'L',
        },
        tanggalPerhitungan,
        usiaPensiun,
        regulasi,
        metode,
        asumsiEkonomi,
        asumsiDemografi,
        jenisImbalanDihitung: metode === 'PUC_FULL' ? defaultJenis : ['PENSIUN'],
        formulaResign:        defaultResign,
      }
    })

    const batch = hitungBatch(inputs)

    // Scale setiap hasil oleh jumlah karyawan bucket
    const scaled: HasilPerhitungan[] = []
    for (let i = 0; i < batch.hasil.length; i++) {
      const h = batch.hasil[i]
      const multiplier = distribusi[i].jumlahKaryawan
      scaled.push({ ...h, nkkip: h.nkkip * multiplier, biayaJasaKini: h.biayaJasaKini * multiplier })
    }

    const ringkasanPerJenis: Partial<Record<JenisKeluar, { nkkip: number; biayaJasa: number }>> = {}
    for (const h of scaled) {
      for (const [j, v] of Object.entries(h.nkkipPerJenis) as [JenisKeluar, number][]) {
        if (!ringkasanPerJenis[j]) ringkasanPerJenis[j] = { nkkip: 0, biayaJasa: 0 }
        ringkasanPerJenis[j]!.nkkip += v * (distribusi[scaled.indexOf(h)]?.jumlahKaryawan ?? 1)
      }
      for (const [j, v] of Object.entries(h.biayaJasaPerJenis) as [JenisKeluar, number][]) {
        if (!ringkasanPerJenis[j]) ringkasanPerJenis[j] = { nkkip: 0, biayaJasa: 0 }
        ringkasanPerJenis[j]!.biayaJasa += v * (distribusi[scaled.indexOf(h)]?.jumlahKaryawan ?? 1)
      }
    }

    return {
      hasil:              scaled,
      totalNKKIP:         scaled.reduce((s, h) => s + h.nkkip, 0),
      totalBiayaJasa:     scaled.reduce((s, h) => s + h.biayaJasaKini, 0),
      totalKaryawan:      jumlahKaryawan,
      tanggalPerhitungan,
      metode,
      ringkasanPerJenis,
    }
  }

  // Mode rata-rata sederhana: satu karyawan fiktif × jumlahKaryawan
  const inputFiktif: InputPerhitungan = {
    karyawan: {
      id:            'estimasi-avg',
      nama:          'Karyawan Rata-rata',
      tanggalLahir:  tglLahirFiktif.toISOString().slice(0, 10),
      tanggalMasuk:  tglMasukFiktif.toISOString().slice(0, 10),
      upahBulanan:   rataRataUpah,
      jenisKelamin:  'L',
    },
    tanggalPerhitungan,
    usiaPensiun,
    regulasi,
    metode,
    asumsiEkonomi,
    asumsiDemografi,
    jenisImbalanDihitung: metode === 'PUC_FULL' ? defaultJenis : ['PENSIUN'],
    formulaResign:        defaultResign,
  }

  const hasilSatu = hitung(inputFiktif)
  const hasilScaled: HasilPerhitungan = {
    ...hasilSatu,
    nkkip:        hasilSatu.nkkip * jumlahKaryawan,
    biayaJasaKini: hasilSatu.biayaJasaKini * jumlahKaryawan,
  }

  const ringkasanPerJenis: Partial<Record<JenisKeluar, { nkkip: number; biayaJasa: number }>> = {}
  for (const [j, v] of Object.entries(hasilSatu.nkkipPerJenis) as [JenisKeluar, number][]) {
    ringkasanPerJenis[j] = {
      nkkip:    v * jumlahKaryawan,
      biayaJasa: (hasilSatu.biayaJasaPerJenis[j] ?? 0) * jumlahKaryawan,
    }
  }

  return {
    hasil:              [hasilScaled],
    totalNKKIP:         hasilScaled.nkkip,
    totalBiayaJasa:     hasilScaled.biayaJasaKini,
    totalKaryawan:      jumlahKaryawan,
    tanggalPerhitungan,
    metode,
    ringkasanPerJenis,
  }
}
