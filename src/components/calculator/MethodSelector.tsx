"use client"

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { MetodePerhitungan } from '@/lib/engine/types'

interface MethodConfig {
  id: MetodePerhitungan
  nama: string
  deskripsi: string
  badge: string
  badgeVariant: 'muted' | 'info' | 'success' | 'purple'
  fitur: [string, boolean][]
  recommended?: boolean
}

const METODE_CONFIG: MethodConfig[] = [
  {
    id: 'LIQUIDATION',
    nama: 'Liquidation Basis',
    deskripsi: 'Hitung berapa pesangon yang harus dibayar jika perusahaan tutup hari ini. Gunakan gaji dan masa kerja saat ini saja.',
    badge: 'Paling Sederhana',
    badgeVariant: 'muted',
    fitur: [
      ['Proyeksi masa kerja mendatang', false],
      ['Kenaikan gaji', false],
      ['Nilai waktu uang (diskonto)', false],
      ['Peluang berhenti sebelum pensiun', false],
    ],
  },
  {
    id: 'PUC_SIMPLE',
    nama: 'PUC Sederhana',
    deskripsi: 'Proyeksikan manfaat berdasarkan total masa kerja hingga pensiun, tetapi tidak memperhitungkan kenaikan gaji atau nilai waktu uang.',
    badge: 'Sederhana',
    badgeVariant: 'info',
    fitur: [
      ['Proyeksi masa kerja mendatang', true],
      ['Kenaikan gaji', false],
      ['Nilai waktu uang (diskonto)', false],
      ['Peluang berhenti sebelum pensiun', false],
    ],
  },
  {
    id: 'PUC_ECONOMIC',
    nama: 'PUC + Asumsi Ekonomi',
    deskripsi: 'Proyeksikan kenaikan gaji di masa depan dan hitung nilai kini (diskonto) dari kewajiban. Memenuhi persyaratan SAK EP.',
    badge: 'Direkomendasikan ✓',
    badgeVariant: 'success',
    recommended: true,
    fitur: [
      ['Proyeksi masa kerja mendatang', true],
      ['Kenaikan gaji', true],
      ['Nilai waktu uang (diskonto)', true],
      ['Peluang berhenti sebelum pensiun', false],
    ],
  },
  {
    id: 'PUC_FULL',
    nama: 'PUC Komprehensif',
    deskripsi: 'Metode aktuarial penuh. Memperhitungkan probabilitas resign, meninggal, cacat, dan pensiun menggunakan tabel mortalita TMI-2019.',
    badge: 'Paling Akurat',
    badgeVariant: 'purple',
    fitur: [
      ['Proyeksi masa kerja mendatang', true],
      ['Kenaikan gaji', true],
      ['Nilai waktu uang (diskonto)', true],
      ['Peluang berhenti sebelum pensiun', true],
    ],
  },
]

interface MethodSelectorProps {
  value: MetodePerhitungan
  onChange: (v: MetodePerhitungan) => void
}

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-3">Pilih Metode Perhitungan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {METODE_CONFIG.map((m) => {
          const active = value === m.id
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              className={cn(
                'relative flex flex-col gap-2 rounded-lg border-2 p-4 text-left transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
                active
                  ? m.recommended
                    ? 'border-green-500 bg-green-50 shadow-sm'
                    : 'border-secondary bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              )}
              aria-pressed={active}
            >
              {m.recommended && (
                <span className="absolute top-2 right-2 text-[10px] font-semibold text-green-600 bg-green-100 border border-green-200 rounded px-1.5 py-0.5">
                  SAK EP
                </span>
              )}
              <div className="flex items-start gap-2">
                <div className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                  active
                    ? m.recommended ? 'border-green-500 bg-green-500' : 'border-secondary bg-secondary'
                    : 'border-gray-300',
                )}>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-900">{m.nama}</span>
                    <Badge variant={m.badgeVariant}>{m.badge}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{m.deskripsi}</p>
                </div>
              </div>
              <ul className="grid grid-cols-2 gap-x-2 gap-y-1 pl-6">
                {m.fitur.map(([label, aktif]) => (
                  <li key={label} className="flex items-center gap-1 text-[11px]">
                    <span className={aktif ? 'text-green-500' : 'text-gray-300'}>
                      {aktif ? '✓' : '✗'}
                    </span>
                    <span className={aktif ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>
    </div>
  )
}
