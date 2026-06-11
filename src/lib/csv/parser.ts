import * as XLSX from 'xlsx'
import type { DataKaryawan } from '@/lib/engine/types'

export const XLSX_TEMPLATE_HEADERS = [
  'nama',
  'nik',
  'tanggal_lahir',
  'tanggal_masuk',
  'upah_bulanan',
  'jenis_kelamin',
]

export const XLSX_TEMPLATE_EXAMPLE = [
  { nama: 'Budi Santoso',  nik: 'EMP001', tanggal_lahir: '15/03/1985', tanggal_masuk: '01/07/2010', upah_bulanan: 15000000, jenis_kelamin: 'L' },
  { nama: 'Sari Dewi',     nik: 'EMP002', tanggal_lahir: '22/08/1990', tanggal_masuk: '01/04/2015', upah_bulanan: 10000000, jenis_kelamin: 'P' },
  { nama: 'Ahmad Fauzi',   nik: '',       tanggal_lahir: '30/11/1978', tanggal_masuk: '15/01/2005', upah_bulanan: 20000000, jenis_kelamin: 'L' },
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

/** Konversi Date object ke YYYY-MM-DD untuk kebutuhan engine. */
function dateToISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Konversi string DD/MM/YYYY → YYYY-MM-DD. Jika tidak cocok, kembalikan string asli agar gagal validasi. */
function parseDDMMYYYY(s: string): string {
  const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return s
  const [, d, m, y] = match
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

/** Parse XLSX ArrayBuffer → DataKaryawan[]. Error baris dikumpulkan, tidak throw. */
export function parseXLSX(buffer: ArrayBuffer): CSVParseResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
  })

  const data: DataKaryawan[] = []
  const errors: CSVParseError[] = []

  rows.forEach((row, idx) => {
    const baris = idx + 2 // +2: header = 1, data mulai dari 2

    const normalized: Record<string, string> = {}
    for (const [k, v] of Object.entries(row)) {
      const key = k.trim().toLowerCase().replace(/\s+/g, '_')
      if (key === 'tanggal_lahir' || key === 'tanggal_masuk') {
        if (v instanceof Date) {
          normalized[key] = dateToISO(v)
        } else if (typeof v === 'number') {
          normalized[key] = dateToISO(new Date(Math.round((v - 25569) * 86400 * 1000)))
        } else {
          // Teks DD/MM/YYYY → konversi ke YYYY-MM-DD untuk engine
          normalized[key] = parseDDMMYYYY(String(v ?? '').trim())
        }
      } else {
        normalized[key] = String(v ?? '').trim()
      }
    }

    const nama         = normalized.nama ?? ''
    const nik          = normalized.nik || undefined
    const tanggalLahir = normalized.tanggal_lahir ?? ''
    const tanggalMasuk = normalized.tanggal_masuk ?? ''
    const upahStr      = normalized.upah_bulanan ?? ''
    const jkRaw        = (normalized.jenis_kelamin ?? '').toUpperCase()

    if (!nama) {
      errors.push({ baris, kolom: 'nama', pesan: 'Nama tidak boleh kosong' })
    }
    if (!validDate(tanggalLahir)) {
      errors.push({ baris, kolom: 'tanggal_lahir', pesan: `Format tidak valid: "${tanggalLahir}" (gunakan DD/MM/YYYY)` })
    }
    if (!validDate(tanggalMasuk)) {
      errors.push({ baris, kolom: 'tanggal_masuk', pesan: `Format tidak valid: "${tanggalMasuk}" (gunakan DD/MM/YYYY)` })
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
        id:           `xlsx-${baris}`,
        nama,
        nik,
        tanggalLahir,
        tanggalMasuk,
        upahBulanan:  upah,
        jenisKelamin: jkRaw as 'L' | 'P',
      })
    }
  })

  return { data, errors }
}

/** Trigger download file template XLSX di browser. */
export function downloadXLSXTemplate(): void {
  const wb = XLSX.utils.book_new()

  const wsData: (string | number)[][] = [
    XLSX_TEMPLATE_HEADERS,
    ...XLSX_TEMPLATE_EXAMPLE.map((r) => [
      r.nama, r.nik, r.tanggal_lahir, r.tanggal_masuk, r.upah_bulanan, r.jenis_kelamin,
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Karyawan')
  XLSX.writeFile(wb, 'template_karyawan.xlsx')
}
