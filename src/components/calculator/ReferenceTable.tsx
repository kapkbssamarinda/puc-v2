"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getFaktorPSG, getFaktorUPMK } from '@/lib/engine/tables'

const PSG_ROWS: [string, number][] = [
  ['< 1', 1], ['1', 2], ['2', 3], ['3', 4], ['4', 5],
  ['5', 6], ['6', 7], ['7', 8], ['≥ 8', 9],
]

const UPMK_ROWS: [string, number][] = [
  ['< 3', 0], ['3', 2], ['6', 3], ['9', 4], ['12', 5],
  ['15', 6], ['18', 7], ['21', 8], ['≥ 24', 10],
]

interface Props {
  masaKerjaLalu?: number
  masaKerjaTotal?: number
}

export function ReferenceTable({ masaKerjaLalu, masaKerjaTotal }: Props) {
  const [open, setOpen] = useState(false)

  const psgLalu  = masaKerjaLalu  != null ? getFaktorPSG(masaKerjaLalu)  : null
  const psgTotal = masaKerjaTotal != null ? getFaktorPSG(masaKerjaTotal) : null
  const upmkTotal = masaKerjaTotal != null ? getFaktorUPMK(masaKerjaTotal) : null

  function isActivePSG(mk: string): boolean {
    if (psgTotal == null) return false
    const floor = masaKerjaTotal != null ? Math.floor(masaKerjaTotal) : -1
    if (mk === '< 1') return floor < 1
    if (mk === '≥ 8') return floor >= 8
    return floor === parseInt(mk)
  }

  function isActiveUPMK(mk: string): boolean {
    if (upmkTotal == null) return false
    const floor = masaKerjaTotal != null ? Math.floor(masaKerjaTotal) : -1
    if (mk === '< 3') return floor < 3
    if (mk === '≥ 24') return floor >= 24
    return floor === parseInt(mk)
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-medium text-gray-700">Tabel Referensi PSG &amp; UPMK</span>
        <span className={cn('text-gray-500 transition-transform text-xs', open && 'rotate-180')}>▼</span>
      </button>

      {open && (
        <div className="p-4 space-y-4">
          {/* Highlight */}
          {masaKerjaTotal != null && (
            <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
              Dengan masa kerja total{' '}
              <span className="font-semibold">{Math.floor(masaKerjaTotal)} tahun</span>:{' '}
              PSG = <span className="font-semibold">{psgTotal}×</span> upah,{' '}
              UPMK = <span className="font-semibold">{upmkTotal}×</span> upah
            </div>
          )}
          {masaKerjaLalu != null && psgLalu != null && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              Masa kerja lalu{' '}
              <span className="font-semibold">{Math.floor(masaKerjaLalu)} tahun</span>:{' '}
              PSG = <span className="font-semibold">{psgLalu}×</span> upah
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PSG */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Uang Pesangon (PSG) — PP 35/2021</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-2 py-1 font-medium text-gray-600">Masa Kerja (tahun)</th>
                    <th className="text-right px-2 py-1 font-medium text-gray-600">Bulan Gaji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {PSG_ROWS.map(([mk, bulan]) => (
                    <tr
                      key={mk}
                      className={cn(
                        isActivePSG(mk) ? 'bg-blue-50 font-semibold text-blue-800' : 'text-gray-700',
                      )}
                    >
                      <td className="px-2 py-1">{mk}</td>
                      <td className="px-2 py-1 text-right">{bulan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* UPMK */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Uang Penghargaan Masa Kerja (UPMK)</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-2 py-1 font-medium text-gray-600">Masa Kerja (tahun)</th>
                    <th className="text-right px-2 py-1 font-medium text-gray-600">Bulan Gaji</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {UPMK_ROWS.map(([mk, bulan]) => (
                    <tr
                      key={mk}
                      className={cn(
                        isActiveUPMK(mk) ? 'bg-blue-50 font-semibold text-blue-800' : 'text-gray-700',
                      )}
                    >
                      <td className="px-2 py-1">{mk}</td>
                      <td className="px-2 py-1 text-right">{bulan === 0 ? '—' : bulan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Catatan: lompatan UPMK dari 8 ke 10 bulan di MK ≥ 24 tahun menentukan jendela atribusi maksimum (24 tahun) sesuai DSAK IAI April 2022.
          </p>
        </div>
      )}
    </div>
  )
}
