import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Menggabungkan class Tailwind dengan aman (clsx + tailwind-merge). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Menghitung usia dalam tahun desimal pada tanggal referensi.
 * Contoh: lahir 1990-03-15, ref 2024-09-15 → 34.50
 */
export function hitungUsia(tanggalLahir: Date, tanggalRef: Date): number {
  const msPerTahun = 365.25 * 24 * 60 * 60 * 1000;
  return (tanggalRef.getTime() - tanggalLahir.getTime()) / msPerTahun;
}

/**
 * Menghitung masa kerja dalam tahun desimal pada tanggal referensi.
 * Contoh: masuk 2018-07-01, ref 2024-12-31 → 6.50
 */
export function hitungMasaKerja(tanggalMasuk: Date, tanggalRef: Date): number {
  const msPerTahun = 365.25 * 24 * 60 * 60 * 1000;
  return Math.max(0, (tanggalRef.getTime() - tanggalMasuk.getTime()) / msPerTahun);
}

/**
 * Menghitung tanggal pensiun berdasarkan tanggal lahir dan usia pensiun.
 * Hasilnya adalah hari ulang tahun ke-usiaPensiun.
 */
export function hitungTanggalPensiun(tanggalLahir: Date, usiaPensiun: number): Date {
  const tgl = new Date(tanggalLahir);
  tgl.setFullYear(tgl.getFullYear() + usiaPensiun);
  return tgl;
}

/**
 * Membulatkan masa kerja ke bawah untuk keperluan perhitungan manfaat.
 * Aturan: gunakan tahun penuh (Math.floor), minimum 1 tahun untuk ada manfaat.
 */
export function bulatkanMasaKerja(masaKerjaDesimal: number): number {
  return Math.floor(masaKerjaDesimal);
}

/**
 * Mengkonversi string tanggal "YYYY-MM-DD" ke objek Date.
 * Memastikan tidak ada masalah timezone (parse sebagai UTC tengah malam).
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Memvalidasi apakah string adalah format tanggal "YYYY-MM-DD" yang valid.
 */
export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = parseDate(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Menghitung sisa masa kerja (dalam tahun desimal) dari tanggal referensi ke pensiun.
 */
export function hitungSisaMasaKerja(tanggalRef: Date, tanggalPensiun: Date): number {
  const msPerTahun = 365.25 * 24 * 60 * 60 * 1000;
  return Math.max(0, (tanggalPensiun.getTime() - tanggalRef.getTime()) / msPerTahun);
}

/**
 * Memformat nama metode untuk ditampilkan di UI.
 */
export function labelMetode(metode: string): string {
  const labels: Record<string, string> = {
    LIQUIDATION: "Metode Likuidasi",
    PUC_NO_ECON: "PUC Tanpa Asumsi Ekonomi",
    PUC_WITH_ECON: "PUC dengan Asumsi Ekonomi",
    PUC_COMPREHENSIVE: "PUC Komprehensif",
  };
  return labels[metode] ?? metode;
}
