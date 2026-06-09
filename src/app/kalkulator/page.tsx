"use client"

import { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { MethodSelector } from '@/components/calculator/MethodSelector'
import { EmployeeForm, type EmployeeFormValues } from '@/components/calculator/EmployeeForm'
import { AssumptionsForm, type AssumptionsFormValues, DEFAULT_ASSUMPTIONS } from '@/components/calculator/AssumptionsForm'
import { ReferenceTable } from '@/components/calculator/ReferenceTable'
import { ResultsSummary } from '@/components/results/ResultsSummary'
import { CalculationSteps } from '@/components/results/CalculationSteps'
import { MethodComparison } from '@/components/results/MethodComparison'
import { ProbabilityTable } from '@/components/results/ProbabilityTable'
import { DetailsTable } from '@/components/results/DetailsTable'
import { FSNote } from '@/components/results/FSNote'
import { RekonsiliasiPanel } from '@/components/results/RekonsiliasiPanel'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Separator } from '@/components/ui/Separator'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { hitung } from '@/lib/engine'
import type {
  MetodePerhitungan, HasilPerhitungan, InputPerhitungan, JenisKeluar,
  InputPerubahanProgram, Regulasi,
} from '@/lib/engine/types'

// ─── State lokal rekonsiliasi NKKIP ───────────────────────────────────────────
interface RekonState {
  nkkipAwal: string
  pembayaran: string
  glTipe: 'keuntungan' | 'kerugian'
  glJumlah: string
}

const RKON_DEFAULT: RekonState = {
  nkkipAwal: '',
  pembayaran: '',
  glTipe: 'keuntungan',
  glJumlah: '',
}

function parseCurrency(s: string | number): number {
  return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0
}

function formatCurrency(n: number): string {
  if (!n) return ''
  return Math.floor(n).toLocaleString('id-ID')
}

// ─── State lokal perubahan program ───────────────────────────────────────────
interface PscState {
  aktif: boolean
  mode: 'langsung' | 'otomatis'
  nkkipSebelum: string
  regulasiSebelum: Regulasi
  persentaseUPHSebelum: string
}

const PSC_DEFAULT: PscState = {
  aktif: false,
  mode: 'langsung',
  nkkipSebelum: '',
  regulasiSebelum: 'UUK_13_2003',
  persentaseUPHSebelum: '15',
}

