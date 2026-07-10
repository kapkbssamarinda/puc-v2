"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { formatRupiah, formatFaktor, formatTahunBulan } from '@/lib/format'
import type { HasilPerhitungan, JenisKeluar } from '@/lib/engine/types'

const JENIS_SHORT: Record<JenisKeluar, string> = {
  PENSIUN:           'Pensiun',
  MENGUNDURKAN_DIRI: 'Resign',
  MENINGGAL:         'Meninggal',
  CACAT:             'Cacat',
}

interface Props { hasil: HasilPerhitungan }

export function DetailsTable({ hasil }: Props) {
  const [open, setOpen] = useState(false)
  const { details, metode } = hasil

  if (details.length <= 1) return null
  if (metode !== 'PUC_FULL' && metode !== 'PUC_ECONOMIC') return null

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 text-sm font-medium text-secondary hover:text-blue-700 transition-colors"
      >
        <span className={cn('text-xs transition-transform', open && 'rotate-90')}>▶</span>
        Rincian Perhitungan Per Usia ({details.length} baris)
      </button>

      {open && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-xs divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Usia', 'Jenis', 'MK', 'Proj. Upah', 'PSG', 'UPMK', 'Imbalan', 'Peluang', 'Faktor D', 'Nilai Kini', 'Proporsi', 'NKKIP', 'BJK'].map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      'px-2 py-2 text-left font-semibold text-gray-600 whitespace-nowrap',
                      i === 0 && 'sticky left-0 z-10 bg-gray-50 border-r border-gray-200',
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {details.map((row, i) => (
                <tr key={i} className={cn(
                  'hover:bg-gray-50',
                  row.jenisKeluar === 'PENSIUN' && 'bg-blue-50 font-medium',
                )}>
                  <td className={cn(
                    'px-2 py-1.5 whitespace-nowrap sticky left-0 border-r border-gray-200',
                    row.jenisKeluar === 'PENSIUN' ? 'bg-blue-50' : 'bg-white',
                  )}>{row.usia}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    <span className={cn(
                      'inline-flex rounded px-1 py-0.5',
                      row.jenisKeluar === 'PENSIUN'           && 'bg-blue-100 text-blue-700',
                      row.jenisKeluar === 'MENGUNDURKAN_DIRI' && 'bg-amber-100 text-amber-700',
                      row.jenisKeluar === 'MENINGGAL'         && 'bg-red-100 text-red-700',
                      row.jenisKeluar === 'CACAT'             && 'bg-purple-100 text-purple-700',
                    )}>
                      {JENIS_SHORT[row.jenisKeluar]}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatTahunBulan(row.masaKerja)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatRupiah(row.proyeksiUpah)}</td>
                  <td className="px-2 py-1.5 text-center">{row.faktorPSG}</td>
                  <td className="px-2 py-1.5 text-center">{row.faktorUPMK}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatRupiah(row.proyeksiImbalan)}</td>
                  <td className="px-2 py-1.5">{formatFaktor(row.peluang)}</td>
                  <td className="px-2 py-1.5">{formatFaktor(row.faktorDiskonto)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatRupiah(row.nilaiKini)}</td>
                  <td className="px-2 py-1.5">{formatFaktor(row.proporsiAtribusi)}</td>
                  <td className="px-2 py-1.5 font-semibold whitespace-nowrap">{formatRupiah(row.kontribusiNKKIP)}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{formatRupiah(row.kontribusiBiayaJasa)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-semibold text-gray-800">
              <tr>
                <td colSpan={11} className="px-2 py-2 text-right">Total</td>
                <td className="px-2 py-2 whitespace-nowrap">{formatRupiah(hasil.nkkip)}</td>
                <td className="px-2 py-2 whitespace-nowrap">{formatRupiah(hasil.biayaJasaKini)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
