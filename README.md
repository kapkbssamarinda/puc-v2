# Kalkulator Imbalan Pasca Kerja (PUC Method)

Web application untuk menghitung liabilitas imbalan pasca kerja sesuai **SAK EP / PSAK 24** menggunakan metode **Projected Unit Credit (PUC)**.

Dirancang untuk junior auditor KAP yang perlu memverifikasi perhitungan klien secara cepat dan terstandar.

---

## Fitur Utama

| Fitur | Keterangan |
|-------|-----------|
| **4 Metode** | Liquidation → PUC Sederhana → PUC + Ekonomi → PUC Komprehensif |
| **3 Mode Input** | Per karyawan \| Batch multi-karyawan \| Estimasi rata-rata |
| **Import CSV** | Drag-drop CSV untuk batch calculation |
| **Export** | Excel (workpaper detail) dan PDF (laporan) |
| **Draft CALK** | Catatan Atas Laporan Keuangan otomatis |
| **Atribusi DSAK IAI 2022** | Cap 24 tahun sudah diterapkan |
| **TMI-2019** | Tabel mortalita Indonesia built-in |
| **Panduan** | Penjelasan konsep dalam bahasa sederhana |

---

## Dasar Perhitungan

- **SAK EP** Paragraf 28.18 (metode PUC & penyederhanaan)
- **UU No. 6/2023** (Cipta Kerja) jo. **PP No. 35/2021**
- **DSAK IAI Siaran Pers April 2022** (atribusi maksimum 24 tahun)
- **Tabel Mortalita Indonesia IV (2019)** — TMI-2019
- **IGSYC** dari PHEI untuk tingkat diskonto

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Jalankan dev server
npm run dev
# → http://localhost:3000

# 3. Build production
npm run build
npm start
```

---

## Testing

```bash
# Install test runner (sekali saja)
npm install -D vitest

# Jalankan semua test
npx vitest run

# Watch mode
npx vitest
```

Test cases mencakup:
- Tabel PSG dan UPMK (semua nilai edge case)
- Contoh 4 DSAK IAI 2022 — PUC_ECONOMIC (NKKIP ≈ 125.576 ribuan)
- Contoh 5 DSAK IAI 2022 — PUC_FULL (NKKIP ≈ 114.764 ribuan)
- Atribusi DSAK IAI 2022 — karyawan muda NKKIP = 0

---

## Deploy

### Vercel (Direkomendasikan)

1. Push ke GitHub
2. Import project di [vercel.com](https://vercel.com)
3. Deploy otomatis setiap push ke `main`

### GitHub Pages

```bash
# Build statis
GITHUB_PAGES=true npm run build
# Output di ./out/

# Atau via GitHub Actions (otomatis saat push ke main)
# Lihat: .github/workflows/deploy.yml
```

**Cara setup GitHub Pages:**
1. Di repo GitHub → Settings → Pages → Source: "GitHub Actions"
2. Push ke `main` → Actions akan build dan deploy otomatis
3. URL: `https://<username>.github.io/puc-calculator/`

> **Catatan:** Ubah `repoName` di `next.config.mjs` sesuai nama repo Anda.

---

## Struktur Proyek

```
src/
├── app/
│   ├── kalkulator/   # Kalkulator per karyawan
│   ├── batch/        # Batch multi-karyawan + CSV
│   ├── estimasi/     # Estimasi rata-rata / distribusi
│   └── panduan/      # Panduan penggunaan
├── components/
│   ├── ui/           # Button, Card, Input, Select, dll.
│   ├── calculator/   # MethodSelector, EmployeeForm, AssumptionsForm
│   └── results/      # ResultsSummary, CalculationSteps, FSNote, dll.
└── lib/
    ├── engine/       # Domain: types, tables, attribution, probability, methods
    ├── csv/          # Parser CSV/Excel (xlsx)
    └── export/       # Excel (xlsx) + PDF (jspdf)
```

---

## Disclaimer

> Hasil perhitungan bersifat **estimasi** untuk keperluan review dan edukasi audit.
> Laporan keuangan resmi yang diaudit wajib menggunakan laporan **aktuaris independen bersertifikat (PAI)**.

---

## Lisensi

MIT — bebas digunakan untuk keperluan edukasi dan internal KAP.
