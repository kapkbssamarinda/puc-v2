"use client"

import { useState, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardContent } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { AssumptionsForm, type AssumptionsFormValues, DEFAULT_ASSUMPTIONS } from '@/components/calculator/AssumptionsForm'
import { MethodSelector } from '@/components/calculator/MethodSelector'
import { formatRupiah } from '@/lib/format'
import { hitungEstimasi } from '@/lib/engine'
import type { MetodePerhitungan, HasilBatch, InputEstimasi, DistribusiBucket } from '@/lib/engine/types'

// ─── Bucket distribusi default ──────────────────────────
const DEFAULT_BUCKETS: { label: string; usia: string; mk: string; upah: string; jumlah: string }[] = [
  { label: '< 30 tahun',   usia: '27', mk: '3',  upah: '4000000',  jumlah: '' },
  { label: '30–39 tahun',  usia: '35', mk: '8',  upah: '6000000',  jumlah: '' },
  { label: '40–49 tahun',  usia: '45', mk: '15', upah: '8000000',  jumlah: '' },
  { label: '50–54 tahun',  usia: '52', mk: '20', upah: '10000000', jumlah: '' },
  { label: '≥ 55 tahun',   usia: '57', mk: '25', upah: '12000000', jumlah: '' },
]

function parseCurrency(s: string): number {
  return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0
}

function formatCurrencyInput(v: string): string {
  const n = parseCurrency(v)
  return n > 0 ? n.toLocaleString('id-ID') : v
}

