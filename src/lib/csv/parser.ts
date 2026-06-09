import Papa from 'papaparse'
import type { DataKaryawan } from '@/lib/engine/types'

export const CSV_TEMPLATE_HEADERS = [
  'nama',
  'nik',
  'tanggal_lahir',
  'tanggal_masuk',
  'upah_bulanan',
  'jenis_kelamin',
]

export const CSV_TEMPLATE_EXAMPLE = [
  { nama: 'Budi Santoso',  nik: 'EMP001', tanggal_lahir: '1985-03-15', tanggal_masuk: '2010-07-01', upah_bulanan: '15000000', jenis_kelamin: 'L' },
  { nama: 'Sari Dewi',     nik: 'EMP002', tanggal_lahir: '1990-08-22', tanggal_masuk: '2015-04-01', upah_bulanan: '10000000', jenis_kelamin: 'P' },
  { nama: 'Ahmad Fauzi',   nik: '',       tanggal_lahir: '1978-11-30', tanggal_masuk: '2005-01-15', upah_bulanan: '20000000', jenis_kelamin: 'L' },
]

export type CSVParseError = {
  baris: number
  kolom: string
  pesan: string
}

export type CSVParseResult = {
  data: DataKaryawan[]
  errors: CSVParseError[]
}

function validDate(s: string): boolean {
  if (!s) return false
  const d = new Date(s)
  return !isNaN(d.getTime())
}

/** Parse CSV string → DataKaryawan[]. Error baris dikumpulkan, tidak throw. */
export function parseCSV(csvString: string): CSVParseResult {
  const result = Papa.parse<Record<string, string>>(csvString, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  const data: DataKaryawan[] = []
  const errors: CSVParseError[] = []

  result.data.forEach((row, idx) => {
    const baris = idx + 2 // +2: header = 1, data mulai dari 2
    const nama          = row.nama?.trim() ?? ''
    const nik           = row.nik?.trim() || undefined
    const tanggalLahir  = row.tanggal_lahir?.trim() ?? ''
    const tanggalMasuk  = row.tanggal_masuk?.trim() ?? ''
    const upahStr       = row.upah_bulanan?.trim() ?? ''
    const jkRaw         = row.jenis_kelamin?.trim().toUpperCase() ?? ''

    if (!nama) {
      errors.push({ baris, kolom: 'nama', pesan: 'Nama tidak boleh kosong' })
    }
    if (!validDate(tanggalLahir)) {
      errors.push({ baris, kolom: 'tanggal_lahir', pesan: `Format tidak valid: "${tanggalLahir}" (gunakan YYYY-MM-DD)` })
    }
    if (!validDate(tanggalMasuk)) {
      errors.push({ baris, kolom: 'tanggal_masuk', pesan: `Format tidak valid: "${tanggalMasuk}" (gunakan YYYY-MM-DD)` })
    }
    const upah = parseFloat(upahStr.replace(/[^0-9.]/g, ''))
    if (isNaN(upah) || upah <= 0) {
      errors.push({ baris, kolom: 'upah_bulanan', pesan: `Upah harus angka positif: "${upahStr}"` })
    }
    if (jkRaw !== 'L' && jkRaw !== 'P') {
      errors.push({ baris, kolom: 'jenis_kelamin', pesan: `Harus "L" atau "P", ditemukan: "${jkRaw}"` })
    }

    if (nama && validDate(tanggalLahir) && validDate(tanggalMasuk) && !isNaN(upah) && upah > 0 && (jkRaw === 'L' || jkRaw === 'P')) {
      data.push({
        id:            `csv-${baris}`,
        nama,
        nik,
        tanggalLahir,
        tanggalMasuk,
        upahBulanan:   upah,
        jenisKelamin:  jkRaw as 'L' | 'P',
      })
    }
  })

  return { data, errors }
}

/** Hasilkan CSV template siap download. */
export function generateCSVTemplate(): string {
  const header  = CSV_TEMPLATE_HEADERS.join(',')
  const rows    = CSV_TEMPLATE_EXAMPLE.map((r) =>
    CSV_TEMPLATE_HEADERS.map((h) => r[h as keyof typeof r] ?? '').join(',')
  ).join('\n')
  return `${header}\n${rows}`
}

/** Trigger download file template CSV di browser. */
export function downloadCSVTemplate(): void {
  const csv  = generateCSVTemplate()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'template_karyawan.csv'
  a.click()
  URL.revokeObjectURL(url)
}
