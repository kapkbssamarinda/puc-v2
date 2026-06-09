"use client"

import { useState, useRef, useCallback } from 'react'
import { Users, Plus, Trash2, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { formatRupiah, formatTahunBulan, formatTanggal } from '@/lib/format'
import { hitung, hitungBatch } from '@/lib/engine'
import { parseCSV, downloadCSVTemplate } from '@/lib/csv/parser'
import { exportExcelBatch, exportExcelRingkas } from '@/lib/export/excel'
import { exportPDFBatch } from '@/lib/export/pdf'
import { JurnalPanel }       from '@/components/results/JurnalPanel'
import { CalculationSteps } from '@/components/results/CalculationSteps'
import { DetailsTable }     from '@/components/results/DetailsTable'
import { ProbabilityTable } from '@/components/results/ProbabilityTable'
import { FSNote }           from '@/components/results/FSNote'
import type {
  MetodePerhitungan, Regulasi, DataKaryawan, HasilPerhitungan, HasilBatch,
  InputPerhitungan,
} from '@/lib/engine/types'
import type { CSVParseError } from '@/lib/csv/parser'

// ─── Tipe baris manual ────────────────────────────────────────────────────────

interface BarisManual {
  id: string
  nama: string
  nik: string
  tanggalLahir: string
  tanggalMasuk: string
  upahBulanan: string
  jenisKelamin: 'L' | 'P'
}

const BARIS_DEFAULT: BarisManual[] = [
  { id: '1', nama: 'Budi Santoso',  nik: '', tanggalLahir: '1985-03-15', tanggalMasuk: '2010-07-01', upahBulanan: '15000000', jenisKelamin: 'L' },
  { id: '2', nama: 'Sari Dewi',     nik: '', tanggalLahir: '1990-08-22', tanggalMasuk: '2015-04-01', upahBulanan: '10000000', jenisKelamin: 'P' },
  { id: '3', nama: 'Ahmad Fauzi',   nik: '', tanggalLahir: '1978-11-30', tanggalMasuk: '2005-01-15', upahBulanan: '20000000', jenisKelamin: 'L' },
]

// ─── Helper ────────────────────────────────────────────────────────────────────

let idCounter = 100
function newId() { return String(++idCounter) }

function toDataKaryawan(b: BarisManual): DataKaryawan {
  return {
    id: b.id,
    nama: b.nama,
    nik: b.nik || undefined,
    tanggalLahir: b.tanggalLahir,
    tanggalMasuk: b.tanggalMasuk,
    upahBulanan: parseFloat(b.upahBulanan.replace(/[^0-9.]/g, '')) || 0,
    jenisKelamin: b.jenisKelamin,
  }
}

function formatUpahInput(s: string): string {
  const n = parseFloat(s.replace(/[^0-9]/g, ''))
  if (!n) return ''
  return Math.floor(n).toLocaleString('id-ID')
}

// ─── Komponen sel input baris tabel ───────────────────────────────────────────

function CellInput({
  value, onChange, type = 'text', placeholder,
}: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-8 px-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary bg-white"
    />
  )
}

// ─── Panel Global Settings ─────────────────────────────────────────────────────

interface GlobalSettings {
  metode: MetodePerhitungan
  regulasi: Regulasi
  tanggalPerhitungan: string
  usiaPensiun: number
  diskonto: number        // persen
  kenaikanGaji: number    // persen
  tingkatResign: number   // persen
  gunakanMortalita: boolean
  gunakanJenisLengkap: boolean
}

