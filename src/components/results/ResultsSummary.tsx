"use client"

import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Separator } from '@/components/ui/Separator'
import { formatRupiah, formatPersen, formatTanggal } from '@/lib/format'
import type { HasilPerhitungan } from '@/lib/engine/types'

const METODE_LABEL: Record<string, string> = {
  LIQUIDATION:  'Liquidation Basis',
  PUC_SIMPLE:   'PUC Sederhana',
  PUC_ECONOMIC: 'PUC + Asumsi Ekonomi',
  PUC_FULL:     'PUC Komprehensif',
}

const REGULASI_LABEL: Record<string, string> = {
  UUCK_PP35:   'UUCK / PP 35/2021',
  UUK_13_2003: 'UU No. 13/2003',
}

const JENIS_LABEL: Record<string, string> = {
  PENSIUN:           'Pensiun normal',
  MENGUNDURKAN_DIRI: 'Mengundurkan diri',
  MENINGGAL:         'Meninggal dunia',
  CACAT:             'Cacat',
}

interface Props { hasil: HasilPerhitungan }

export function ResultsSummary({ hasil }: Props) {
  const {
    nkkip, biayaJasaKini, biayaBunga, biayaJasaLalu, nkkipSebelumPerubahan,
    nkkipPerJenis, biayaJasaPerJenis,
    metode,
    input: { tanggalPerhitungan, regulasi, asumsiEkonomi, karyawan },
  } = hasil

  const isEcon = metode === 'PUC_ECONOMIC' || metode === 'PUC_FULL'

  return (
    <div className="flex flex-col gap-4">

      {/* Scorecard utama */}
      <Card className="bg-secondary/5 border-secondary/25 shadow-sm">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                  NKKIP (Liabilitas Imbalan Pasca Kerja)
                </span>
                <InfoTooltip text="Nilai yang harus diakui sebagai liabilitas di Laporan Posisi Keuangan (neraca). Merupakan Present Value of Defined Benefit Obligation (PVDBO) pada tanggal pengukuran." />
              </div>
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{formatRupiah(nkkip)}</p>
              <p className="text-xs text-gray-500 mt-1">{karyawan.nama}</p>
            </div>
            <Badge variant="info" className="mt-1 shrink-0 whitespace-nowrap">
              {METODE_LABEL[metode]}
            </Badge>
          </div>

          <Separator className="my-3" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                  Biaya Jasa Kini
                </span>
                <InfoTooltip text="Beban yang diakui di Laporan Laba Rugi periode ini — kenaikan NKKIP akibat satu tahun tambahan masa kerja karyawan." />
              </div>
              <p className="text-xl font-bold text-gray-900 tabular-nums">{formatRupiah(biayaJasaKini)}</p>
            </div>
            {biayaBunga > 0 && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 mb-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                    Biaya Bunga
                  </span>
                  <InfoTooltip text="Interest Cost = tingkat diskonto × NKKIP awal periode. Kenaikan kewajiban karena berlalunya waktu." />
                </div>
                <p className="text-xl font-bold text-gray-700 tabular-nums">{formatRupiah(biayaBunga)}</p>
              </div>
            )}
          </div>

          {biayaJasaLalu !== undefined && (
            <>
              <Separator className="my-3" />
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-widest">
                      Biaya Jasa Lalu (PSC)
                    </span>
                    <InfoTooltip text="Past Service Cost: timbul saat perusahaan mengubah rumusan imbalan. PSC = NKKIP baru − NKKIP lama." />
                  </div>
                  <p className={`text-xl font-bold tabular-nums ${biayaJasaLalu < 0 ? 'text-green-700' : 'text-amber-800'}`}>
                    {formatRupiah(biayaJasaLalu)}
                  </p>
                  {nkkipSebelumPerubahan !== undefined && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      NKKIP sebelum: {formatRupiah(nkkipSebelumPerubahan)}
                      {biayaJasaLalu < 0 ? ' — kewajiban turun' : ' — kewajiban naik'}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator className="my-3" />

          {/* Parameter ringkasan */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {(([
              ['Metode',   METODE_LABEL[metode]],
              ['Regulasi', REGULASI_LABEL[regulasi]],
              ...(isEcon ? [
                ['Diskonto', formatPersen(asumsiEkonomi.tingkatDiskonto * 100)],
                ['Kenaikan gaji', formatPersen(asumsiEkonomi.tingkatKenaikanGaji * 100)],
              ] : []),
              ['Tanggal', formatTanggal(tanggalPerhitungan)],
            ] as [string, string][]).map(([label, val]) => (
              <div key={label} className="flex justify-between gap-1">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-700 text-right">{val}</span>
              </div>
            )))}
          </div>
        </CardContent>
      </Card>

      {/* Interpretasi */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-800 leading-relaxed">
        <strong>NKKIP sebesar {formatRupiah(nkkip)}</strong> merupakan estimasi liabilitas imbalan pasca kerja
        yang harus dicatat di Laporan Posisi Keuangan per {formatTanggal(tanggalPerhitungan)}.
        {biayaJasaKini > 0 && (
          <> <strong>Biaya Jasa Kini sebesar {formatRupiah(biayaJasaKini)}</strong> diakui sebagai beban periode berjalan di Laporan Laba Rugi.</>
        )}
      </div>

      {/* Breakdown per jenis */}
      {Object.keys(nkkipPerJenis).length > 1 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Breakdown NKKIP per Jenis Keluar</p>
          <div className="rounded-lg border border-gray-200 divide-y divide-gray-100">
            {(Object.entries(nkkipPerJenis) as [string, number][]).map(([jenis, val]) => {
              const pct = nkkip > 0 ? val / nkkip * 100 : 0
              return (
                <div key={jenis} className="flex items-center justify-between px-3 py-2 gap-3">
                  <span className="text-sm text-gray-600 shrink-0">{JENIS_LABEL[jenis] ?? jenis}</span>
                  <div className="flex-1 max-w-24 h-1.5 rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-secondary" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-sm font-semibold text-gray-900">{formatRupiah(val)}</span>
                    {biayaJasaPerJenis[jenis as keyof typeof biayaJasaPerJenis] != null && (
                      <p className="text-xs text-gray-500">BJK: {formatRupiah(biayaJasaPerJenis[jenis as keyof typeof biayaJasaPerJenis]!)}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
