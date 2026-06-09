import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatRupiah, formatTahunBulan, formatTanggal, formatPersen } from '@/lib/format'
import type { HasilPerhitungan, HasilBatch } from '@/lib/engine/types'

const METODE_LABEL: Record<string, string> = {
  LIQUIDATION:  'Liquidation Basis',
  PUC_SIMPLE:   'PUC Sederhana',
  PUC_ECONOMIC: 'PUC + Asumsi Ekonomi',
  PUC_FULL:     'PUC Komprehensif',
}

const NAVY = [27, 42, 74] as [number, number, number]   // #1B2A4A
const WHITE = [255, 255, 255] as [number, number, number]

function header(doc: jsPDF, judul: string) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, w, 22, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('KALKULATOR IMBALAN PASCA KERJA — PSAK 24', 14, 9)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(judul, 14, 17)
  doc.setTextColor(0, 0, 0)
}

function footer(doc: jsPDF, halaman: number, total: number) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'Dokumen ini bersifat estimasi. Audit final memerlukan laporan aktuaris independen (PAI).',
    14, h - 6,
  )
  doc.text(`Halaman ${halaman} / ${total}`, w - 30, h - 6)
  doc.setTextColor(0, 0, 0)
}

// ─── Single PDF ───────────────────────────────────────────────────────────────

export function exportPDFSingle(hasil: HasilPerhitungan): void {
  const doc     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const kary    = hasil.input.karyawan
  const isEcon  = hasil.metode === 'PUC_ECONOMIC' || hasil.metode === 'PUC_FULL'
  const isFull  = hasil.metode === 'PUC_FULL'

  header(doc, `${kary.nama} — ${formatTanggal(hasil.input.tanggalPerhitungan)}`)

  let y = 30

  // Scorecard
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('NKKIP (Nilai Kini Kewajiban Imbalan Pasti)', 14, y)
  doc.setFontSize(16)
  doc.text(formatRupiah(hasil.nkkip), 14, y + 7)
  doc.setFontSize(9)
  doc.text(`Biaya Jasa Kini: ${formatRupiah(hasil.biayaJasaKini)}`, 100, y + 4)
  if (hasil.biayaBunga > 0) {
    doc.text(`Biaya Bunga: ${formatRupiah(hasil.biayaBunga)}`, 100, y + 10)
  }
  doc.setFont('helvetica', 'normal')

  y += 20

  // Tabel info karyawan + asumsi
  autoTable(doc, {
    startY: y,
    head: [['DATA & ASUMSI', 'Nilai']],
    body: [
      ['Nama karyawan',      kary.nama],
      ['Jenis kelamin',      kary.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
      ['Tanggal lahir',      kary.tanggalLahir],
      ['Tanggal masuk',      kary.tanggalMasuk],
      ['Upah bulanan',       formatRupiah(kary.upahBulanan)],
      ['Usia saat ini',      formatTahunBulan(hasil.usiaSekarang)],
      ['Masa kerja lalu',    formatTahunBulan(hasil.masaKerjaLalu)],
      ['Masa kerja total',   formatTahunBulan(hasil.masaKerjaTotal)],
      ['Usia pensiun',       `${hasil.input.usiaPensiun} tahun`],
      ['Regulasi',           hasil.input.regulasi === 'UUCK_PP35' ? 'PP 35/2021 (UUCK)' : 'UU 13/2003'],
      ['Metode',             METODE_LABEL[hasil.metode]],
      ...(isEcon ? [
        ['Tingkat diskonto',    formatPersen(hasil.input.asumsiEkonomi.tingkatDiskonto * 100)],
        ['Kenaikan gaji',       formatPersen(hasil.input.asumsiEkonomi.tingkatKenaikanGaji * 100)],
      ] : []),
      ...(isFull ? [
        ['Tingkat pengunduran', formatPersen(hasil.input.asumsiDemografi.tingkatPengunduranDiri * 100)],
        ['Mortalita',           hasil.input.asumsiDemografi.gunakanMortalita ? 'TMI-2019' : 'Tidak'],
      ] : []),
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 70 } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Breakdown per jenis
  const jenisRows = Object.entries(hasil.nkkipPerJenis).map(([j, v]) => [
    j,
    formatRupiah(v as number),
    formatRupiah((hasil.biayaJasaPerJenis[j as keyof typeof hasil.biayaJasaPerJenis] ?? 0) as number),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Jenis Keluar', 'NKKIP', 'Biaya Jasa Kini']],
    body: [
      ...jenisRows,
      ['TOTAL', formatRupiah(hasil.nkkip), formatRupiah(hasil.biayaJasaKini)],
    ],
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8 },
    footStyles: { fontStyle: 'bold' },
    didParseCell: (data) => {
      if (data.row.index === jenisRows.length) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [240, 240, 240]
      }
    },
    margin: { left: 14, right: 14 },
  })

  // Footer
  const total = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    footer(doc, i, total)
  }

  doc.save(`PSAK24_${kary.nama.replace(/\s+/g, '_')}_${hasil.input.tanggalPerhitungan}.pdf`)
}

// ─── Batch PDF ────────────────────────────────────────────────────────────────

export function exportPDFBatch(hasil: HasilBatch): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  header(doc, `Batch ${hasil.totalKaryawan} Karyawan — ${formatTanggal(hasil.tanggalPerhitungan)}`)

  const y = 30

  // Baris summary total
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(`Metode: ${METODE_LABEL[hasil.metode]}`, 14, y - 5)
  doc.text(`Total NKKIP: ${formatRupiah(hasil.totalNKKIP)}`, 100, y - 5)
  doc.text(`Total Biaya Jasa: ${formatRupiah(hasil.totalBiayaJasa)}`, 190, y - 5)
  doc.setFont('helvetica', 'normal')

  autoTable(doc, {
    startY: y,
    head: [['No', 'Nama', 'Tgl Lahir', 'Tgl Masuk', 'Upah (Rp)', 'Usia', 'MK', 'NKKIP (Rp)', 'BJK (Rp)']],
    body: [
      ...hasil.hasil.map((h, i) => [
        i + 1,
        h.input.karyawan.nama,
        h.input.karyawan.tanggalLahir,
        h.input.karyawan.tanggalMasuk,
        formatRupiah(h.input.karyawan.upahBulanan),
        h.usiaSekarang.toFixed(1),
        formatTahunBulan(h.masaKerjaLalu),
        formatRupiah(h.nkkip),
        formatRupiah(h.biayaJasaKini),
      ]),
      ['', '', '', '', '', '', 'TOTAL', formatRupiah(hasil.totalNKKIP), formatRupiah(hasil.totalBiayaJasa)],
    ],
    theme: 'striped',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7 },
    didParseCell: (data) => {
      if (data.row.index === hasil.hasil.length) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [230, 236, 250]
      }
    },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 36 },
      7: { cellWidth: 28 },
      8: { cellWidth: 28 },
    },
  })

  const total = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    footer(doc, i, total)
  }

  doc.save(`PSAK24_Batch_${hasil.tanggalPerhitungan}.pdf`)
}