export default function KalkulatorPage() {
  const [metode,     setMetode]     = useState<MetodePerhitungan>('PUC_ECONOMIC')
  const [empValues,  setEmpValues]  = useState<EmployeeFormValues | null>(null)
  const [empValid,   setEmpValid]   = useState(false)
  const [asumsi,     setAsumsi]     = useState<AssumptionsFormValues>(DEFAULT_ASSUMPTIONS)
  const [psc,        setPsc]        = useState<PscState>(PSC_DEFAULT)
  const [pscOpen,    setPscOpen]    = useState(false)
  const [rkon,       setRkon]       = useState<RekonState>(RKON_DEFAULT)
  const [rkonOpen,   setRkonOpen]   = useState(false)
  const [hasil,      setHasil]      = useState<HasilPerhitungan | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)

  const onEmpChange    = useCallback((v: EmployeeFormValues, valid: boolean) => {
    setEmpValues(v); setEmpValid(valid)
  }, [])
  const onAsumsiChange = useCallback((v: AssumptionsFormValues) => setAsumsi(v), [])

  const showEconomi = metode === 'PUC_ECONOMIC' || metode === 'PUC_FULL'

  const doHitung = () => {
    if (!empValues || !empValid) { setError('Lengkapi data karyawan terlebih dahulu.'); return }
    setLoading(true); setError(null)
    try {
      const jenisImbalan: JenisKeluar[] =
        metode === 'PUC_FULL' ? (asumsi.jenisImbalan as JenisKeluar[]) : ['PENSIUN']

      let perubahanProgram: InputPerubahanProgram | undefined
      if (psc.aktif && showEconomi) {
        if (psc.mode === 'langsung') {
          const nkkipSblm = parseCurrency(psc.nkkipSebelum)
          perubahanProgram = { aktif: true, nkkipSebelum: nkkipSblm > 0 ? nkkipSblm : undefined }
        } else {
          const uphSblm = parseFloat(psc.persentaseUPHSebelum) / 100
          perubahanProgram = {
            aktif: true,
            regulasiSebelum: psc.regulasiSebelum,
            persentaseUPHSebelum: isNaN(uphSblm) ? undefined : uphSblm,
          }
        }
      }

      // Rekonsiliasi input: nkkipAwal dari rkon section (overrides asumsi.nkkipAwalPeriode)
      const rkonNkkipAwal   = parseCurrency(rkon.nkkipAwal)
      const rkonPembayaran  = parseCurrency(rkon.pembayaran)
      const rkonGlJumlah    = parseCurrency(rkon.glJumlah)
      const rkonGl          = rkon.glTipe === 'keuntungan' ? -rkonGlJumlah : rkonGlJumlah

      const hasRkon = showEconomi && rkonOpen && rkonNkkipAwal > 0

      const rekonsiliasiInput = hasRkon ? {
        nkkipAwalPeriode:          rkonNkkipAwal,
        pembayaranImbalanPeriode:  rkonPembayaran > 0 ? rkonPembayaran : undefined,
        keuntunganKerugianAktuaria: rkonGlJumlah > 0 ? rkonGl : undefined,
      } : undefined

      // nkkipAwalPeriode untuk IC: dari rkon jika tersedia, fallback ke asumsi
      const nkkipAwalIC = hasRkon ? rkonNkkipAwal : (asumsi.nkkipAwalPeriode > 0 ? asumsi.nkkipAwalPeriode : undefined)

      const input: InputPerhitungan = {
        karyawan: {
          id:           'k1',
          nama:         empValues.nama,
          tanggalLahir: empValues.tanggalLahir,
          tanggalMasuk: empValues.tanggalMasuk,
          upahBulanan:  parseCurrency(empValues.upahBulanan),
          jenisKelamin: empValues.jenisKelamin,
        },
        tanggalPerhitungan: empValues.tanggalPerhitungan,
        usiaPensiun:   Number(empValues.usiaPensiun),
        regulasi:      asumsi.regulasi,
        metode,
        asumsiEkonomi: {
          tingkatDiskonto:     asumsi.tingkatDiskonto / 100,
          tingkatKenaikanGaji: asumsi.tingkatKenaikanGaji / 100,
        },
        asumsiDemografi: {
          tingkatPengunduranDiri: asumsi.tingkatPengunduranDiri / 100,
          tingkatCacat:  asumsi.gunakanCacat ? 0 : 0.001,
          gunakanMortalita: asumsi.gunakanMortalita,
        },
        jenisImbalanDihitung: jenisImbalan,
        formulaResign: { persentaseUPH: asumsi.persentaseUPH / 100 },
        nkkipAwalPeriode: nkkipAwalIC,
        perubahanProgram,
        rekonsiliasiInput,
      }
      const h = hitung(input)
      setHasil(h)
      setTimeout(() => document.getElementById('hasil-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan saat menghitung.')
    } finally {
      setLoading(false)
    }
  }

  const mkLalu  = empValues && empValid ? (() => {
    const m = new Date(empValues.tanggalMasuk + 'T00:00:00')
    const h = new Date(empValues.tanggalPerhitungan + 'T00:00:00')
    return (h.getTime() - m.getTime()) / (365.25 * 86400000)
  })() : undefined

  const mkTotal = empValues && empValid && empValues.tanggalLahir ? (() => {
    const l = new Date(empValues.tanggalLahir + 'T00:00:00')
    const m = new Date(empValues.tanggalMasuk + 'T00:00:00')
    const usiaMasuk = (m.getTime() - l.getTime()) / (365.25 * 86400000)
    return Number(empValues.usiaPensiun) - usiaMasuk
  })() : undefined

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <div>
        <h1 className="text-xl font-bold text-gray-900">Kalkulator Imbalan Pasca Kerja</h1>
        <p className="text-sm text-gray-500 mt-1">Perhitungan NKKIP dan Biaya Jasa Kini sesuai PSAK 24 / SAK EP</p>
      </div>

      <MethodSelector value={metode} onChange={(m) => { setMetode(m); setHasil(null) }} />

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* Form kiri */}
        <div className="space-y-5">
          <EmployeeForm onChange={onEmpChange} />
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Asumsi &amp; Regulasi</h3>
            <AssumptionsForm metode={metode} onChange={onAsumsiChange} />
          </div>

          {/* Perubahan Program Imbalan — hanya untuk metode ekonomi */}
          {showEconomi && (
            <>
              <Separator />
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPscOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-amber-50 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-amber-800">
                      Perubahan Program Imbalan (Opsional)
                    </span>
                    <InfoTooltip
                      text="Biaya Jasa Lalu = NKKIP baru − NKKIP lama. Timbul saat perusahaan mengubah rumusan pesangon (misal: pindah dari UUK 13/2003 ke UUCK PP35)."
                      side="right"
                    />
                  </div>
                  {pscOpen ? (
                    <ChevronUp className="h-4 w-4 text-amber-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-amber-600 shrink-0" />
                  )}
                </button>

                {pscOpen && (
                  <div className="p-4 flex flex-col gap-4">
                    {/* Toggle aktif */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={psc.aktif}
                        onChange={(e) => setPsc((s) => ({ ...s, aktif: e.target.checked }))}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-sm text-gray-700">Ada perubahan rumusan imbalan periode ini?</span>
                    </label>

                    {psc.aktif && (
                      <div className="flex flex-col gap-3 pl-6">
                        {/* Mode */}
                        <div className="flex gap-4">
                          {(['langsung', 'otomatis'] as const).map((m) => (
                            <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                value={m}
                                checked={psc.mode === m}
                                onChange={() => setPsc((s) => ({ ...s, mode: m }))}
                                className="text-amber-500 focus:ring-amber-400"
                              />
                              <span className="text-sm text-gray-700">
                                {m === 'langsung' ? 'Input NKKIP lama langsung' : 'Hitung otomatis dari parameter lama'}
                              </span>
                            </label>
                          ))}
                        </div>

                        {psc.mode === 'langsung' ? (
                          <Input
                            label="NKKIP sebelum perubahan"
                            prefix="Rp"
                            placeholder="Masukkan NKKIP dari laporan periode lalu"
                            containerClassName="max-w-xs"
                            value={formatCurrency(parseCurrency(psc.nkkipSebelum))}
                            onChange={(e) => setPsc((s) => ({
                              ...s,
                              nkkipSebelum: String(parseCurrency(e.target.value) || ''),
                            }))}
                          />
                        ) : (
                          <div className="flex flex-col gap-3">
                            <Select
                              label="Regulasi sebelum perubahan"
                              value={psc.regulasiSebelum}
                              onChange={(e) => setPsc((s) => ({ ...s, regulasiSebelum: e.target.value as Regulasi }))}
                            >
                              <option value="UUCK_PP35">UUCK / PP 35/2021</option>
                              <option value="UUK_13_2003">UU No. 13/2003</option>
                            </Select>
                            <Input
                              label="Persentase UPisah sebelum perubahan"
                              type="number"
                              step="1"
                              min={0}
                              max={100}
                              suffix="%"
                              containerClassName="max-w-xs"
                              value={psc.persentaseUPHSebelum}
                              onChange={(e) => setPsc((s) => ({ ...s, persentaseUPHSebelum: e.target.value }))}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Rekonsiliasi NKKIP Lengkap — hanya untuk metode ekonomi */}
          {showEconomi && (
            <>
              <Separator />
              <div className="rounded-lg border border-blue-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setRkonOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-800">
                      Rekonsiliasi NKKIP Lengkap (Opsional)
                    </span>
                    <InfoTooltip
                      text="Isi bagian ini untuk menghasilkan tabel rekonsiliasi NKKIP sesuai format pengungkapan PSAK 24: NKKIP Awal + BJK + Bunga + PSC ± GL − Pembayaran = NKKIP Akhir."
                      side="right"
                    />
                  </div>
                  {rkonOpen ? (
                    <ChevronUp className="h-4 w-4 text-blue-600 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-blue-600 shrink-0" />
                  )}
                </button>

                {rkonOpen && (
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5">
                      Jika NKKIP Awal diisi, kolom Rekonsiliasi akan muncul di hasil dan ekspor Excel.
                      NKKIP Awal di sini juga otomatis digunakan untuk menghitung Biaya Bunga (IC).
                    </p>

                    <Input
                      label="NKKIP Awal Periode"
                      prefix="Rp"
                      placeholder="Saldo NKKIP dari laporan periode lalu"
                      value={formatCurrency(parseCurrency(rkon.nkkipAwal))}
                      onChange={(e) => setRkon((s) => ({
                        ...s, nkkipAwal: String(parseCurrency(e.target.value) || ''),
                      }))}
                    />

                    <div className="flex gap-2 items-end">
                      <div className="flex items-end gap-1">
                        <Select
                          label="Jenis GL Aktuaria"
                          value={rkon.glTipe}
                          onChange={(e) => setRkon((s) => ({
                            ...s, glTipe: e.target.value as 'keuntungan' | 'kerugian',
                          }))}
                        >
                          <option value="keuntungan">Keuntungan Aktuaria — mengurangi NKKIP</option>
                          <option value="kerugian">Kerugian Aktuaria — menambah NKKIP</option>
                        </Select>
                        <InfoTooltip
                          text="Keuntungan aktuaria (negatif) terjadi saat asumsi lebih baik dari perkiraan — misalnya tingkat diskonto naik atau karyawan lebih banyak yang resign. Kerugian aktuaria (positif) terjadi sebaliknya. Keduanya diakui di OCI, bukan P&L."
                          side="right"
                        />
                      </div>
                      <Input
                        label="Jumlah GL Aktuaria"
                        prefix="Rp"
                        placeholder="0"
                        containerClassName="flex-1"
                        value={formatCurrency(parseCurrency(rkon.glJumlah))}
                        onChange={(e) => setRkon((s) => ({
                          ...s, glJumlah: String(parseCurrency(e.target.value) || ''),
                        }))}
                      />
                    </div>

                    <Input
                      label="Pembayaran Imbalan Periode Ini"
                      prefix="Rp"
                      placeholder="0 jika tidak ada pembayaran"
                      value={formatCurrency(parseCurrency(rkon.pembayaran))}
                      onChange={(e) => setRkon((s) => ({
                        ...s, pembayaran: String(parseCurrency(e.target.value) || ''),
                      }))}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <ReferenceTable masaKerjaLalu={mkLalu} masaKerjaTotal={mkTotal} />
          {error && <Alert variant="error">{error}</Alert>}
          <Button size="lg" className="w-full" onClick={doHitung} loading={loading} disabled={!empValid}>
            {loading ? 'Menghitung…' : 'Hitung Kewajiban'}
          </Button>
        </div>

        {/* Hasil kanan — sticky */}
        <div className="lg:sticky lg:top-20 space-y-4">
          {hasil ? (
            <>
              {hasil.warnings && hasil.warnings.length > 0 && (
                <Alert variant="warning" title="Perhatian Asumsi">
                  <ul className="text-xs space-y-0.5 mt-1">
                    {hasil.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </Alert>
              )}
              <ResultsSummary hasil={hasil} />
              {hasil.rekonsiliasi && (
                <RekonsiliasiPanel rekonsiliasi={hasil.rekonsiliasi} />
              )}
            </>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-4xl mb-3 opacity-30">📊</p>
              <p className="text-sm text-gray-400">Hasil akan muncul di sini setelah klik &ldquo;Hitung&rdquo;</p>
            </div>
          )}
        </div>
      </div>

      {hasil && (
        <div id="hasil-section" className="space-y-6 pt-4 border-t border-gray-200">
          <CalculationSteps hasil={hasil} />
          <MethodComparison input={hasil.input} metodeSaat={metode} />
          {hasil.tabelProbabilitas.length > 0 && (
            <ProbabilityTable tabel={hasil.tabelProbabilitas} usiaSekarang={hasil.usiaSekarang} />
          )}
          <DetailsTable hasil={hasil} />
          <FSNote hasil={hasil} />
        </div>
      )}

    </div>
  )
}
