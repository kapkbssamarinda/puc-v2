"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatRupiah, formatPersen, formatTahunBulan, formatFaktor } from '@/lib/format'
import { hitungFaktorImbalan } from '@/lib/engine/tables'
import type { HasilPerhitungan } from '@/lib/engine/types'

interface Props { hasil: HasilPerhitungan }

function FormulaLine({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`px-4 py-1.5 text-sm font-mono text-gray-700 bg-gray-50 border-b border-gray-100 last:border-0 ${className ?? ''}`}>
      {children}
    </div>
  )
}

function DataRow({ label, val }: { label: string; val: string }) {
  return (
    <div className="flex justify-between px-4 py-1.5 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right">{val}</span>
    </div>
  )
}

export function CalculationSteps({ hasil }: Props) {
  const {
    usiaSekarang, usiaMasuk,
    masaKerjaLalu, masaKerjaTotal, masaKerjaMendatang,
    proyeksiUpahPensiun, proyeksiImbalanPensiun,
    faktorPSGPensiun, faktorUPMKPensiun,
    usiaStartAtribusi, mkAtribusiLalu, masaKerjaAtribusiMax,
    nkkip, biayaJasaKini, metode,
    input: { asumsiEkonomi, regulasi, karyawan, usiaPensiun },
  } = hasil

  const isEcon = metode === 'PUC_ECONOMIC' || metode === 'PUC_FULL'
  const r = asumsiEkonomi.tingkatDiskonto
  const g = asumsiEkonomi.tingkatKenaikanGaji
  const proporsi = masaKerjaAtribusiMax > 0 ? mkAtribusiLalu / masaKerjaAtribusiMax : 0
  const faktorProyeksiUpah = Math.pow(1 + g, masaKerjaMendatang)
  const faktorDiskontoVal  = Math.pow(1 + r, -masaKerjaMendatang)
  const nilaiKiniImbalan   = proyeksiImbalanPensiun * faktorDiskontoVal

  // Hitung multiplier untuk display
  const faktor = hitungFaktorImbalan(masaKerjaTotal, 'PENSIUN', regulasi)
  const rumusStr = regulasi === 'UUK_13_2003'
    ? `(2×${faktorPSGPensiun} + 1×${faktorUPMKPensiun}) × 1,15 = ${faktor.faktorTotal.toFixed(2)}`
    : `1,75×${faktorPSGPensiun} + 1×${faktorUPMKPensiun} = ${faktor.faktorTotal.toFixed(2)}`

  let stepNo = 0
  function Step({ judul, children }: { judul: string; children: React.ReactNode }) {
    stepNo++
    return (
      <Card className="overflow-hidden">
        <CardHeader className="py-2.5 px-4 bg-gray-50 border-b border-gray-100">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-secondary text-white text-[11px] shrink-0 font-bold">
              {stepNo}
            </span>
            {judul}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">{children}</CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-gray-900">Langkah Perhitungan</h2>
      <div className="flex flex-col gap-3">

        {/* Langkah 1 — Data & Masa Kerja */}
        <Step judul="Data &amp; Masa Kerja">
          <DataRow label="Usia saat ini"         val={formatTahunBulan(usiaSekarang)} />
          <DataRow label="Usia masuk kerja"       val={`${usiaMasuk.toFixed(1)} tahun`} />
          <DataRow label="Usia pensiun"           val={`${usiaPensiun} tahun`} />
          <DataRow label="Masa kerja lalu"        val={formatTahunBulan(masaKerjaLalu)} />
          {isEcon && <DataRow label="Masa kerja mendatang" val={formatTahunBulan(masaKerjaMendatang)} />}
          <DataRow label="Masa kerja total"       val={formatTahunBulan(masaKerjaTotal)} />
          <DataRow label="Upah bulanan saat ini"  val={formatRupiah(karyawan.upahBulanan)} />
        </Step>

        {/* Langkah 2 — Proyeksi Upah (hanya jika ada asumsi ekonomi) */}
        {isEcon && (
          <Step judul="Proyeksi Upah di Usia Pensiun">
            <DataRow label="Rumus" val={`Upah × (1 + g)^n`} />
            <FormulaLine>
              = {formatRupiah(karyawan.upahBulanan)} × (1 + {formatPersen(g * 100)})^{masaKerjaMendatang.toFixed(2)}
            </FormulaLine>
            <FormulaLine>
              = {formatRupiah(karyawan.upahBulanan)} × {formatFaktor(faktorProyeksiUpah)}
            </FormulaLine>
            <FormulaLine className="font-semibold text-gray-900">
              = {formatRupiah(proyeksiUpahPensiun)}
            </FormulaLine>
          </Step>
        )}

        {/* Langkah 3 — Proyeksi Imbalan */}
        <Step judul="Proyeksi Imbalan di Usia Pensiun">
          <DataRow label={`Faktor PSG (MK ${Math.floor(masaKerjaTotal)} thn)`}  val={`${faktorPSGPensiun}× upah`} />
          <DataRow label={`Faktor UPMK (MK ${Math.floor(masaKerjaTotal)} thn)`} val={`${faktorUPMKPensiun}× upah`} />
          <DataRow label="Regulasi" val={regulasi === 'UUCK_PP35' ? 'UUCK / PP 35/2021' : 'UU No. 13/2003'} />
          <DataRow label="Formula faktor" val={rumusStr} />
          <FormulaLine>
            = {faktor.faktorTotal.toFixed(4)} × {formatRupiah(isEcon ? proyeksiUpahPensiun : karyawan.upahBulanan)}
          </FormulaLine>
          <FormulaLine className="font-semibold text-gray-900">
            = {formatRupiah(proyeksiImbalanPensiun)}
          </FormulaLine>
        </Step>

        {/* Langkah 4 — Diskonto */}
        {isEcon && (
          <Step judul="Diskonto ke Nilai Sekarang">
            <DataRow label="Rumus" val={`Imbalan × (1 + r)^(-n)`} />
            <FormulaLine>
              = {formatRupiah(proyeksiImbalanPensiun)} × (1 + {formatPersen(r * 100)})^(-{masaKerjaMendatang.toFixed(2)})
            </FormulaLine>
            <FormulaLine>
              = {formatRupiah(proyeksiImbalanPensiun)} × {formatFaktor(faktorDiskontoVal)}
            </FormulaLine>
            <FormulaLine className="font-semibold text-gray-900">
              = {formatRupiah(nilaiKiniImbalan)}
            </FormulaLine>
          </Step>
        )}

        {/* Langkah 5 — Atribusi */}
        <Step judul="Atribusi (DSAK IAI April 2022)">
          <DataRow
            label="Usia mulai atribusi"
            val={`max(${usiaMasuk.toFixed(1)}, ${usiaPensiun}−24) = ${usiaStartAtribusi.toFixed(1)} tahun`}
          />
          <DataRow
            label="Panjang jendela atribusi"
            val={`min(${masaKerjaTotal.toFixed(1)}, 24) = ${masaKerjaAtribusiMax.toFixed(0)} tahun`}
          />
          <DataRow
            label="MK atribusi yang sudah dilalui"
            val={`${usiaSekarang.toFixed(1)} − ${usiaStartAtribusi.toFixed(1)} = ${mkAtribusiLalu.toFixed(2)} tahun`}
          />
          <FormulaLine>
            Proporsi = {mkAtribusiLalu.toFixed(2)} / {masaKerjaAtribusiMax.toFixed(0)} = {formatFaktor(proporsi)}
          </FormulaLine>
        </Step>

        {/* Langkah 6 — Hasil Akhir */}
        <Step judul="Hasil Akhir">
          <FormulaLine>
            NKKIP = {formatRupiah(isEcon ? nilaiKiniImbalan : proyeksiImbalanPensiun)} × {formatFaktor(proporsi)}
          </FormulaLine>
          <FormulaLine className="font-bold text-secondary text-base">
            NKKIP = {formatRupiah(nkkip)}
          </FormulaLine>
          <FormulaLine>
            Biaya Jasa = {formatRupiah(isEcon ? nilaiKiniImbalan : proyeksiImbalanPensiun)} ÷ {masaKerjaAtribusiMax.toFixed(0)}
          </FormulaLine>
          <FormulaLine className="font-bold text-gray-800">
            Biaya Jasa Kini = {formatRupiah(biayaJasaKini)}
          </FormulaLine>
        </Step>

      </div>
    </div>
  )
}
