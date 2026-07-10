"use client"

import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { InfoTooltip } from '@/components/ui/InfoTooltip'
import { Alert } from '@/components/ui/Alert'
import { Separator } from '@/components/ui/Separator'
import type { MetodePerhitungan, JenisKeluar } from '@/lib/engine/types'

// ─── Schema ──────────────────────────────────────────────
export const assumptionsSchema = z.object({
  tingkatDiskonto:        z.number().min(0).max(30),
  tingkatKenaikanGaji:    z.number().min(0).max(30),
  tingkatPengunduranDiri: z.number().min(0).max(100),
  gunakanMortalita:       z.boolean(),
  gunakanCacat:           z.boolean(),
  regulasi:               z.enum(['UUCK_PP35', 'UUK_13_2003']),
  jenisImbalan:           z.array(z.enum(['PENSIUN','MENINGGAL','CACAT','MENGUNDURKAN_DIRI'])),
  persentaseUPH:          z.number().min(0).max(100),
  nkkipAwalPeriode:       z.number().min(0),
})

export type AssumptionsFormValues = z.infer<typeof assumptionsSchema>

export const DEFAULT_ASSUMPTIONS: AssumptionsFormValues = {
  tingkatDiskonto:        7.11,
  tingkatKenaikanGaji:    5.0,
  tingkatPengunduranDiri: 2.0,
  gunakanMortalita:       true,
  gunakanCacat:           true,
  regulasi:               'UUCK_PP35',
  jenisImbalan:           ['PENSIUN'],
  persentaseUPH:          15,
  nkkipAwalPeriode:       0,
}

interface AssumptionsFormProps {
  metode: MetodePerhitungan
  defaultValues?: Partial<AssumptionsFormValues>
  onChange?: (values: AssumptionsFormValues) => void
}

