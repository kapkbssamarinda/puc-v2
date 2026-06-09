/**
 * Memformat angka menjadi format Rupiah Indonesia.
 * Contoh: 125576000 → "Rp 125.576.000"
 */
export function formatRupiah(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "Rp -";
  return (
    "Rp " +
    Math.round(n)
      .toLocaleString("id-ID", { maximumFractionDigits: 0 })
  );
}

/**
 * Memformat angka desimal sebagai persentase Indonesia.
 * Contoh: 7 → "7,00%"  |  6.5 → "6,50%"
 */
export function formatPersen(n: number, desimal = 2): string {
  if (isNaN(n) || !isFinite(n)) return "-";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  }) + "%";
}

/**
 * Mengonversi tahun desimal menjadi format "X tahun Y bulan".
 * Contoh: 6.25 → "6 tahun 3 bulan"
 */
export function formatTahunBulan(tahunDesimal: number): string {
  if (isNaN(tahunDesimal) || tahunDesimal < 0) return "-";
  const tahun = Math.floor(tahunDesimal);
  const bulan = Math.round((tahunDesimal - tahun) * 12);

  if (tahun === 0 && bulan === 0) return "0 bulan";
  if (tahun === 0) return `${bulan} bulan`;
  if (bulan === 0) return `${tahun} tahun`;
  return `${tahun} tahun ${bulan} bulan`;
}

/**
 * Memformat tanggal menjadi format panjang Indonesia.
 * Contoh: "2024-12-31" → "31 Desember 2024"
 */
export function formatTanggal(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Memformat angka bulat dengan pemisah ribuan Indonesia.
 * Contoh: 1234567 → "1.234.567"
 */
export function formatAngka(n: number, desimal = 0): string {
  if (isNaN(n) || !isFinite(n)) return "-";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: desimal,
    maximumFractionDigits: desimal,
  });
}

/**
 * Memformat faktor diskonto / probabilitas (4 desimal).
 * Contoh: 0.7835 → "0,7835"
 */
export function formatFaktor(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "-";
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}
