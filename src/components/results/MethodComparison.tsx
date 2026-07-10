"use client"

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah, formatPersen } from '@/lib/format'
import { hitung } from '@/lib/engine'
import { cn } from '@/lib/utils'
import type { InputPerhitungan, MetodePerhitungan, HasilPerhitungan } from '@/lib/engine/types'

const METODE_LIST: MetodePerhitungan[] = ['LIQUIDATION', 'PUC_SIMPLE', 'PUC_ECONOMIC', 'PUC_FULL']

const METODE_META: Record<MetodePerhitungan, { label: string; bg: string }> = {
  LIQUIDATION:  { label: 'Liquidation',    bg: 'bg-slate-400' },
  PUC_SIMPLE:   { label: 'PUC Sederhana',  bg: 'bg-blue-400' },
  PUC_ECONOMIC: { label: 'PUC Ekonomi',    bg: 'bg-secondary' },
  PUC_FULL:     { label: 'PUC Penuh',      bg: 'bg-blue-700' },
}

interface Props {
  input: InputPerhitungan
  metodeSaat: MetodePerhitungan
}

export function MethodComparison({ input, metodeSaat }: Props) {
  const hasilList = useMemo<(HasilPerhitungan | null)[]>(() => {
    return METODE_LIST.map((m) => {
      try {
        return hitung({ ...input, metode: m })
      } catch {
        return null
      }
    })
  }, [input])

  const validList = hasilList.filter((h): h is HasilPerhitungan => h !== null)
  const maxNKKIP  = Math.max(...validList.map((h) => h.nkkip), 1)
  const maxBJK    = Math.max(...validList.map((h) => h.biayaJasaKini), 1)
  const baseline  = hasilList[0]?.nkkip ?? 1

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm">Perbandingan 4 Metode</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-4">

        {/* Bar chart horizontal (CSS) */}
        <div>
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">NKKIP per Metode</p>
          <div className="flex flex-col gap-2">
            {METODE_LIST.map((m, i) => {
              const h   = hasilList[i]
              const meta = METODE_META[m]
              const pct = h ? (h.nkkip / maxNKKIP) * 100 : 0
              const isCurrent = m === metodeSaat
              return (
                <div key={m} className="flex items-center gap-3">
                  <span className={`text-[11px] text-gray-500 w-24 shrink-0 text-right ${isCurrent ? 'font-bold text-gray-900' : ''}`}>
                    {meta.label}
                  </span>
                  <div className="flex-1 h-6 rounded bg-gray-100 relative overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-500 ${meta.bg} ${isCurrent ? 'opacity-100' : 'opacity-60'}`}
                      style={{ width: `${pct}%` }}
                    />
                    {h && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-white mix-blend-difference">
                        {formatRupiah(h.nkkip)}
                      </span>
                    )}
                    {!h && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">N/A</span>
                    )}
                  </div>
                  {isCurrent && <Badge variant="info" className="text-[10px] py-0.5 shrink-0">Aktif</Badge>}
                </div>
              )
            })}
          </div>
        </div>

        {/* Tabel ringkasan */}
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-semibold">Metode</th>
                <th className="text-right px-3 py-2 font-semibold">NKKIP</th>
                <th className="text-right px-3 py-2 font-semibold">Biaya Jasa</th>
                <th className="text-right px-3 py-2 font-semibold hidden sm:table-cell">vs Liquidation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {METODE_LIST.map((m, i) => {
                const h         = hasilList[i]
                const meta      = METODE_META[m]
                const isCurrent = m === metodeSaat
                const delta     = h && baseline > 0 ? (h.nkkip - baseline) / baseline * 100 : null
                const isRef     = m === 'LIQUIDATION'
                return (
                  <tr key={m} className={isCurrent ? 'bg-blue-50 font-medium' : ''}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('inline-block h-2.5 w-2.5 rounded-sm shrink-0', meta.bg)} />
                        <span className="text-gray-700">{meta.label}</span>
                        {isCurrent && <Badge variant="info" className="text-[10px] py-0.5">Aktif</Badge>}
                      </div>
                    </td>
                    <td className="text-right px-3 py-2 tabular-nums text-gray-900">
                      {h ? formatRupiah(h.nkkip) : '—'}
                    </td>
                    <td className="text-right px-3 py-2 tabular-nums text-gray-700">
                      {h ? formatRupiah(h.biayaJasaKini) : '—'}
                    </td>
                    <td className="text-right px-3 py-2 hidden sm:table-cell">
                      {isRef || delta === null ? (
                        <span className="text-gray-500 text-xs">—</span>
                      ) : (
                        <span className={delta >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                          {delta >= 0 ? '+' : ''}{formatPersen(delta)}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td colSpan={2} className="px-3 py-1.5 text-xs text-gray-500">
                  Max BJK =&nbsp;
                  <span className="font-medium text-gray-600">{formatRupiah(maxBJK)}</span>
                </td>
                <td colSpan={2} className="px-3 py-1.5 text-xs text-gray-500 text-right">
                  Baseline = Liquidation
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          Perbandingan di atas menggunakan parameter yang sama untuk semua metode.
          PSAK 24 mensyaratkan minimal <strong>PUC Ekonomi</strong> untuk pelaporan kepada publik.
        </p>
      </CardContent>
    </Card>
  )
}
