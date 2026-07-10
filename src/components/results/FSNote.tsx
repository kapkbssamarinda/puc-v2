"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatRupiah, formatPersen, formatTanggal, formatTahunBulan } from '@/lib/format'
import type { HasilPerhitungan } from '@/lib/engine/types'

const METODE_LABEL: Record<string, string> = {
  LIQUIDATION:  'Liquidation Basis (non-PSAK 24)',
  PUC_SIMPLE:   'Projected Unit Credit — Tanpa Asumsi Ekonomi',
  PUC_ECONOMIC: 'Projected Unit Credit — Dengan Asumsi Ekonomi',
  PUC_FULL:     'Projected Unit Credit — Komprehensif (Actuarial Full)',
}

const REGULASI_LABEL: Record<string, string> = {
  UUCK_PP35:   'PP No. 35/2021 (UUCK)',
  UUK_13_2003: 'UU No. 13/2003',
}

interface Props { hasil: HasilPerhitungan }

function buat_teks_calk(hasil: HasilPerhitungan): string {
  const {
    nkkip, biayaJasaKini, biayaBunga, biayaJasaLalu, nkkipSebelumPerubahan,
    rekonsiliasi,
    nkkipPerJenis, biayaJasaPerJenis,
    metode, usiaSekarang, masaKerjaLalu, masaKerjaTotal,
    input: { karyawan, tanggalPerhitungan, regulasi, usiaPensiun, asumsiEkonomi, asumsiDemografi, nkkipAwalPeriode },
  } = hasil

  const isEcon = metode === 'PUC_ECONOMIC' || metode === 'PUC_FULL'
  const isFull = metode === 'PUC_FULL'
  const tgl    = formatTanggal(tanggalPerhitungan)
  const r      = asumsiEkonomi.tingkatDiskonto * 100
  const g      = asumsiEkonomi.tingkatKenaikanGaji * 100

  const jenisImbalan = Object.keys(nkkipPerJenis).map((j) => {
    const label: Record<string, string> = {
      PENSIUN:           'uang pensiun (UP)',
      MENGUNDURKAN_DIRI: 'uang pisah (UPisah)',
      MENINGGAL:         'santunan meninggal',
      CACAT:             'uang cacat (UC)',
    }
    return label[j] ?? j
  }).join(', ')

  let teks = `CATATAN ATAS LAPORAN KEUANGAN — IMBALAN PASCA KERJA
${'='.repeat(64)}

A. KEBIJAKAN AKUNTANSI

  Perusahaan menyelenggarakan program imbalan pasti pasca kerja sesuai
  dengan ketentuan ${REGULASI_LABEL[regulasi]}. Kewajiban imbalan pasca
  kerja diukur menggunakan metode ${METODE_LABEL[metode]}.

  Imbalan yang diperhitungkan mencakup: ${jenisImbalan}.

  Nilai Kini Kewajiban Imbalan Pasti (NKKIP) diakui sebagai liabilitas
  di Laporan Posisi Keuangan. Biaya jasa kini dan biaya bunga diakui
  sebagai beban di Laporan Laba Rugi periode berjalan.

B. ASUMSI AKTUARIA (tanggal ${tgl})

  Nama karyawan         : ${karyawan.nama}
  Jenis kelamin         : ${karyawan.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
  Usia saat ini         : ${formatTahunBulan(usiaSekarang)}
  Masa kerja            : ${formatTahunBulan(masaKerjaLalu)} (total ${formatTahunBulan(masaKerjaTotal)})
  Upah bulanan          : ${formatRupiah(karyawan.upahBulanan)}
  Usia pensiun normal   : ${usiaPensiun} tahun
`

  if (isEcon) {
    teks += `
  Tingkat diskonto      : ${formatPersen(r)} per tahun
  Kenaikan gaji         : ${formatPersen(g)} per tahun`
  }

  if (isFull) {
    teks += `
  Tingkat pengunduran   : ${formatPersen(asumsiDemografi.tingkatPengunduranDiri * 100)} per tahun
  Mortalita             : Tabel Mortalitas Indonesia 2019 (TMI-2019)
  Risiko cacat          : ${asumsiDemografi.gunakanMortalita ? '10% × TMI-2019[usia]' : formatPersen(asumsiDemografi.tingkatCacat * 100) + ' per tahun'}`
  }

  teks += `

C. REKONSILIASI NKKIP
`

  if (rekonsiliasi) {
    // Data rekonsiliasi lengkap tersedia
    const gl = rekonsiliasi.keuntunganKerugianAktuaria
    const glLabel = gl < 0
      ? `  −  Keuntungan aktuaria  : (${formatRupiah(Math.abs(gl))})  (OCI)`
      : gl > 0
        ? `  +  Kerugian aktuaria   : ${formatRupiah(gl)}  (OCI)`
        : null

    teks += `
  NKKIP awal periode    : ${formatRupiah(rekonsiliasi.nkkipAwal)}
  + Biaya jasa kini     : ${formatRupiah(rekonsiliasi.biayaJasaKini)}`

    if (rekonsiliasi.biayaBunga > 0) {
      teks += `
  + Biaya bunga         : ${formatRupiah(rekonsiliasi.biayaBunga)}`
    }

    if (rekonsiliasi.biayaJasaLalu !== 0) {
      teks += `
  + Biaya jasa lalu     : ${formatRupiah(rekonsiliasi.biayaJasaLalu)}  ← akibat perubahan rumusan imbalan`
    }

    if (glLabel) {
      teks += `\n${glLabel}`
    }

    if (rekonsiliasi.pembayaranImbalan > 0) {
      teks += `
  - Pembayaran imbalan  : ${formatRupiah(rekonsiliasi.pembayaranImbalan)}`
    } else {
      teks += `
  - Pembayaran imbalan  : Rp -    (tidak ada pembayaran periode ini)`
    }

    teks += `
  ─────────────────────────────────────────────────────────────
  NKKIP akhir periode   : ${formatRupiah(rekonsiliasi.nkkipAkhir)}`
  } else {
    // Fallback — data rekonsiliasi tidak diisi pengguna
    const nkkipAwal = nkkipAwalPeriode && nkkipAwalPeriode > 0 ? nkkipAwalPeriode : null
    teks += `
  NKKIP awal periode    : ${nkkipAwal ? formatRupiah(nkkipAwal) : 'Rp -    (pengakuan pertama / tidak diisi)'}
  + Biaya jasa kini     : ${formatRupiah(biayaJasaKini)}`

    if (biayaBunga > 0) {
      teks += `
  + Biaya bunga         : ${formatRupiah(biayaBunga)}`
    }

    if (biayaJasaLalu !== undefined) {
      teks += `
  + Biaya jasa lalu     : ${formatRupiah(biayaJasaLalu)}  ← akibat perubahan rumusan imbalan`
    }

    teks += `
  - Pembayaran imbalan  : Rp -    (tidak ada pembayaran periode ini)
  ─────────────────────────────────────────────────────────────
  NKKIP akhir periode   : ${formatRupiah(nkkip)}`

    if (biayaJasaLalu !== undefined && nkkipSebelumPerubahan !== undefined) {
      teks += `

  Catatan perubahan program:
    NKKIP sebelum perubahan : ${formatRupiah(nkkipSebelumPerubahan)}
    NKKIP sesudah perubahan : ${formatRupiah(nkkip)}
    Biaya jasa lalu (PSC)   : ${formatRupiah(biayaJasaLalu)}${biayaJasaLalu < 0 ? '  (penurunan kewajiban)' : '  (kenaikan kewajiban)'}`
    }
  }

  teks += `

D. BEBAN IMBALAN DI LAPORAN LABA RUGI

  Biaya jasa kini       : ${formatRupiah(biayaJasaKini)}`

  if (biayaBunga > 0) {
    teks += `
  Biaya bunga           : ${formatRupiah(biayaBunga)}`
  }

  if (biayaJasaLalu !== undefined) {
    teks += `
  Biaya jasa lalu       : ${formatRupiah(biayaJasaLalu)}`
  }

  const totalBeban = biayaJasaKini + biayaBunga + (biayaJasaLalu ?? 0)
  teks += `
  ─────────────────────────────────────────────────────────────
  Total beban imbalan   : ${formatRupiah(totalBeban)}

E. RINCIAN NKKIP PER JENIS IMBALAN
`

  for (const [jenis, val] of Object.entries(nkkipPerJenis) as [string, number][]) {
    const bjk = biayaJasaPerJenis[jenis as keyof typeof biayaJasaPerJenis] ?? 0
    const label: Record<string, string> = {
      PENSIUN:           'Uang Pensiun (UP)',
      MENGUNDURKAN_DIRI: 'Uang Pisah (UPisah)',
      MENINGGAL:         'Santunan Meninggal',
      CACAT:             'Uang Cacat (UC)',
    }
    teks += `
  ${(label[jenis] ?? jenis).padEnd(24)}: NKKIP ${formatRupiah(val)}, BJK ${formatRupiah(bjk)}`
  }

  teks += `

F. CATATAN

  Perhitungan ini bersifat estimasi dan disusun untuk tujuan audit/
  review terhadap kewajaran pencatatan PSAK 24. Nilai definitif
  memerlukan perhitungan aktuaris terdaftar (PAI) jika material.

  Sumber referensi: DSAK IAI Siaran Pers April 2022, PSAK 24 (2023).
`

  return teks
}

export function FSNote({ hasil }: Props) {
  const [salin, setSalin] = useState<'idle' | 'ok'>('idle')
  const teks = buat_teks_calk(hasil)

  async function handleSalin() {
    try {
      await navigator.clipboard.writeText(teks)
      setSalin('ok')
      setTimeout(() => setSalin('idle'), 2500)
    } catch {
      // clipboard mungkin tidak tersedia di non-HTTPS
    }
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm">Draft Catatan Atas Laporan Keuangan (CALK)</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSalin}
          className="shrink-0 text-xs"
        >
          {salin === 'ok' ? '✓ Tersalin' : 'Salin Teks'}
        </Button>
      </CardHeader>
      <CardContent className="p-4">
        <pre className="whitespace-pre-wrap font-mono text-[11px] text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-100 max-h-96 overflow-y-auto leading-relaxed">
          {teks}
        </pre>
        <p className="mt-2 text-[10px] text-gray-500 italic">
          * Draft ini bukan opini aktuaria. Gunakan sebagai titik awal dokumentasi kertas kerja audit.
        </p>
      </CardContent>
    </Card>
  )
}
