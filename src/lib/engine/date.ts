// Util tanggal bersama untuk seluruh metode perhitungan engine.

/** Parse "YYYY-MM-DD" sebagai tengah malam waktu lokal (hindari geser timezone). */
export function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00')
}

/** Selisih dua tanggal dalam tahun desimal (basis 365,25 hari). */
export function selisihTahun(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
}