export function AssumptionsForm({ metode, defaultValues, onChange }: AssumptionsFormProps) {
  const { register, watch, control, formState: { errors } } = useForm<AssumptionsFormValues>({
    resolver: zodResolver(assumptionsSchema),
    defaultValues: { ...DEFAULT_ASSUMPTIONS, ...defaultValues },
    mode: 'onChange',
  })

  useEffect(() => {
    const subscription = watch((value) => onChange?.(value as AssumptionsFormValues))
    return () => subscription.unsubscribe()
  }, [watch, onChange])

  const tingkatDiskonto = useWatch({ control, name: 'tingkatDiskonto' })

  const showEconomi  = metode === 'PUC_ECONOMIC' || metode === 'PUC_FULL'
  const showDemografi = metode === 'PUC_FULL'
  const isFull       = metode === 'PUC_FULL'

  if (!showEconomi && !showDemografi) {
    return (
      <Alert variant="info" title="Tidak ada asumsi yang diperlukan">
        Metode ini menggunakan gaji dan masa kerja saat ini tanpa proyeksi apapun.
        Tidak ada asumsi ekonomi atau demografi yang dibutuhkan.
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Regulasi */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-800">Regulasi</h3>
        <div className="flex flex-col gap-2">
          {([
            ['UUCK_PP35',    'UUCK / PP No. 35/2021 (berlaku sejak 2021)'],
            ['UUK_13_2003',  'UU No. 13/2003 (sebelum UUCK)'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" value={val} className="text-secondary focus:ring-secondary" {...register('regulasi')} />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Asumsi Ekonomi */}
      {showEconomi && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-gray-800">Asumsi Ekonomi</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tingkat diskonto</label>
                <InfoTooltip text="Mengacu pada yield IGSYC. Per 30 Des 2024, yield 20 tahun = 7,11%. Sumber: www.phei.co.id atau www.idx.co.id" />
              </div>
              <Input
                type="number"
                step="0.01"
                min={0}
                max={30}
                suffix="%"
                error={errors.tingkatDiskonto?.message}
                {...register('tingkatDiskonto', { valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium text-gray-700">Kenaikan gaji per tahun</label>
                <InfoTooltip text="Estimasi rata-rata kenaikan gaji per tahun, termasuk inflasi dan promosi" />
              </div>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={30}
                suffix="%"
                error={errors.tingkatKenaikanGaji?.message}
                {...register('tingkatKenaikanGaji', { valueAsNumber: true })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Asumsi Demografi */}
      {showDemografi && (
        <>
          <Separator />
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-800">Asumsi Demografi</h3>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tingkat pengunduran diri per tahun</label>
                <InfoTooltip
                  side="right"
                  text="Persentase karyawan yang diperkirakan resign per tahun. Idealnya berdasarkan data historis perusahaan minimal 3 tahun"
                />
              </div>
              <Input
                type="number"
                step="0.1"
                min={0}
                max={100}
                suffix="%"
                containerClassName="max-w-xs"
                error={errors.tingkatPengunduranDiri?.message}
                {...register('tingkatPengunduranDiri', { valueAsNumber: true })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Controller
                name="gunakanMortalita"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded text-secondary focus:ring-secondary"
                    />
                    <span className="text-sm text-gray-700">Sertakan mortalita (TMI-2019)</span>
                    <InfoTooltip text="Tabel Mortalita Indonesia IV 2019 — tingkat kematian per usia untuk memperkirakan probabilitas karyawan meninggal sebelum pensiun" />
                  </label>
                )}
              />
              <Controller
                name="gunakanCacat"
                control={control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="rounded text-secondary focus:ring-secondary"
                    />
                    <span className="text-sm text-gray-700">Sertakan cacat (10% dari mortalita)</span>
                    <InfoTooltip text="Asumsi: tingkat cacat = 10% dari tingkat mortalita pada usia yang sama, sesuai panduan DSAK IAI" />
                  </label>
                )}
              />
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Jenis Imbalan */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-800">Jenis imbalan yang dihitung</h3>
        <div className="flex flex-col gap-1.5">
          {([
            ['PENSIUN',           'Pensiun normal',        false],
            ['MENGUNDURKAN_DIRI', 'Mengundurkan diri',     isFull],
            ['MENINGGAL',         'Meninggal dunia',       isFull],
            ['CACAT',             'Cacat',                 isFull],
          ] as [JenisKeluar, string, boolean][]).map(([val, label, enabled]) => (
            <Controller
              key={val}
              name="jenisImbalan"
              control={control}
              render={({ field }) => {
                const checked = field.value.includes(val)
                const isRequired = val === 'PENSIUN'
                return (
                  <label className={`flex items-center gap-2 ${enabled || isRequired ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!enabled && !isRequired}
                      onChange={(e) => {
                        if (isRequired) return
                        const next = e.target.checked
                          ? [...field.value, val]
                          : field.value.filter((v) => v !== val)
                        field.onChange(next)
                      }}
                      className="rounded text-secondary focus:ring-secondary"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                    {isRequired && <span className="text-xs text-gray-500">(selalu aktif)</span>}
                  </label>
                )
              }}
            />
          ))}
        </div>
      </div>

      <Separator />

      {/* Persentase UPH */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <label className="text-sm font-medium text-gray-700">Persentase UPisah (resign)</label>
          <InfoTooltip text="Default 15%: karyawan yang mengundurkan diri mendapat 15% dari total PSG + UPMK sebagai uang pisah" />
        </div>
        <Input
          type="number"
          step="1"
          min={0}
          max={100}
          suffix="%"
          containerClassName="max-w-xs"
          error={errors.persentaseUPH?.message}
          {...register('persentaseUPH', { valueAsNumber: true })}
        />
      </div>

      {/* Rekonsiliasi Periode */}
      {showEconomi && (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-gray-800">Rekonsiliasi Periode (Opsional)</h3>
            <Controller
              name="nkkipAwalPeriode"
              control={control}
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-sm font-medium text-gray-700">NKKIP Awal Periode (jika ada)</label>
                    <InfoTooltip
                      side="right"
                      text="Nilai Kini Kewajiban Imbalan Pasti dari akhir periode sebelumnya. Digunakan untuk menghitung Biaya Bunga = Diskonto × NKKIP Awal. Kosongkan jika ini valuasi pertama kali."
                    />
                  </div>
                  <Input
                    prefix="Rp"
                    placeholder="Kosongkan jika ini valuasi pertama kali"
                    containerClassName="max-w-xs"
                    value={field.value > 0 ? Math.floor(field.value).toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const raw = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.')) || 0
                      field.onChange(raw)
                    }}
                  />
                  {field.value > 0 && (
                    <p className="text-xs text-gray-500">
                      Biaya Bunga akan dihitung: {(tingkatDiskonto / 100 * field.value).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        </>
      )}

    </div>
  )
}
