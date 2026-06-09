"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatFaktor, formatPersen } from '@/lib/format'
import type { ProbabilitasOlahan } from '@/lib/engine/types'

interface Props {
  tabel: ProbabilitasOlahan[]
  usiaSekarang?: number
}

export function ProbabilityTable({ tabel, usiaSekarang }: Props) {
  const [terbuka, setTerbuka] = useState(false)

  if (!tabel || tabel.length === 0) return null

  return (
    <Card>
      <CardHeader
        className="py-3 px-4 cursor-pointer select-none flex flex-row items-center justify-between gap-2"
        onClick={() => setTerbuka((p) => !p)}
      >
        <CardTitle className="text-sm">Tabel Probabilitas Multiple Decrement</CardTitle>
        <span className="text-xs text-gray-400">{terbuka ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
      </CardHeader>

      {terbuka && (
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr className="text-gray-500 uppercase tracking-wide border-b border-gray-200">
                  <th className="text-center px-3 py-2 font-semibold">Usia</th>
                  <th className="text-right px-3 py-2 font-semibold">Aktif</th>
                  <th className="text-right px-3 py-2 font-semibold">Pensiun</th>
                  <th className="text-right px-3 py-2 font-semibold">Meninggal</th>
                  <th className="text-right px-3 py-2 font-semibold">Cacat</th>
                  <th className="text-right px-3 py-2 font-semibold">Resign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tabel.map((baris) => {
                  const isSekarang = usiaSekarang !== undefined
                    && Math.floor(baris.usia) === Math.floor(usiaSekarang)
                  return (
                    <tr
                      key={baris.usia}
                      className={
                        isSekarang
                          ? 'bg-blue-50 font-semibold'
                          : 'hover:bg-gray-50'
                      }
                    >
                      <td className="text-center px-3 py-1.5 text-gray-700">
                        {baris.usia}
                        {isSekarang && <span className="ml-1 text-[10px] text-blue-500">← saat ini</span>}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums text-gray-800">
                        {formatFaktor(baris.peluangTetapBekerja)}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums">
                        {baris.peluangPensiun > 0
                          ? <span className="text-emerald-700">{formatFaktor(baris.peluangPensiun)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums">
                        {baris.peluangMeninggal > 0
                          ? <span className="text-red-500">{formatPersen(baris.peluangMeninggal * 100, 4)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums">
                        {baris.peluangCacat > 0
                          ? <span className="text-orange-500">{formatPersen(baris.peluangCacat * 100, 4)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-right px-3 py-1.5 tabular-nums">
                        {baris.peluangUndurDiri > 0
                          ? <span className="text-violet-600">{formatFaktor(baris.peluangUndurDiri)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400">
            Mortalita: TMI-2019 (Tabel Mortalitas Indonesia 2019) · Cacat: 10% × TMI-2019[usia]
          </div>
        </CardContent>
      )}
    </Card>
  )
}