// ─── Hasil batch summary ─────────────────────────────────
function BatchResult({ hasil, buckets }: { hasil: HasilBatch; buckets?: typeof DEFAULT_BUCKETS }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border-l-4 border-secondary rounded-l-none">
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total NKKIP (DBO)</p>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(hasil.totalNKKIP)}</p>
            <p className="text-xs text-gray-400 mt-1">{hasil.totalKaryawan} karyawan</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Biaya Jasa Kini</p>
            <p className="text-2xl font-bold text-gray-900">{formatRupiah(hasil.totalBiayaJasa)}</p>
            <p className="text-xs text-gray-400 mt-1">per tahun</p>
          </CardContent>
        </Card>
      </div>

      {/* Per karyawan rata-rata */}
      {hasil.totalKaryawan > 0 && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
          <span className="text-gray-500">Rata-rata per karyawan: </span>
          <span className="font-semibold text-gray-800">
            {formatRupiah(hasil.totalNKKIP / hasil.totalKaryawan)}
          </span>
          <span className="text-gray-400 ml-2">(NKKIP)</span>
        </div>
      )}

      {/* Breakdown per bucket jika distribusi */}
      {hasil.hasil.length > 1 && buckets && (
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Breakdown per Kelompok</p>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Kelompok', 'Jumlah', 'NKKIP', 'Biaya Jasa', '% dari Total'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {hasil.hasil.map((h, i) => {
                  const b = buckets[i]
                  const pct = hasil.totalNKKIP > 0 ? (h.nkkip / hasil.totalNKKIP * 100).toFixed(1) : '0'
                  const jumlah = parseInt(b?.jumlah || '0')
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{b?.label ?? `Bucket ${i+1}`}</td>
                      <td className="px-3 py-2 text-gray-600">{jumlah}</td>
                      <td className="px-3 py-2 font-semibold">{formatRupiah(h.nkkip)}</td>
                      <td className="px-3 py-2">{formatRupiah(h.biayaJasaKini)}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span>{pct}%</span>
                          <div className="flex-1 h-1.5 rounded-full bg-gray-200 max-w-20">
                            <div
                              className="h-1.5 rounded-full bg-secondary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td className="px-3 py-2">Total</td>
                  <td className="px-3 py-2">{hasil.totalKaryawan}</td>
                  <td className="px-3 py-2">{formatRupiah(hasil.totalNKKIP)}</td>
                  <td className="px-3 py-2">{formatRupiah(hasil.totalBiayaJasa)}</td>
                  <td className="px-3 py-2">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <Alert variant="warning" title="Keterbatasan estimasi">
        Hasil ini dihitung menggunakan data rata-rata dan memiliki tingkat ketidakpastian
        yang lebih tinggi dibandingkan perhitungan per karyawan individual.
        Gunakan sebagai estimasi awal, bukan angka final.
      </Alert>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────
export default function EstimasiPage() {
  const [metode,  setMetode]  = useState<MetodePerhitungan>('PUC_ECONOMIC')
  const [asumsi,  setAsumsi]  = useState<AssumptionsFormValues>(DEFAULT_ASSUMPTIONS)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [hasilMode1, setHasilMode1] = useState<HasilBatch | null>(null)
  const [hasilMode2, setHasilMode2] = useState<HasilBatch | null>(null)

  // Mode 1 — rata-rata tunggal
  const [m1, setM1] = useState({
    jumlah: '', usia: '', mk: '', upah: '', pensiun: '55',
  })

  // Mode 2 — distribusi 5 bucket
  const [buckets, setBuckets] = useState(DEFAULT_BUCKETS)
  const [pensiun2, setPensiun2] = useState('55')

  const onAsumsiChange = useCallback((v: AssumptionsFormValues) => setAsumsi(v), [])

  const buildBaseInput = (usiaPensiun: number): Omit<InputEstimasi, 'jumlahKaryawan' | 'rataRataUsia' | 'rataRataMasaKerja' | 'rataRataUpah' | 'gunakanDistribusi'> => ({
    tanggalPerhitungan: '2024-12-31',
    usiaPensiun,
    regulasi:  asumsi.regulasi,
    metode,
    asumsiEkonomi: {
      tingkatDiskonto:     asumsi.tingkatDiskonto / 100,
      tingkatKenaikanGaji: asumsi.tingkatKenaikanGaji / 100,
    },
    asumsiDemografi: {
      tingkatPengunduranDiri: asumsi.tingkatPengunduranDiri / 100,
      tingkatCacat: asumsi.gunakanCacat ? 0 : 0.001,
      gunakanMortalita: asumsi.gunakanMortalita,
    },
  })

  const hitungMode1 = () => {
    const jumlah = parseInt(m1.jumlah)
    const usia   = parseFloat(m1.usia)
    const mk     = parseFloat(m1.mk)
    const upah   = parseCurrency(m1.upah)
    const pensiun = parseInt(m1.pensiun)

    if (!jumlah || !usia || !mk || !upah) { setError('Lengkapi semua field untuk Mode 1.'); return }
    setLoading(true); setError(null)
    try {
      const input: InputEstimasi = {
        ...buildBaseInput(pensiun),
        jumlahKaryawan:   jumlah,
        rataRataUsia:     usia,
        rataRataMasaKerja: mk,
        rataRataUpah:     upah,
        gunakanDistribusi: false,
      }
      setHasilMode1(hitungEstimasi(input))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.')
    } finally { setLoading(false) }
  }

  const hitungMode2 = () => {
    const filled = buckets.filter(b => parseInt(b.jumlah) > 0)
    if (filled.length === 0) { setError('Isi minimal satu kelompok dengan jumlah karyawan > 0.'); return }
    setLoading(true); setError(null)
    try {
      const distribusi: DistribusiBucket[] = filled.map(b => ({
        label:            b.label,
        jumlahKaryawan:   parseInt(b.jumlah),
        rataRataUsia:     parseFloat(b.usia),
        rataRataMasaKerja: parseFloat(b.mk),
        rataRataUpah:     parseCurrency(b.upah),
      }))
      const totalKaryawan = distribusi.reduce((s, d) => s + d.jumlahKaryawan, 0)
      const input: InputEstimasi = {
        ...buildBaseInput(parseInt(pensiun2)),
        jumlahKaryawan:   totalKaryawan,
        rataRataUsia:     distribusi.reduce((s, d) => s + d.rataRataUsia * d.jumlahKaryawan, 0) / totalKaryawan,
        rataRataMasaKerja: distribusi.reduce((s, d) => s + d.rataRataMasaKerja * d.jumlahKaryawan, 0) / totalKaryawan,
        rataRataUpah:     distribusi.reduce((s, d) => s + d.rataRataUpah * d.jumlahKaryawan, 0) / totalKaryawan,
        gunakanDistribusi: true,
        distribusi,
      }
      setHasilMode2(hitungEstimasi(input))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan.')
    } finally { setLoading(false) }
  }

  const totalBucket = buckets.reduce((s, b) => s + (parseInt(b.jumlah) || 0), 0)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Estimasi Rata-rata Karyawan</h1>
        <p className="text-sm text-gray-500 mt-1">
          Estimasi total liabilitas saat data individual belum tersedia
        </p>
      </div>

      <Alert variant="info" title="Kapan menggunakan estimasi?">
        Gunakan halaman ini saat Anda hanya memiliki data agregat (rata-rata usia, MK, upah)
        dan belum memiliki data per karyawan. Akurasi lebih rendah dibandingkan perhitungan individual.
      </Alert>

      {/* Metode & Asumsi */}
      <div className="space-y-4">
        <MethodSelector value={metode} onChange={(m) => { setMetode(m); setHasilMode1(null); setHasilMode2(null) }} />
        <Separator />
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Asumsi &amp; Regulasi</h3>
          <AssumptionsForm metode={metode} onChange={onAsumsiChange} />
        </div>
      </div>

      <Separator />

      {/* Tabs mode */}
      <Tabs defaultValue="rata-rata">
        <TabsList>
          <TabsTrigger value="rata-rata">Mode 1: Rata-rata Tunggal</TabsTrigger>
          <TabsTrigger value="distribusi">Mode 2: Distribusi 5 Kelompok</TabsTrigger>
        </TabsList>

        {/* MODE 1 */}
        <TabsContent value="rata-rata">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Jumlah karyawan"
                type="number"
                min={1}
                placeholder="100"
                value={m1.jumlah}
                onChange={e => setM1(v => ({ ...v, jumlah: e.target.value }))}
              />
              <Input
                label="Rata-rata usia"
                type="number"
                step="0.1"
                min={18}
                max={65}
                suffix="tahun"
                placeholder="40"
                value={m1.usia}
                onChange={e => setM1(v => ({ ...v, usia: e.target.value }))}
              />
              <Input
                label="Rata-rata masa kerja"
                type="number"
                step="0.1"
                min={0}
                suffix="tahun"
                placeholder="10"
                value={m1.mk}
                onChange={e => setM1(v => ({ ...v, mk: e.target.value }))}
              />
              <Input
                label="Rata-rata upah/bulan"
                prefix="Rp"
                placeholder="7.000.000"
                value={m1.upah ? formatCurrencyInput(m1.upah) : ''}
                onChange={e => setM1(v => ({ ...v, upah: String(parseCurrency(e.target.value) || '') }))}
              />
              <Input
                label="Usia pensiun"
                type="number"
                min={45}
                max={65}
                suffix="tahun"
                value={m1.pensiun}
                onChange={e => setM1(v => ({ ...v, pensiun: e.target.value }))}
              />
            </div>

            {error && <Alert variant="error">{error}</Alert>}
            <Button onClick={hitungMode1} loading={loading} size="lg">
              Hitung Estimasi
            </Button>

            {hasilMode1 && <BatchResult hasil={hasilMode1} />}
          </div>
        </TabsContent>

        {/* MODE 2 */}
        <TabsContent value="distribusi">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                label="Usia pensiun"
                type="number"
                min={45}
                max={65}
                suffix="tahun"
                containerClassName="max-w-xs"
                value={pensiun2}
                onChange={e => setPensiun2(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Kelompok</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Jumlah Karyawan</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Rata-rata Usia</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Rata-rata MK (thn)</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Rata-rata Upah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {buckets.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{b.label}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={b.jumlah}
                          onChange={e => setBuckets(prev => prev.map((r, j) => j === i ? { ...r, jumlah: e.target.value } : r))}
                          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.5"
                          value={b.usia}
                          onChange={e => setBuckets(prev => prev.map((r, j) => j === i ? { ...r, usia: e.target.value } : r))}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.5"
                          value={b.mk}
                          onChange={e => setBuckets(prev => prev.map((r, j) => j === i ? { ...r, mk: e.target.value } : r))}
                          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={b.upah ? formatCurrencyInput(b.upah) : ''}
                          onChange={e => {
                            const raw = String(parseCurrency(e.target.value) || '')
                            setBuckets(prev => prev.map((r, j) => j === i ? { ...r, upah: raw } : r))
                          }}
                          className="w-36 rounded border border-gray-300 px-2 py-1 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2">{totalBucket.toLocaleString('id-ID')}</td>
                    <td colSpan={3} className="px-3 py-2 text-gray-400 text-xs">karyawan</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {error && <Alert variant="error">{error}</Alert>}
            <Button onClick={hitungMode2} loading={loading} size="lg" disabled={totalBucket === 0}>
              Hitung Estimasi Distribusi
            </Button>

            {hasilMode2 && <BatchResult hasil={hasilMode2} buckets={buckets} />}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
