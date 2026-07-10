"use client"

import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/Input'
import { formatTahunBulan } from '@/lib/format'
import { getFaktorPSG, getFaktorUPMK } from '@/lib/engine/tables'
import { hitungAtribusi } from '@/lib/engine/attribution'

// ─── Schema ──────────────────────────────────────────────
export const employeeSchema = z.object({
  nama:               z.string().min(1, 'Nama wajib diisi'),
  nik:                z.string().optional(),
  tanggalLahir:       z.string().min(1, 'Tanggal lahir wajib diisi'),
  tanggalMasuk:       z.string().min(1, 'Tanggal masuk wajib diisi'),
  tanggalPerhitungan: z.string().min(1, 'Tanggal perhitungan wajib diisi'),
  upahBulanan:        z.string().min(1, 'Upah bulanan wajib diisi'),
  jenisKelamin:       z.enum(['L', 'P']),
  usiaPensiun:        z.number().min(45, 'Min 45').max(65, 'Max 65'),
}).superRefine((d, ctx) => {
  const lahir  = new Date(d.tanggalLahir)
  const masuk  = new Date(d.tanggalMasuk)
  const hitung = new Date(d.tanggalPerhitungan)
  const ms     = 365.25 * 24 * 60 * 60 * 1000
  const usiaMasuk = (masuk.getTime() - lahir.getTime()) / ms
  if (usiaMasuk < 15) {
    ctx.addIssue({ code: 'custom', path: ['tanggalMasuk'], message: 'Usia saat masuk harus ≥ 15 tahun' })
  }
  if (masuk >= hitung) {
    ctx.addIssue({ code: 'custom', path: ['tanggalMasuk'], message: 'Tanggal masuk harus sebelum tanggal perhitungan' })
  }
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>

// ─── Helpers ─────────────────────────────────────────────
function selisihTahun(a: Date, b: Date) {
  return (b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}

function parseCurrencyInput(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0
}

function formatCurrencyInput(n: number): string {
  if (!n) return ''
  return Math.floor(n).toLocaleString('id-ID')
}

// ─── Ringkasan Data ───────────────────────────────────────
function DataSummary({ values }: { values: EmployeeFormValues }) {
  const lahir  = new Date(values.tanggalLahir)
  const masuk  = new Date(values.tanggalMasuk)
  const hitung = new Date(values.tanggalPerhitungan)

  if (isNaN(lahir.getTime()) || isNaN(masuk.getTime()) || isNaN(hitung.getTime())) return null
  if (masuk >= hitung) return null

  const usiaSekarang = selisihTahun(lahir, hitung)
  const usiaMasuk    = selisihTahun(lahir, masuk)
  const mkLalu       = selisihTahun(masuk, hitung)
  const mkTotal      = values.usiaPensiun - usiaMasuk
  const mkMendatang  = Math.max(0, values.usiaPensiun - usiaSekarang)

  if (usiaSekarang <= 0 || usiaSekarang >= values.usiaPensiun) return null

  const atribusi    = hitungAtribusi(usiaMasuk, usiaSekarang, values.usiaPensiun)
  const psgPensiun  = getFaktorPSG(mkTotal)
  const upmkPensiun = getFaktorUPMK(mkTotal)

  const rows: [string, string][] = [
    ['Usia saat ini',        formatTahunBulan(usiaSekarang)],
    ['Masa kerja lalu',      formatTahunBulan(mkLalu)],
    ['Sisa sampai pensiun',  formatTahunBulan(mkMendatang)],
    ['Total masa kerja',     formatTahunBulan(mkTotal)],
    ['Atribusi mulai usia',  `${atribusi.usiaStartAtribusi.toFixed(1)} (sesuai DSAK 2022)`],
    ['PSG di pensiun',       `${psgPensiun}× upah`],
    ['UPMK di pensiun',      `${upmkPensiun}× upah`],
  ]

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
      <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ringkasan Data</p>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(([label, val]) => (
          <div key={label} className="flex justify-between items-center px-4 py-1.5">
            <span className="text-xs text-gray-500">{label}</span>
            <span className="text-xs font-medium text-gray-800 text-right">{val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────
interface EmployeeFormProps {
  defaultValues?: Partial<EmployeeFormValues>
  onChange?: (values: EmployeeFormValues, valid: boolean) => void
}

export function EmployeeForm({ defaultValues, onChange }: EmployeeFormProps) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nama:               defaultValues?.nama ?? '',
      nik:                defaultValues?.nik ?? '',
      tanggalLahir:       defaultValues?.tanggalLahir ?? '',
      tanggalMasuk:       defaultValues?.tanggalMasuk ?? '',
      tanggalPerhitungan: defaultValues?.tanggalPerhitungan ?? '2024-12-31',
      upahBulanan:        defaultValues?.upahBulanan ?? '',
      jenisKelamin:       defaultValues?.jenisKelamin ?? 'L',
      usiaPensiun:        defaultValues?.usiaPensiun ?? 55,
    },
    mode: 'onChange',
  })

  const values = watch()

  useEffect(() => {
    const subscription = watch((value) => {
      employeeSchema.safeParseAsync(value).then((r) => {
        onChange?.(value as EmployeeFormValues, r.success)
      })
    })
    return () => subscription.unsubscribe()
  }, [watch, onChange])

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-gray-800">Data Karyawan</h3>

      <Input
        label="Nama karyawan"
        placeholder="Contoh: Budi Santoso"
        required
        error={errors.nama?.message}
        {...register('nama')}
      />

      <Input
        label="NIK / ID Karyawan"
        placeholder="contoh: 12345"
        error={errors.nik?.message}
        {...register('nik')}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Tanggal lahir"
          type="date"
          required
          error={errors.tanggalLahir?.message}
          {...register('tanggalLahir')}
        />
        <Input
          label="Tanggal masuk kerja"
          type="date"
          required
          error={errors.tanggalMasuk?.message}
          {...register('tanggalMasuk')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Tanggal perhitungan"
          type="date"
          required
          error={errors.tanggalPerhitungan?.message}
          {...register('tanggalPerhitungan')}
        />
        <Input
          label="Usia pensiun"
          type="number"
          min={45}
          max={65}
          required
          suffix="tahun"
          error={errors.usiaPensiun?.message}
          {...register('usiaPensiun', { valueAsNumber: true })}
        />
      </div>

      <Controller
        name="upahBulanan"
        control={control}
        render={({ field }) => (
          <Input
            label="Upah bulanan"
            prefix="Rp"
            placeholder="5.000.000"
            required
            error={errors.upahBulanan?.message}
            helperText="Gaji pokok + tunjangan tetap"
            value={formatCurrencyInput(parseCurrencyInput(String(field.value)))}
            onChange={(e) => {
              const raw = parseCurrencyInput(e.target.value)
              field.onChange(raw > 0 ? String(raw) : '')
            }}
          />
        )}
      />

      {/* Jenis Kelamin */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Jenis kelamin <span className="text-red-500">*</span></span>
        <div className="flex gap-4">
          {([['L', 'Laki-laki'], ['P', 'Perempuan']] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value={val}
                className="text-secondary focus:ring-secondary"
                {...register('jenisKelamin')}
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <DataSummary values={values} />
    </div>
  )
}