function SettingsPanel({
  s, onChange,
}: { s: GlobalSettings; onChange: (patch: Partial<GlobalSettings>) => void }) {
  const isEcon = s.metode === 'PUC_ECONOMIC' || s.metode === 'PUC_FULL'
  const isFull = s.metode === 'PUC_FULL'
  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm">Pengaturan Global (berlaku untuk semua karyawan)</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <Select
            label="Metode"
            value={s.metode}
            onChange={(e) => onChange({ metode: e.target.value as MetodePerhitungan })}
          >
            <option value="LIQUIDATION">Liquidation Basis</option>
            <option value="PUC_SIMPLE">PUC Sederhana</option>
            <option value="PUC_ECONOMIC">PUC + Ekonomi ★</option>
            <option value="PUC_FULL">PUC Komprehensif</option>
          </Select>

          <Select
            label="Regulasi"
            value={s.regulasi}
            onChange={(e) => onChange({ regulasi: e.target.value as Regulasi })}
          >
            <option value="UUCK_PP35">UUCK / PP 35/2021</option>
            <option value="UUK_13_2003">UU No. 13/2003</option>
          </Select>

          <Input
            label="Tanggal Perhitungan"
            type="date"
            value={s.tanggalPerhitungan}
            onChange={(e) => onChange({ tanggalPerhitungan: e.target.value })}
          />

          <Input
            label="Usia Pensiun"
            type="number"
            min={45}
            max={65}
            suffix="thn"
            value={String(s.usiaPensiun)}
            onChange={(e) => onChange({ usiaPensiun: Number(e.target.value) })}
          />

          {isEcon && (
            <>
              <Input
                label="Diskonto"
                type="number"
                step="0.01"
                min={0}
                max={30}
                suffix="%"
                value={String(s.diskonto)}
                onChange={(e) => onChange({ diskonto: Number(e.target.value) })}
              />
              <Input
                label="Kenaikan Gaji"
                type="number"
                step="0.1"
                min={0}
                max={30}
                suffix="%"
                value={String(s.kenaikanGaji)}
                onChange={(e) => onChange({ kenaikanGaji: Number(e.target.value) })}
              />
            </>
          )}

          {isFull && (
            <Input
              label="Tingkat Resign"
              type="number"
              step="0.1"
              min={0}
              max={100}
              suffix="%"
              value={String(s.tingkatResign)}
              onChange={(e) => onChange({ tingkatResign: Number(e.target.value) })}
            />
          )}
        </div>

        {isFull && (
          <div className="flex flex-wrap gap-4 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={s.gunakanMortalita}
                onChange={(e) => onChange({ gunakanMortalita: e.target.checked })}
                className="text-secondary focus:ring-secondary"
              />
              <span className="text-sm text-gray-700">Gunakan Mortalita (TMI-2019)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={s.gunakanJenisLengkap}
                onChange={(e) => onChange({ gunakanJenisLengkap: e.target.checked })}
                className="text-secondary focus:ring-secondary"
              />
              <span className="text-sm text-gray-700">Hitung semua jenis imbalan</span>
            </label>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Tab Manual ────────────────────────────────────────────────────────────────

function TabManual({
  rows, onChange,
}: { rows: BarisManual[]; onChange: (rows: BarisManual[]) => void }) {
  function updateRow(id: string, patch: Partial<BarisManual>) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function addRow() {
    onChange([...rows, {
      id: newId(), nama: '', nik: '', tanggalLahir: '', tanggalMasuk: '',
      upahBulanan: '', jenisKelamin: 'L',
    }])
  }

  function removeRow(id: string) {
    onChange(rows.filter((r) => r.id !== id))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
              <th className="text-left px-3 py-2 font-semibold w-6">#</th>
              <th className="text-left px-2 py-2 font-semibold min-w-[160px]">Nama</th>
              <th className="text-left px-2 py-2 font-semibold min-w-[90px]">NIK</th>
              <th className="text-left px-2 py-2 font-semibold min-w-[130px]">Tgl Lahir</th>
              <th className="text-left px-2 py-2 font-semibold min-w-[130px]">Tgl Masuk</th>
              <th className="text-left px-2 py-2 font-semibold min-w-[130px]">Upah Bulanan (Rp)</th>
              <th className="text-center px-2 py-2 font-semibold w-16">JK</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
                <td className="px-2 py-1.5">
                  <CellInput value={r.nama} onChange={(v) => updateRow(r.id, { nama: v })} placeholder="Nama karyawan" />
                </td>
                <td className="px-2 py-1.5">
                  <CellInput value={r.nik} onChange={(v) => updateRow(r.id, { nik: v })} placeholder="NIK" />
                </td>
                <td className="px-2 py-1.5">
                  <CellInput value={r.tanggalLahir} onChange={(v) => updateRow(r.id, { tanggalLahir: v })} type="date" />
                </td>
                <td className="px-2 py-1.5">
                  <CellInput value={r.tanggalMasuk} onChange={(v) => updateRow(r.id, { tanggalMasuk: v })} type="date" />
                </td>
                <td className="px-2 py-1.5">
                  <CellInput
                    value={formatUpahInput(r.upahBulanan)}
                    onChange={(v) => updateRow(r.id, { upahBulanan: v.replace(/[^0-9]/g, '') })}
                    placeholder="10.000.000"
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <select
                    value={r.jenisKelamin}
                    onChange={(e) => updateRow(r.id, { jenisKelamin: e.target.value as 'L' | 'P' })}
                    className="h-8 px-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-secondary"
                  >
                    <option value="L">L</option>
                    <option value="P">P</option>
                  </select>
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => removeRow(r.id)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                    title="Hapus baris"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" onClick={addRow} className="self-start">
        <Plus className="h-4 w-4 mr-1" />
        Tambah Baris
      </Button>
    </div>
  )
}

// ─── Tab CSV ──────────────────────────────────────────────────────────────────

function TabCSV({
  csvData, csvErrors, onFile,
}: {
  csvData: DataKaryawan[]
  csvErrors: CSVParseError[]
  onFile: (file: File) => void
}) {
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [onFile])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={downloadCSVTemplate}>
          <Download className="h-4 w-4 mr-1" />
          Download Template CSV
        </Button>
        <span className="text-xs text-gray-400">Format: nama, tanggal_lahir, tanggal_masuk, upah_bulanan, jenis_kelamin</span>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors p-10
          ${drag ? 'border-secondary bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`}
      >
        <FileSpreadsheet className={`h-10 w-10 ${drag ? 'text-secondary' : 'text-gray-300'}`} />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">Drag &amp; drop file CSV di sini</p>
          <p className="text-xs text-gray-400 mt-1">atau klik untuk memilih file</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {/* Error validasi */}
      {csvErrors.length > 0 && (
        <Alert
          variant="warning"
          title={`${csvErrors.length} kesalahan ditemukan${csvData.length > 0 ? ` — ${csvData.length} baris valid tetap diproses` : ''}`}
        >
          <ul className="text-xs space-y-0.5 mt-1">
            {csvErrors.slice(0, 8).map((e, i) => (
              <li key={i}>Baris {e.baris} [{e.kolom}]: {e.pesan}</li>
            ))}
            {csvErrors.length > 8 && <li>… dan {csvErrors.length - 8} kesalahan lainnya</li>}
          </ul>
        </Alert>
      )}

      {/* Preview */}
      {csvData.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Preview ({csvData.length} karyawan valid)
          </p>
          <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-64">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Nama</th>
                  <th className="text-left px-3 py-2">Tgl Lahir</th>
                  <th className="text-left px-3 py-2">Tgl Masuk</th>
                  <th className="text-right px-3 py-2">Upah</th>
                  <th className="text-center px-3 py-2">JK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {csvData.map((k, i) => (
                  <tr key={k.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium text-gray-800">{k.nama}</td>
                    <td className="px-3 py-1.5 text-gray-600">{k.tanggalLahir}</td>
                    <td className="px-3 py-1.5 text-gray-600">{k.tanggalMasuk}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">{formatRupiah(k.upahBulanan)}</td>
                    <td className="px-3 py-1.5 text-center">{k.jenisKelamin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tabel Hasil ──────────────────────────────────────────────────────────────

function HasilTable({
  hasilList,
  terpilihId,
  onPilih,
}: {
  hasilList: HasilPerhitungan[]
  terpilihId: string | null
  onPilih: (h: HasilPerhitungan) => void
}) {
  const [sortKey, setSortKey] = useState<'nama' | 'nkkip' | 'bjk' | 'usia'>('nkkip')
  const [asc, setAsc]         = useState(false)

  function toggleSort(k: typeof sortKey) {
    if (sortKey === k) setAsc((v) => !v)
    else { setSortKey(k); setAsc(false) }
  }

  const sorted = [...hasilList].sort((a, b) => {
    let va: number | string = 0
    let vb: number | string = 0
    if (sortKey === 'nama')  { va = a.input.karyawan.nama;  vb = b.input.karyawan.nama }
    if (sortKey === 'nkkip') { va = a.nkkip;                vb = b.nkkip }
    if (sortKey === 'bjk')   { va = a.biayaJasaKini;        vb = b.biayaJasaKini }
    if (sortKey === 'usia')  { va = a.usiaSekarang;         vb = b.usiaSekarang }
    const cmp = typeof va === 'string' ? va.localeCompare(String(vb)) : (va as number) - (vb as number)
    return asc ? cmp : -cmp
  })

  function SortHeader({ k, label }: { k: typeof sortKey; label: string }) {
    return (
      <th
        className="text-right px-3 py-2 font-semibold cursor-pointer select-none hover:text-gray-800 whitespace-nowrap"
        onClick={() => toggleSort(k)}
      >
        {label} {sortKey === k ? (asc ? '↑' : '↓') : ''}
      </th>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide border-b border-gray-200">
          <tr>
            <th className="text-left px-3 py-2 font-semibold">#</th>
            <th
              className="text-left px-3 py-2 font-semibold cursor-pointer hover:text-gray-800"
              onClick={() => toggleSort('nama')}
            >
              Nama {sortKey === 'nama' ? (asc ? '↑' : '↓') : ''}
            </th>
            <SortHeader k="usia" label="Usia" />
            <th className="text-right px-3 py-2 font-semibold whitespace-nowrap">Masa Kerja</th>
            <th className="text-right px-3 py-2 font-semibold whitespace-nowrap hidden sm:table-cell">Upah</th>
            <SortHeader k="nkkip" label="NKKIP" />
            <SortHeader k="bjk"   label="Biaya Jasa" />
            <th className="px-2 py-2 w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {sorted.map((h, i) => (
            <tr
              key={h.input.karyawan.id}
              className={`text-sm cursor-pointer transition-colors ${
                terpilihId === h.input.karyawan.id
                  ? 'bg-secondary/10 border-l-2 border-secondary'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onPilih(h)}
              title="Klik untuk melihat detail langkah perhitungan"
            >
              <td className="px-3 py-2 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-3 py-2 font-medium text-gray-800">{h.input.karyawan.nama}</td>
              <td className="text-right px-3 py-2 tabular-nums text-gray-600">{h.usiaSekarang.toFixed(1)}</td>
              <td className="text-right px-3 py-2 tabular-nums text-gray-600">{formatTahunBulan(h.masaKerjaLalu)}</td>
              <td className="text-right px-3 py-2 tabular-nums text-gray-600 hidden sm:table-cell">
                {formatRupiah(h.input.karyawan.upahBulanan)}
              </td>
              <td className="text-right px-3 py-2 tabular-nums font-semibold text-gray-900">
                {formatRupiah(h.nkkip)}
              </td>
              <td className="text-right px-3 py-2 tabular-nums text-gray-700">
                {formatRupiah(h.biayaJasaKini)}
              </td>
              <td className="px-2 py-2 text-center text-gray-300">
                {terpilihId === h.input.karyawan.id
                  ? <span className="text-secondary text-xs font-bold">▼</span>
                  : <span className="text-xs">›</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 border-t border-gray-200 font-semibold">
            <td colSpan={6} className="px-3 py-2 text-xs text-gray-500">
              TOTAL ({hasilList.length} karyawan)
            </td>
            <td className="text-right px-3 py-2 tabular-nums text-secondary">
              {formatRupiah(hasilList.reduce((s, h) => s + h.nkkip, 0))}
            </td>
            <td className="text-right px-3 py-2 tabular-nums text-gray-700">
              {formatRupiah(hasilList.reduce((s, h) => s + h.biayaJasaKini, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── Page Utama ───────────────────────────────────────────────────────────────

export default function BatchPage() {
  const [settings, setSettings] = useState<GlobalSettings>({
    metode:              'PUC_ECONOMIC',
    regulasi:            'UUCK_PP35',
    tanggalPerhitungan:  '2024-12-31',
    usiaPensiun:         55,
    diskonto:            7.11,
    kenaikanGaji:        5,
    tingkatResign:       2,
    gunakanMortalita:    false,
    gunakanJenisLengkap: false,
  })

  const [rows, setRows]         = useState<BarisManual[]>(BARIS_DEFAULT)
  const [activeTab, setActiveTab] = useState('manual')
  const [csvData, setCsvData]   = useState<DataKaryawan[]>([])
  const [csvErrors, setCsvErrors] = useState<CSVParseError[]>([])

  const [hasilList, setHasilList]   = useState<HasilPerhitungan[]>([])
  const [hasilBatch, setHasilBatch] = useState<HasilBatch | null>(null)
  const [isLoading, setIsLoading]   = useState(false)
  const [errMsg, setErrMsg]         = useState<string | null>(null)
  const [skipList, setSkipList]     = useState<string[]>([])
  const [karyawanTerpilih, setKaryawanTerpilih] = useState<HasilPerhitungan | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)

  function patchSettings(patch: Partial<GlobalSettings>) {
    setSettings((s) => ({ ...s, ...patch }))
  }

  async function handleCSVFile(file: File) {
    const text = await file.text()
    const result = parseCSV(text)
    setCsvData(result.data)
    setCsvErrors(result.errors)
  }

  function buildInput(k: DataKaryawan): InputPerhitungan {
    const isFull = settings.metode === 'PUC_FULL'
    return {
      karyawan:           k,
      tanggalPerhitungan: settings.tanggalPerhitungan,
      usiaPensiun:        settings.usiaPensiun,
      regulasi:           settings.regulasi,
      metode:             settings.metode,
      asumsiEkonomi: {
        tingkatDiskonto:      settings.diskonto / 100,
        tingkatKenaikanGaji:  settings.kenaikanGaji / 100,
      },
      asumsiDemografi: {
        tingkatPengunduranDiri: settings.tingkatResign / 100,
        tingkatCacat:           0.001,
        gunakanMortalita:       settings.gunakanMortalita,
      },
      jenisImbalanDihitung: isFull && settings.gunakanJenisLengkap
        ? ['PENSIUN', 'MENGUNDURKAN_DIRI', 'MENINGGAL', 'CACAT']
        : ['PENSIUN'],
      formulaResign: { persentaseUPH: 0.15 },
    }
  }

  async function hitung_semua() {
    setIsLoading(true)
    setErrMsg(null)
    setSkipList([])

    const karyawanList: DataKaryawan[] = activeTab === 'manual'
      ? rows.map(toDataKaryawan).filter((k) => k.nama && k.tanggalLahir && k.tanggalMasuk && k.upahBulanan > 0)
      : csvData

    if (karyawanList.length === 0) {
      setErrMsg('Tidak ada data karyawan valid untuk dihitung.')
      setIsLoading(false)
      return
    }

    try {
      const inputs = karyawanList.map(buildInput)
      const skipped: string[] = []
      const validInputs: InputPerhitungan[] = []

      for (const inp of inputs) {
        try {
          hitung(inp)
          validInputs.push(inp)
        } catch (e) {
          skipped.push(`${inp.karyawan.nama}: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      if (skipped.length > 0) setSkipList(skipped)

      if (validInputs.length === 0) {
        setErrMsg('Semua karyawan gagal divalidasi. Periksa data dan asumsi.')
        setIsLoading(false)
        return
      }

      const batch = hitungBatch(validInputs)
      setHasilList(batch.hasil)
      setHasilBatch(batch)
      setKaryawanTerpilih(null)
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 p-2 rounded-lg mt-0.5">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Multi-Karyawan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hitung liabilitas PSAK 24 untuk seluruh karyawan sekaligus. Input manual atau import CSV.
          </p>
        </div>
      </div>

      {/* Global Settings */}
      <SettingsPanel s={settings} onChange={patchSettings} />

      {/* Input Tabs */}
      <Tabs defaultValue="manual" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manual">Input Manual</TabsTrigger>
          <TabsTrigger value="csv">Import CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <TabManual rows={rows} onChange={setRows} />
        </TabsContent>

        <TabsContent value="csv">
          <TabCSV csvData={csvData} csvErrors={csvErrors} onFile={handleCSVFile} />
        </TabsContent>
      </Tabs>

      {/* Hitung Button */}
      <div className="flex items-center gap-3">
        <Button
          onClick={hitung_semua}
          loading={isLoading}
          size="lg"
          className="min-w-40"
          disabled={isLoading || (activeTab === 'csv' && csvData.length === 0)}
        >
          {isLoading ? 'Menghitung…' : 'Hitung Semua Karyawan'}
        </Button>
        {activeTab === 'manual' && (
          <span className="text-xs text-gray-400">
            {rows.filter((r) => r.nama && r.tanggalLahir && r.tanggalMasuk).length} baris siap
          </span>
        )}
        {activeTab === 'csv' && csvData.length > 0 && (
          <span className="text-xs text-gray-400">{csvData.length} karyawan dari CSV</span>
        )}
      </div>

      {/* Error Message */}
      {errMsg && (
        <Alert variant="error" title="Gagal Menghitung">
          {errMsg}
        </Alert>
      )}

      {/* Skip list */}
      {skipList.length > 0 && (
        <Alert variant="warning" title={`${skipList.length} karyawan dilewati`}>
          <ul className="text-xs space-y-0.5 mt-1">
            {skipList.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </Alert>
      )}

      {/* Hasil */}
      {hasilBatch && hasilList.length > 0 && (
        <div className="flex flex-col gap-4">

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total NKKIP', val: formatRupiah(hasilBatch.totalNKKIP),    sub: 'Liabilitas neraca' },
              { label: 'Total Biaya Jasa', val: formatRupiah(hasilBatch.totalBiayaJasa), sub: 'Beban L/R' },
              { label: 'Karyawan Dihitung', val: String(hasilBatch.totalKaryawan), sub: 'dari data input' },
              {
                label: 'Rata-rata NKKIP',
                val: formatRupiah(hasilBatch.totalNKKIP / hasilBatch.totalKaryawan),
                sub: 'per karyawan',
              },
            ].map(({ label, val, sub }) => (
              <Card key={label} className="shadow-sm">
                <CardContent className="pt-4 pb-3">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                  <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">{val}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Header hasil + export */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Hasil Per Karyawan</h2>
              <Badge variant="info">{hasilList.length} karyawan</Badge>
              <Badge variant="default">{formatTanggal(hasilBatch.tanggalPerhitungan)}</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportExcelBatch(hasilBatch)}
                title="Export Excel lengkap"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportExcelRingkas(hasilList, hasilBatch.tanggalPerhitungan)}
                title="Export kertas kerja ringkas"
              >
                <Download className="h-4 w-4 mr-1" />
                KK Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPDFBatch(hasilBatch)}
                title="Export PDF"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>

          {hasilBatch && hasilList.length > 0 && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span>💡</span>
              Klik baris karyawan untuk melihat langkah perhitungan detail
            </p>
          )}

          <HasilTable
            hasilList={hasilList}
            terpilihId={karyawanTerpilih?.input.karyawan.id ?? null}
            onPilih={(h) => {
              if (karyawanTerpilih?.input.karyawan.id === h.input.karyawan.id) {
                setKaryawanTerpilih(null)
              } else {
                setKaryawanTerpilih(h)
                setTimeout(() => {
                  detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }, 100)
              }
            }}
          />
          <JurnalPanel hasilBatch={hasilBatch} />

          {/* Panel detail karyawan terpilih */}
          {karyawanTerpilih && (
            <div ref={detailRef} className="flex flex-col gap-4 pt-2">

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-4 bg-secondary rounded-full" />
                  <h2 className="text-base font-semibold text-gray-900">
                    Detail Perhitungan — {karyawanTerpilih.input.karyawan.nama}
                  </h2>
                </div>
                <button
                  onClick={() => setKaryawanTerpilih(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  ✕ Tutup detail
                </button>
              </div>

              <CalculationSteps hasil={karyawanTerpilih} />

              {karyawanTerpilih.tabelProbabilitas.length > 0 && (
                <ProbabilityTable
                  tabel={karyawanTerpilih.tabelProbabilitas}
                  usiaSekarang={karyawanTerpilih.usiaSekarang}
                />
              )}

              <DetailsTable hasil={karyawanTerpilih} />
              <FSNote hasil={karyawanTerpilih} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
