"use client"

import { Fragment } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Separator } from '@/components/ui/Separator'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { formatRupiah } from '@/lib/format'
import type { RekonsiliasiNKKIP } from '@/lib/engine/types'

interface Props { rekonsiliasi: RekonsiliasiNKKIP }

interface Baris {
  label: string
  nilai: number
  displayNilai?: string
  tooltip?: string
  tebal?: boolean
  pemisah?: boolean
  warna?: 'hijau' | 'merah' | 'abu'
}

export function RekonsiliasiPanel({ rekonsiliasi }: Props) {
  const { nkkipAwal, biayaJasaKini, biayaBunga, biayaJasaLalu,
          keuntunganKerugianAktuaria, pembayaranImbalan, nkkipAkhir } = rekonsiliasi

  const baris: Baris[] = [
    {
      label: 'NKKIP Awal Periode',
      nilai: nkkipAwal,
      tooltip: 'Nilai Kini Kewajiban Imbalan Pasti pada awal periode (dari laporan periode lalu).',
      tebal: true,
    },
    {
      label: '+ Biaya Jasa Kini',
      nilai: biayaJasaKini,
      tooltip: 'Current Service Cost — kenaikan NKKIP akibat satu tahun tambahan masa kerja.',
    },
    {
      label: '+ Biaya Bunga',
      nilai: biayaBunga,
      tooltip: 'Interest Cost = tingkat diskonto × NKKIP awal periode (PSAK 24 par. 120).',
    },
    ...(biayaJasaLalu !== 0 ? [{
      label: biayaJasaLalu >= 0 ? '+ Biaya Jasa Lalu' : '− Biaya Jasa Lalu',
      nilai: biayaJasaLalu,
      tooltip: 'Past Service Cost — timbul saat rumusan imbalan diubah (PSAK 24 par. 100-101).',
      warna: biayaJasaLalu < 0 ? 'hijau' : 'abu' as 'hijau' | 'abu',
    }] : []),
    {
      label: keuntunganKerugianAktuaria >= 0
        ? '+  Kerugian Aktuaria'
        : '−  Keuntungan Aktuaria',
      nilai: keuntunganKerugianAktuaria,
      displayNilai: keuntunganKerugianAktuaria < 0
        ? `(${formatRupiah(Math.abs(keuntunganKerugianAktuaria))})`
        : formatRupiah(keuntunganKerugianAktuaria),
      tooltip: keuntunganKerugianAktuaria >= 0
        ? 'Kerugian aktuaria menambah NKKIP. Diakui di OCI (Penghasilan Komprehensif Lain), bukan P&L.'
        : 'Keuntungan aktuaria mengurangi NKKIP. Diakui di OCI (Penghasilan Komprehensif Lain), bukan P&L.',
      warna: keuntunganKerugianAktuaria < 0 ? 'hijau' : 'merah',
    },
    ...(pembayaranImbalan !== 0 ? [{
      label: '− Pembayaran Imbalan',
      nilai: -pembayaranImbalan,
      tooltip: 'Pembayaran imbalan kepada karyawan selama periode berjalan.',
    }] : []),
    {
      label: 'NKKIP Akhir Periode',
      nilai: nkkipAkhir,
      tooltip: 'NKKIP pada akhir periode — harus sama dengan nilai NKKIP dari aktuaris.',
      tebal: true,
      pemisah: true,
    },
  ]

  function warnaKelas(b: Baris): string {
    if (b.tebal) return 'text-gray-900'
    if (b.warna === 'hijau') return 'text-green-700'
    if (b.warna === 'merah') return 'text-red-600'
    return 'text-gray-700'
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-1.5">
          Rekonsiliasi NKKIP
          <InfoTooltip text="Format rekonsiliasi sesuai pengungkapan PSAK 24. Memperlihatkan komponen perubahan NKKIP dari awal ke akhir periode." />
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {baris.map((b, i) => (
                <Fragment key={i}>
                  {b.pemisah && (
                    <tr key={`sep-${i}`}>
                      <td colSpan={2} className="px-3 py-0">
                        <Separator />
                      </td>
                    </tr>
                  )}
                  <tr
                    key={i}
                    className={`${b.tebal ? 'bg-gray-50' : ''} ${i % 2 === 0 && !b.tebal ? 'bg-white' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <span className={b.tebal ? 'font-semibold text-gray-900' : 'text-gray-600'}>
                          {b.label}
                        </span>
                        {b.tooltip && <InfoTooltip text={b.tooltip} />}
                      </div>
                    </td>
                    <td className={`px-3 py-2 text-right tabular-nums font-${b.tebal ? 'bold' : 'medium'} ${warnaKelas(b)}`}>
                      {b.displayNilai ?? formatRupiah(b.nilai)}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-2 text-[10px] text-gray-500">
          * NKKIP Akhir dihitung sebagai: NKKIP Awal + BJK + Bunga + PSC + GL − Pembayaran.
          Selisih dengan nilai aktuaris mencerminkan perbedaan asumsi atau pembulatan.
        </p>
      </CardContent>
    </Card>
  )
}
