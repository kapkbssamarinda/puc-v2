"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Separator } from '@/components/ui/Separator'
import { formatRupiah, formatTanggal } from '@/lib/format'
import type { HasilPerhitungan, HasilBatch } from '@/lib/engine/types'

interface Props {
  hasil?: HasilPerhitungan
  hasilBatch?: HasilBatch
  tanggalPenyusunan?: string
}

interface BarisJurnal {
  komponen: string
  debit: number
  kredit: number
  rumusSumber: string
  catatan: string
  warnaBg?: string
}

export function JurnalPanel({ hasil, hasilBatch, tanggalPenyusunan }: Props) {
  const [disalin, setDisalin] = useState(false)

  const jumlahKaryawan = hasilBatch?.totalKaryawan ?? 1
  const totalDBO       = hasilBatch?.totalNKKIP ?? hasil?.nkkip ?? 0
  const totalBJK       = hasilBatch?.totalBiayaJasa ?? hasil?.biayaJasaKini ?? 0
  const totalBunga     = hasilBatch
    ? hasilBatch.hasil.reduce((s, h) => s + h.biayaBunga, 0)
    : (hasil?.biayaBunga ?? 0)
  const totalGL        = hasilBatch
    ? hasilBatch.hasil.reduce((s, h) => s + (h.rekonsiliasi?.keuntunganKerugianAktuaria ?? 0), 0)
    : (hasil?.rekonsiliasi?.keuntunganKerugianAktuaria ?? 0)
  const totalBJL       = hasilBatch
    ? hasilBatch.hasil.reduce((s, h) => s + (h.biayaJasaLalu ?? 0), 0)
    : (hasil?.biayaJasaLalu ?? 0)

  const dboList      = hasilBatch ? hasilBatch.hasil.map(h => h.nkkip) : (hasil ? [hasil.nkkip] : [])
  const dboTertinggi = dboList.length > 0 ? Math.max(...dboList) : 0
  const dboTerendah  = dboList.length > 0 ? Math.min(...dboList) : 0
  const dboRataRata  = jumlahKaryawan > 0 ? totalDBO / jumlahKaryawan : 0
  const tglPenyusunan = tanggalPenyusunan
    ?? hasilBatch?.tanggalPerhitungan
    ?? hasil?.input.tanggalPerhitungan
    ?? new Date().toISOString().slice(0, 10)

  const totalKreditLiabilitas = totalBJK + totalBunga + (totalBJL > 0 ? totalBJL : 0) + (totalGL > 0 ? totalGL : 0)
  const totalKreditOCI        = totalGL < 0 ? Math.abs(totalGL) : 0
  const totalKreditBJL        = totalBJL < 0 ? Math.abs(totalBJL) : 0

  const barisJurnal: BarisJurnal[] = [
    {
      komponen: 'Beban Imbalan Kerja — Jasa Kini',
      debit: totalBJK,
      kredit: 0,
      rumusSumber: 'Hasil perhitungan NKKIP (Biaya Jasa Kini)',
      catatan: 'Isi sesuai laporan aktuaris / hasil kalkulator',
    },
    {
      komponen: 'Beban Bunga (Interest Cost)',
      debit: totalBunga,
      kredit: 0,
      rumusSumber: 'Tingkat diskonto × DBO awal periode',
      catatan: 'Hanya ada jika NKKIP awal periode diisi. DBO awal × diskonto.',
    },
    ...(totalBJL !== 0 ? [{
      komponen: 'Biaya Jasa Lalu (Past Service Cost)',
      debit:  totalBJL > 0 ? totalBJL : 0,
      kredit: totalBJL < 0 ? Math.abs(totalBJL) : 0,
      rumusSumber: 'NKKIP sesudah − NKKIP sebelum perubahan program',
      catatan: totalBJL < 0 ? 'Penurunan kewajiban — sisi kredit' : 'Kenaikan kewajiban akibat amendemen',
      warnaBg: 'bg-amber-50',
    }] : []),
    {
      komponen: totalGL < 0
        ? 'Penghasilan Komprehensif Lain — Keuntungan Aktuaria'
        : 'Penghasilan Komprehensif Lain — Kerugian Aktuaria',
      debit:  totalGL > 0 ? totalGL : 0,
      kredit: totalGL < 0 ? Math.abs(totalGL) : 0,
      rumusSumber: 'Input manual di bagian Rekonsiliasi NKKIP',
      catatan: 'Keuntungan/kerugian aktuaria. Diakui di OCI, tidak melalui P&L.',
    },
    {
      komponen: 'Liabilitas Imbalan Kerja',
      debit: 0,
      kredit: totalKreditLiabilitas,
      rumusSumber: 'Penjumlahan seluruh debit di atas',
      catatan: 'Sebagai kredit penambahan liabilitas di Laporan Posisi Keuangan',
      warnaBg: 'bg-blue-50',
    },
  ]

  const totalDebit  = barisJurnal.reduce((s, b) => s + b.debit, 0)
  const totalKredit = barisJurnal.reduce((s, b) => s + b.kredit, 0)
  const seimbang    = Math.abs(totalDebit - totalKredit) < 1

  function buatTeksJurnal(): string {
    const baris = barisJurnal
      .filter(b => b.debit > 0 || b.kredit > 0)
      .map(b => b.debit > 0
        ? `  Dr. ${b.komponen.padEnd(52)} ${formatRupiah(b.debit)}`
        : `      Kr. ${b.komponen.padEnd(52)} ${formatRupiah(b.kredit)}`)
      .join('\n')
    return [
      'JURNAL IMBALAN PASCA KERJA — PSAK 24',
      `Tanggal      : ${formatTanggal(tglPenyusunan)}`,
      `Karyawan     : ${jumlahKaryawan}`,
      '',
      baris,
      '',
      'Catatan: Jurnal ini merupakan estimasi untuk review. Nilai final mengacu laporan aktuaris.',
    ].join('\n')
  }

  async function handleSalin() {
    try {
      await navigator.clipboard.writeText(buatTeksJurnal())
      setDisalin(true)
      setTimeout(() => setDisalin(false), 2500)
    } catch { /* clipboard tidak tersedia */ }
  }

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          Dashboard Penjurnalan PSAK 24
          <InfoTooltip text="Rekap jurnal akuntansi yang perlu dibuat berdasarkan hasil perhitungan NKKIP. Gunakan sebagai panduan pencatatan — nilai final mengacu laporan aktuaris." />
        </CardTitle>
        <button
          onClick={handleSalin}
          className="text-xs px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
        >
          {disalin ? '✓ Tersalin' : 'Salin Jurnal'}
        </button>
      </CardHeader>
      <CardContent className="px-4 pb-4 flex flex-col gap-4">

        {/* Ringkasan DBO */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Ringkasan DBO
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Jumlah Karyawan Terisi', nilai: String(jumlahKaryawan), satuan: 'karyawan' },
              { label: 'Total DBO Tahun Berjalan', nilai: formatRupiah(totalDBO), satuan: '' },
              { label: 'Rata-rata DBO per Karyawan', nilai: formatRupiah(dboRataRata), satuan: '' },
              { label: 'DBO Tertinggi', nilai: formatRupiah(dboTertinggi), satuan: '' },
              { label: 'DBO Terendah', nilai: formatRupiah(dboTerendah), satuan: '' },
              { label: 'Tanggal Penyusunan', nilai: formatTanggal(tglPenyusunan), satuan: '' },
            ].map(({ label, nilai, satuan }) => (
              <div key={label} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-900 tabular-nums">
                  {nilai}
                  {satuan && <span className="text-xs font-normal text-gray-400 ml-1">{satuan}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Komponen Jurnal */}
        <div>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            Komponen Jurnal
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: 'Biaya Jasa Kini', nilai: totalBJK, catatan: 'Dari hasil kalkulator' },
              { label: 'Biaya Bunga (IC)', nilai: totalBunga, catatan: 'DBO awal × diskonto' },
              ...(totalBJL !== 0 ? [{ label: 'Biaya Jasa Lalu (PSC)', nilai: totalBJL, catatan: 'Perubahan program' }] : []),
              { label: 'Remeasurement / GL Aktuaria', nilai: totalGL, catatan: 'OCI — bukan P&L' },
            ].map(({ label, nilai, catatan }) => (
              <div key={label} className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100">
                <p className="text-[10px] text-amber-700 font-medium mb-0.5">{label}</p>
                <p className="text-sm font-bold text-gray-900 tabular-nums">{formatRupiah(nilai)}</p>
                <p className="text-[10px] text-amber-600 mt-0.5">{catatan}</p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Tabel Jurnal Debit/Kredit */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
              Jurnal Akuntansi
            </p>
            {seimbang
              ? <span className="text-[10px] text-green-600 font-medium">✓ Jurnal seimbang</span>
              : <span className="text-[10px] text-amber-600 font-medium">⚠ Selisih Rp {formatRupiah(Math.abs(totalDebit - totalKredit))}</span>
            }
          </div>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-700 text-white">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Komponen Jurnal</th>
                  <th className="text-right px-3 py-2 font-medium w-32">Debit (Rp)</th>
                  <th className="text-right px-3 py-2 font-medium w-32">Kredit (Rp)</th>
                  <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Rumus/Sumber</th>
                  <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {barisJurnal.map((b, i) => {
                  const isLiabilitas = b.komponen === 'Liabilitas Imbalan Kerja'
                  const rowBg = b.warnaBg
                    ? b.warnaBg
                    : isLiabilitas
                      ? 'bg-blue-50'
                      : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  return (
                    <tr key={i} className={`border-t border-gray-100 ${rowBg}`}>
                      <td className={`px-3 py-2 ${isLiabilitas ? 'pl-6 text-blue-800 font-medium italic' : 'text-gray-700'}`}>
                        {b.komponen}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">
                        {b.debit > 0 ? formatRupiah(b.debit) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-gray-900">
                        {b.kredit > 0 ? formatRupiah(b.kredit) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{b.rumusSumber}</td>
                      <td className="px-3 py-2 text-gray-400 hidden md:table-cell">{b.catatan}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold border-t border-gray-200">
                <tr>
                  <td className="px-3 py-2 text-gray-700">Total</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-900">{formatRupiah(totalDebit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-900">{formatRupiah(totalKredit)}</td>
                  <td colSpan={2} className="px-3 py-2 text-xs text-gray-400 hidden sm:table-cell">
                    Debit = Kredit jika jurnal seimbang
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-400 italic">
            * Jurnal ini bersifat estimasi untuk keperluan review audit.
            Nilai definitif mengacu laporan aktuaris terdaftar (PAI).
            Remeasurement diakui di OCI, tidak melalui Laporan Laba Rugi.
          </p>
        </div>

      </CardContent>
    </Card>
  )
}
