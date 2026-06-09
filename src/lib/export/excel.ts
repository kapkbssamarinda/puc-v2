import * as XLSX from 'xlsx'
import { formatRupiah, formatTahunBulan, formatTanggal } from '@/lib/format'
import type { HasilPerhitungan, HasilBatch } from '@/lib/engine/types'

const METODE_LABEL: Record<string, string> = {
  LIQUIDATION:  'Liquidation Basis',
  PUC_SIMPLE:   'PUC Sederhana',
  PUC_ECONOMIC: 'PUC + Ekonomi',
  PUC_FULL:     'PUC Komprehensif',
}

function ws_header(ws: XLSX.WorkSheet, range: string, val: string) {
  if (!ws['!merges']) ws['!merges'] = []
  const r = XLSX.utils.decode_range(range)
  ws['!merges'].push(r)
  const ref = XLSX.utils.encode_cell({ r: r.s.r, c: r.s.c })
  ws[ref] = { v: val, t: 's', s: { font: { bold: true } } }
}

// ─── Single Export ────────────────────────────────────────────────────────────

/** Ekspor hasil satu karyawan ke XLSX (4 sheet). */
export function exportExcelSingle(hasil: HasilPerhitungan): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Ringkasan
  const k = hasil.input.karyawan
  const ringkasan: (string | number)[][] = [
    ['KALKULATOR IMBALAN PASCA KERJA — PSAK 24'],
    [],
    ['Tanggal cetak', formatTanggal(new Date())],
    ['Tanggal perhitungan', formatTanggal(hasil.input.tanggalPerhitungan)],
    [],
    ['DATA KARYAWAN'],
    ['Nama',         k.nama],
    ...(k.nik ? [['NIK', k.nik] as (string | number)[]] : []),
    ...(k.jabatan ? [['Jabatan', k.jabatan] as (string | number)[]] : []),
    ...(k.divisi ? [['Divisi', k.divisi] as (string | number)[]] : []),
    ['Jenis kelamin', k.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
    ['Tgl lahir',    k.tanggalLahir],
    ['Tgl masuk',    k.tanggalMasuk],
    ['Upah bulanan', k.upahBulanan],
    ['Usia saat ini', hasil.usiaSekarang],
    ['Masa kerja lalu', hasil.masaKerjaLalu],
    ['Masa kerja total', hasil.masaKerjaTotal],
    [],
    ['METODE & ASUMSI'],
    ['Metode', METODE_LABEL[hasil.metode]],
    ['Usia pensiun', hasil.input.usiaPensiun],
    ['Regulasi', hasil.input.regulasi],
    ['Tingkat diskonto (%)', hasil.input.asumsiEkonomi.tingkatDiskonto * 100],
    ['Kenaikan gaji (%)', hasil.input.asumsiEkonomi.tingkatKenaikanGaji * 100],
    [],
    ['HASIL UTAMA'],
    ['NKKIP (DBO)', hasil.nkkip],
    ['Biaya Jasa Kini (CSC)', hasil.biayaJasaKini],
    ['Biaya Bunga (IC)', hasil.biayaBunga],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(ringkasan)
  ws1['!cols'] = [{ wch: 28 }, { wch: 20 }]
  ws_header(ws1, 'A1:B1', 'KALKULATOR IMBALAN PASCA KERJA — PSAK 24')
  XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan')

  // Sheet 2: Breakdown per Jenis
  const jenisList = Object.entries(hasil.nkkipPerJenis) as [string, number][]
  const breakdown: (string | number)[][] = [
    ['BREAKDOWN PER JENIS IMBALAN'],
    [],
    ['Jenis Keluar', 'NKKIP (Rp)', 'Biaya Jasa Kini (Rp)'],
    ...jenisList.map(([jenis, nk]) => [
      jenis,
      nk,
      hasil.biayaJasaPerJenis[jenis as keyof typeof hasil.biayaJasaPerJenis] ?? 0,
    ]),
    [],
    ['TOTAL', hasil.nkkip, hasil.biayaJasaKini],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(breakdown)
  ws2['!cols'] = [{ wch: 24 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Per Jenis')

  // Sheet 3: Tabel Detail (jika ada)
  if (hasil.details && hasil.details.length > 0) {
    const detail: (string | number)[][] = [
      ['TABEL DETAIL PER USIA'],
      [],
      [
        'Usia', 'Jenis Keluar', 'Masa Kerja', 'Proyeksi Upah',
        'Fktr PSG', 'Fktr UPMK', 'Proyeksi Imbalan',
        'Peluang', 'Fktr Diskonto', 'Nilai Kini',
        'Proporsi Atribusi', 'Kontribusi NKKIP', 'Kontribusi BJK',
      ],
      ...hasil.details.map((d) => [
        d.usia, d.jenisKeluar, d.masaKerja, d.proyeksiUpah,
        d.faktorPSG, d.faktorUPMK, d.proyeksiImbalan,
        d.peluang, d.faktorDiskonto, d.nilaiKini,
        d.proporsiAtribusi, d.kontribusiNKKIP, d.kontribusiBiayaJasa,
      ]),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(detail)
    ws3['!cols'] = Array(13).fill({ wch: 14 })
    XLSX.utils.book_append_sheet(wb, ws3, 'Detail Per Usia')
  }

  // Sheet 4: Tabel Probabilitas (jika ada)
  if (hasil.tabelProbabilitas && hasil.tabelProbabilitas.length > 0) {
    const prob: (string | number)[][] = [
      ['TABEL PROBABILITAS MULTIPLE DECREMENT'],
      [],
      ['Usia', 'P(Aktif)', 'P(Pensiun)', 'P(Meninggal)', 'P(Cacat)', 'P(Undur Diri)'],
      ...hasil.tabelProbabilitas.map((b) => [
        b.usia,
        b.peluangTetapBekerja,
        b.peluangPensiun,
        b.peluangMeninggal,
        b.peluangCacat,
        b.peluangUndurDiri,
      ]),
    ]
    const ws4 = XLSX.utils.aoa_to_sheet(prob)
    ws4['!cols'] = Array(6).fill({ wch: 14 })
    XLSX.utils.book_append_sheet(wb, ws4, 'Probabilitas')
  }

  // Sheet 5: Rekonsiliasi NKKIP (jika tersedia)
  if (hasil.rekonsiliasi) {
    const r = hasil.rekonsiliasi
    const gl = r.keuntunganKerugianAktuaria
    const glLabel = gl < 0 ? 'Keuntungan Aktuaria (OCI)' : 'Kerugian Aktuaria (OCI)'
    const rekData: (string | number)[][] = [
      ['REKONSILIASI NKKIP — PSAK 24'],
      [],
      ['Komponen', 'Jumlah (Rp)'],
      ['NKKIP Awal Periode', r.nkkipAwal],
      ['+ Biaya Jasa Kini', r.biayaJasaKini],
      ['+ Biaya Bunga', r.biayaBunga],
    ]
    if (r.biayaJasaLalu !== 0) {
      rekData.push(['+ Biaya Jasa Lalu (PSC)', r.biayaJasaLalu])
    }
    if (gl !== 0) {
      rekData.push([`+/- ${glLabel}`, gl])
    }
    rekData.push(
      ['- Pembayaran Imbalan', -r.pembayaranImbalan],
      [],
      ['NKKIP Akhir Periode', r.nkkipAkhir],
    )
    const ws5 = XLSX.utils.aoa_to_sheet(rekData)
    ws5['!cols'] = [{ wch: 34 }, { wch: 20 }]
    ws_header(ws5, 'A1:B1', 'REKONSILIASI NKKIP — PSAK 24')
    XLSX.utils.book_append_sheet(wb, ws5, 'Rekonsiliasi NKKIP')
  }

  XLSX.writeFile(wb, `PSAK24_${hasil.input.karyawan.nama.replace(/\s+/g, '_')}_${hasil.input.tanggalPerhitungan}.xlsx`)
}

// ─── Batch Export ─────────────────────────────────────────────────────────────

/** Ekspor hasil batch ke XLSX (sheet summary + per karyawan). */
export function exportExcelBatch(hasil: HasilBatch): void {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Ringkasan Batch
  const adaNIK = hasil.hasil.some((h) => !!h.input.karyawan.nik)
  const ringkasan: (string | number)[][] = [
    ['KALKULATOR IMBALAN PASCA KERJA — PSAK 24 (BATCH)'],
    [],
    ['Tanggal cetak',        formatTanggal(new Date())],
    ['Tanggal perhitungan',  formatTanggal(hasil.tanggalPerhitungan)],
    ['Metode',               METODE_LABEL[hasil.metode]],
    ['Jumlah karyawan',      hasil.totalKaryawan],
    [],
    ['TOTAL AGREGAT'],
    ['Total NKKIP (DBO)',    hasil.totalNKKIP],
    ['Total Biaya Jasa Kini', hasil.totalBiayaJasa],
    [],
    ['RINGKASAN PER KARYAWAN'],
    [],
    ['No', 'Nama', ...(adaNIK ? ['NIK'] : []), 'Tgl Lahir', 'Tgl Masuk', 'Upah (Rp)', 'Usia (thn)', 'MK Lalu (thn)', 'NKKIP (Rp)', 'BJK (Rp)', 'Biaya Bunga (Rp)'],
    ...hasil.hasil.map((h, i) => [
      i + 1,
      h.input.karyawan.nama,
      ...(adaNIK ? [h.input.karyawan.nik ?? ''] : []),
      h.input.karyawan.tanggalLahir,
      h.input.karyawan.tanggalMasuk,
      h.input.karyawan.upahBulanan,
      +h.usiaSekarang.toFixed(2),
      +h.masaKerjaLalu.toFixed(2),
      Math.round(h.nkkip),
      Math.round(h.biayaJasaKini),
      Math.round(h.biayaBunga),
    ]),
    [],
    ['', '', ...(adaNIK ? [''] : []), '', '', '', '', 'TOTAL', Math.round(hasil.totalNKKIP), Math.round(hasil.totalBiayaJasa), ''],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(ringkasan)
  ws1['!cols'] = [
    { wch: 4 }, { wch: 24 }, ...(adaNIK ? [{ wch: 12 }] : []), { wch: 12 }, { wch: 12 },
    { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Batch')

  // Sheet per karyawan (max 30 karyawan)
  const batas = Math.min(hasil.hasil.length, 30)
  for (let i = 0; i < batas; i++) {
    const h   = hasil.hasil[i]
    const nama = h.input.karyawan.nama.substring(0, 20)
    const rows: (string | number)[][] = [
      [h.input.karyawan.nama],
      [],
      ['NKKIP',        Math.round(h.nkkip)],
      ['Biaya Jasa',   Math.round(h.biayaJasaKini)],
      ['Biaya Bunga',  Math.round(h.biayaBunga)],
      ['Usia',         +h.usiaSekarang.toFixed(2)],
      ['Masa Kerja',   formatTahunBulan(h.masaKerjaLalu)],
      ['Upah',         h.input.karyawan.upahBulanan],
      ['Metode',       METODE_LABEL[h.metode]],
    ]
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 20 }, { wch: 18 }]
    XLSX.utils.book_append_sheet(wb, ws, `${i + 1}. ${nama}`)
  }

  XLSX.writeFile(wb, `PSAK24_Batch_${hasil.tanggalPerhitungan}_${hasil.totalKaryawan}Karyawan.xlsx`)
}

/** Ekspor daftar karyawan (hanya NKKIP) ke XLSX ringkas untuk kertas kerja. */
export function exportExcelRingkas(hasilList: HasilPerhitungan[], tanggal: string): void {
  const wb   = XLSX.utils.book_new()
  const adaNIK = hasilList.some((h) => !!h.input.karyawan.nik)
  const rows: (string | number)[][] = [
    ['KERTAS KERJA PSAK 24 — IMBALAN PASCA KERJA'],
    ['Tanggal', formatTanggal(tanggal)],
    ['Dicetak', formatTanggal(new Date())],
    [],
    ['No', 'Nama', ...(adaNIK ? ['NIK'] : []), 'Usia', 'Masa Kerja', 'Upah (Rp)', 'NKKIP (Rp)', 'BJK (Rp)'],
    ...hasilList.map((h, i) => [
      i + 1,
      h.input.karyawan.nama,
      ...(adaNIK ? [h.input.karyawan.nik ?? ''] : []),
      +h.usiaSekarang.toFixed(1),
      formatTahunBulan(h.masaKerjaLalu),
      h.input.karyawan.upahBulanan,
      Math.round(h.nkkip),
      Math.round(h.biayaJasaKini),
    ]),
    [],
    ['', '', ...(adaNIK ? [''] : []), '', '', 'TOTAL',
      Math.round(hasilList.reduce((s, h) => s + h.nkkip, 0)),
      Math.round(hasilList.reduce((s, h) => s + h.biayaJasaKini, 0)),
    ],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 4 }, { wch: 24 }, ...(adaNIK ? [{ wch: 12 }] : []), { wch: 8 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Ringkasan')
  XLSX.writeFile(wb, `KertasKerja_PSAK24_${tanggal}.xlsx`)
}

// re-export formatRupiah for convenience in batch page
export { formatRupiah }
