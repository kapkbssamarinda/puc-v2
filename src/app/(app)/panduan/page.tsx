import { BookOpen, Scale, Info, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panduan Penggunaan",
  description:
    "Panduan lengkap perhitungan imbalan pasca kerja PSAK 24 / SAK EP dalam bahasa Indonesia sederhana untuk junior auditor KAP.",
};

// ─── Data tabel ────────────────────────────────────────────────────────────────

const PSG_ROWS = [
  ["< 1 tahun",  "1 bulan"],
  ["1 – < 2",    "2 bulan"],
  ["2 – < 3",    "3 bulan"],
  ["3 – < 4",    "4 bulan"],
  ["4 – < 5",    "5 bulan"],
  ["5 – < 6",    "6 bulan"],
  ["6 – < 7",    "7 bulan"],
  ["7 – < 8",    "8 bulan"],
  ["≥ 8 tahun",  "9 bulan (cap)"],
];

const UPMK_ROWS = [
  ["< 3 tahun",   "0 bulan"],
  ["3 – < 6",     "2 bulan"],
  ["6 – < 9",     "3 bulan"],
  ["9 – < 12",    "4 bulan"],
  ["12 – < 15",   "5 bulan"],
  ["15 – < 18",   "6 bulan"],
  ["18 – < 21",   "7 bulan"],
  ["21 – < 24",   "8 bulan"],
  ["≥ 24 tahun",  "10 bulan (cap)"],
];

// Faktor gabungan UUCK = 1,75×PSG + 1×UPMK  (untuk pensiun normal PP 35/2021)
const FAKTOR_GABUNGAN = [
  ["< 1",   "1",  "0",  "1,75"],
  ["1–2",   "2",  "0",  "3,50"],
  ["2–3",   "3",  "0",  "5,25"],
  ["3–6",   "4–6","2",  "9,00–12,50"],
  ["6–9",   "6–7","3",  "13,50–15,25"],
  ["9–12",  "7–9","4",  "16,25–19,75"],
  ["12–15", "9",  "5",  "20,75"],
  ["15–18", "9",  "6",  "21,75"],
  ["18–21", "9",  "7",  "22,75"],
  ["21–24", "9",  "8",  "23,75"],
  ["≥ 24",  "9",  "10", "25,75 (maks)"],
];

const STEPS_KALKULATOR = [
  {
    no: "1",
    judul: "Pilih Metode",
    isi: "Pilih metode perhitungan sesuai kebutuhan klien. Untuk kebanyakan klien SAK EP, gunakan PUC + Asumsi Ekonomi. Lihat Bagian 2 untuk panduan memilih.",
  },
  {
    no: "2",
    judul: "Isi Data Karyawan",
    isi: "Masukkan: nama, tanggal lahir (YYYY-MM-DD), tanggal masuk kerja, dan upah bulanan (gaji pokok + tunjangan tetap). Panel Ringkasan Data akan otomatis menampilkan masa kerja dan faktor PSG/UPMK.",
  },
  {
    no: "3",
    judul: "Set Asumsi Ekonomi",
    isi: "Tingkat diskonto: gunakan yield SBN 10 tahun dari IGSYC PHEI (biasanya 6,5–8%). Kenaikan gaji: proyeksi inflasi + kenaikan nyata, umumnya 4–7%. Asumsi ini harus konsisten antar periode.",
  },
  {
    no: "4",
    judul: "Klik Hitung",
    isi: "Kalkulator menampilkan NKKIP (liabilitas di neraca) dan Biaya Jasa Kini (beban L/R). Gulir ke bawah untuk melihat langkah perhitungan, perbandingan metode, dan draft CALK.",
  },
  {
    no: "5",
    judul: "Verifikasi & Export",
    isi: "Bandingkan hasil dengan kertas kerja tahun lalu. Export ke Excel untuk workpaper detail atau PDF untuk lampiran laporan. Salin draft CALK untuk keperluan dokumentasi.",
  },
];

const ATRIBUSI_CONTOH = [
  {
    label: "Karyawan A — Masa kerja pendek",
    usiaMasuk: 20,
    usiaSekarang: 25,
    usiaPensiun: 55,
    usiaStart: "max(20, 55−24) = 31",
    mkAtribusiLalu: "max(0, 25−31) = 0",
    proporsi: "0 / 24 = 0",
    nkkip: "0",
    catatan: "Belum masuk jendela atribusi",
  },
  {
    label: "Karyawan B — Baru masuk jendela",
    usiaMasuk: 35,
    usiaSekarang: 36,
    usiaPensiun: 55,
    usiaStart: "max(35, 55−24) = 35",
    mkAtribusiLalu: "max(0, 36−35) = 1",
    proporsi: "1 / 20 = 5%",
    nkkip: "5% × Nilai Kini Imbalan",
    catatan: "Masa kerja = 20 tahun, baru 1 tahun diatribusikan",
  },
  {
    label: "Karyawan C — Masa kerja sangat panjang",
    usiaMasuk: 20,
    usiaSekarang: 50,
    usiaPensiun: 55,
    usiaStart: "max(20, 55−24) = 31",
    mkAtribusiLalu: "max(0, 50−31) = 19",
    proporsi: "19 / 24 = 79%",
    nkkip: "79% × Nilai Kini Imbalan",
    catatan: "30 tahun MK, tapi hanya 24 tahun terakhir diatribusikan",
  },
];

// ─── Komponen kecil ───────────────────────────────────────────────────────────

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2.5">
      <span className="text-secondary">{icon}</span>
      {children}
    </h2>
  );
}

function Pill({ label, variant }: { label: string; variant: "green" | "gray" | "blue" }) {
  const cls = {
    green: "bg-green-100 text-green-700",
    gray:  "bg-gray-100 text-gray-600",
    blue:  "bg-blue-100 text-blue-700",
  }[variant];
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function SimpleTable({
  headers,
  rows,
  highlightLast,
}: {
  headers: string[];
  rows: string[][];
  highlightLast?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => {
            const isLast = highlightLast && i === rows.length - 1;
            return (
              <tr key={i} className={isLast ? "bg-amber-50 font-semibold" : "hover:bg-gray-50"}>
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-gray-700">{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PanduanPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14 print:space-y-8">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Panduan Penggunaan Kalkulator</h1>
        </div>
        <p className="text-gray-500 leading-relaxed max-w-2xl">
          Panduan ini menjelaskan konsep imbalan pasca kerja PSAK 24 / SAK EP dalam bahasa
          sederhana, cara memilih metode yang tepat, dan cara membaca hasil perhitungan.
        </p>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Penting:</strong> Kalkulator ini untuk keperluan review dan edukasi audit.
            Laporan keuangan resmi yang diaudit wajib menggunakan laporan aktuaris independen bersertifikat (PAI).
          </p>
        </div>
      </div>

      {/* ── 1. Apa itu Imbalan Pasca Kerja ── */}
      <section>
        <SectionTitle icon={<Info className="w-5 h-5" />}>
          1. Apa itu Imbalan Pasca Kerja?
        </SectionTitle>
        <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong>Imbalan pasca kerja</strong> adalah kompensasi yang diberikan perusahaan
            kepada karyawan <em>setelah</em> hubungan kerja berakhir. Di Indonesia, bentuk
            yang paling umum adalah <strong>pesangon</strong> berdasarkan Undang-Undang Cipta
            Kerja / PP No. 35 Tahun 2021.
          </p>
          <p>
            Pesangon dibayarkan saat karyawan keluar dengan alasan apapun: pensiun normal,
            mengundurkan diri, meninggal dunia, atau cacat. Besarannya tergantung pada
            <strong> masa kerja</strong> dan <strong>upah bulanan</strong>.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p className="font-semibold text-blue-900 mb-2">Kenapa perlu dihitung sekarang?</p>
            <p className="text-blue-800">
              SAK EP Pasal 28.18 dan PSAK 24 mewajibkan perusahaan untuk mengakui kewajiban
              imbalan pasca kerja secara <strong>bertahap</strong> — bukan hanya saat karyawan
              keluar. Analogi: seperti menyisihkan biaya liburan sedikit demi sedikit setiap
              bulan, bukan membayar semuanya di akhir tahun.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            {[
              { label: "NKKIP (DBO)", def: "Nilai Kini Kewajiban Imbalan Pasti — dicatat sebagai LIABILITAS di neraca." },
              { label: "Biaya Jasa Kini (CSC)", def: "Kenaikan NKKIP akibat 1 tahun tambahan masa kerja — dicatat sebagai BEBAN di L/R." },
              { label: "Biaya Bunga (IC)", def: "Bunga atas NKKIP awal periode — komponen rekonsiliasi tahun berikutnya." },
            ].map(({ label, def }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <p className="font-semibold text-gray-900 text-xs mb-1">{label}</p>
                <p className="text-xs text-gray-600">{def}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Memilih Metode ── */}
      <section>
        <SectionTitle icon={<Scale className="w-5 h-5" />}>
          2. Memilih Metode Perhitungan
        </SectionTitle>

        {/* Tabel perbandingan */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
          <table className="min-w-full text-xs sm:text-sm">
            <thead>
              <tr className="bg-primary text-white text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2.5 font-semibold">Aspek</th>
                <th className="text-center px-3 py-2.5 font-semibold">Liquidation</th>
                <th className="text-center px-3 py-2.5 font-semibold">PUC Sederhana</th>
                <th className="text-center px-3 py-2.5 font-semibold bg-secondary">PUC + Ekonomi ★</th>
                <th className="text-center px-3 py-2.5 font-semibold">PUC Komprehensif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                ["Kapan dipakai",       "Estimasi cepat / darurat",     "Klien kecil, data minim",  "Kebanyakan klien ✓",          "Klien besar, data lengkap"],
                ["Akurasi",            "Rendah (overstate)",           "Sedang",                    "Baik",                        "Terbaik"],
                ["Data dibutuhkan",    "Gaji & MK saat ini",           "+ usia pensiun",            "+ yield curve & kenaikan gaji","+ data turnover/resign"],
                ["Sesuai SAK EP?",     "Penyederhanaan",               "Penyederhanaan",            "✓ Par. 28.18",                "✓ Par. 28.18"],
                ["Perlu aktuaris?",    "Tidak",                        "Tidak",                     "Tidak",                       "Tidak wajib (Par. 28.18)"],
                ["Kompleksitas",       "Sangat mudah",                 "Mudah",                     "Sedang",                      "Kompleks"],
              ].map(([aspek, ...vals]) => (
                <tr key={aspek} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-700">{aspek}</td>
                  {vals.map((v, i) => (
                    <td key={i} className={`px-3 py-2 text-center ${i === 2 ? "bg-blue-50 text-blue-900" : "text-gray-600"}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Flowchart keputusan */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Flowchart Pemilihan Metode:</p>
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 text-sm">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-white rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0">MULAI</div>
              <div className="flex-1 space-y-3">
                {/* Q1 */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <p className="font-medium text-gray-800">Apakah klien menggunakan SAK EP?</p>
                  <div className="mt-2 flex flex-col gap-2 pl-4">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-secondary">Ya</span> → Lanjut ke bawah
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-600">Tidak (PSAK 24)</span> →
                        <span className="ml-1 text-amber-700">Disarankan aktuaris independen. Kalkulator bisa digunakan sebagai cross-check.</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Q2 */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 ml-4">
                  <p className="font-medium text-gray-800">Apakah tersedia data tingkat turnover / resign karyawan?</p>
                  <div className="mt-2 flex flex-col gap-2 pl-4">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-secondary">Ya</span> →
                        <span className="ml-1 font-semibold text-blue-700">Gunakan PUC Komprehensif</span>
                        <span className="ml-1 text-gray-500">(hasil paling akurat)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-600">Tidak</span> →
                        <span className="ml-1 font-semibold text-secondary">Gunakan PUC + Asumsi Ekonomi</span>
                        <span className="ml-1 bg-secondary text-white text-xs px-1.5 py-0.5 rounded">Direkomendasikan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Cara Menggunakan ── */}
      <section>
        <SectionTitle icon={<CheckCircle2 className="w-5 h-5" />}>
          3. Cara Menggunakan Kalkulator
        </SectionTitle>
        <div className="space-y-3">
          {STEPS_KALKULATOR.map((s) => (
            <div key={s.no} className="flex gap-4">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-white font-bold text-sm shrink-0 mt-0.5">
                {s.no}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{s.judul}</p>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{s.isi}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">Mode Batch (banyak karyawan sekaligus):</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Buka menu <strong>Batch</strong></li>
            <li>Download template CSV → isi data semua karyawan di Excel/Sheets → simpan sebagai CSV</li>
            <li>Upload file CSV atau input manual di tabel</li>
            <li>Set asumsi global → Klik &ldquo;Hitung Semua Karyawan&rdquo;</li>
            <li>Export hasil ke Excel (workpaper detail) atau PDF</li>
          </ol>
        </div>
      </section>

      {/* ── 4. Memahami Hasil ── */}
      <section>
        <SectionTitle icon={<BookOpen className="w-5 h-5" />}>
          4. Memahami Hasil Perhitungan
        </SectionTitle>
        <div className="space-y-4">
          {[
            {
              akun: "NKKIP (DBO)",
              pos: "Laporan Posisi Keuangan",
              debit: "Dr. Beban Imbalan Kerja  xxx",
              kredit: "Kr. Liabilitas Imbalan Pasca Kerja  xxx",
              ket: "Dicatat sebagai liabilitas jangka panjang. Nilainya adalah present value dari seluruh imbalan yang sudah 'diperoleh' karyawan hingga tanggal valuasi.",
              warna: "bg-secondary",
            },
            {
              akun: "Biaya Jasa Kini (CSC)",
              pos: "Laporan Laba Rugi",
              debit: "Dr. Biaya Personalia / Beban Usaha  xxx",
              kredit: "Kr. Liabilitas Imbalan Pasca Kerja  xxx",
              ket: "Beban tahun berjalan — kenaikan NKKIP karena karyawan bekerja 1 tahun lagi. Diakui sebagai beban operasional.",
              warna: "bg-emerald-500",
            },
            {
              akun: "Biaya Bunga (IC)",
              pos: "Laporan Laba Rugi (opsional)",
              debit: "Dr. Biaya Bunga  xxx",
              kredit: "Kr. Liabilitas Imbalan Pasca Kerja  xxx",
              ket: "= Tingkat diskonto × NKKIP awal periode. Mencerminkan 'bunga' atas kewajiban yang sudah ada. Digunakan saat menyajikan rekonsiliasi NKKIP antar periode.",
              warna: "bg-amber-400",
            },
          ].map(({ akun, pos, debit, kredit, ket, warna }) => (
            <div key={akun} className="py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-block h-2 w-2 rounded-full shrink-0 ${warna}`} />
                <p className="font-semibold text-gray-900">{akun}</p>
                <Pill label={pos} variant="blue" />
              </div>
              <p className="text-xs font-mono text-gray-500 mb-1">{debit}<br/>{kredit}</p>
              <p className="text-sm text-gray-600">{ket}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Atribusi DSAK IAI 2022 ── */}
      <section>
        <SectionTitle icon={<Info className="w-5 h-5" />}>
          5. Siaran Pers DSAK IAI April 2022 — Aturan Atribusi Baru
        </SectionTitle>
        <div className="space-y-4 text-sm text-gray-700">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-800 mb-2">Sebelum April 2022 (cara lama)</p>
              <p className="text-red-700">Atribusi dimulai dari <strong>tanggal masuk kerja</strong>. Karyawan yang sudah bekerja 30 tahun, semua 30 tahun diatribusikan → NKKIP bisa sangat tinggi.</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-800 mb-2">Sesudah April 2022 (cara baru) ✓</p>
              <p className="text-green-700">Atribusi <strong>maksimum 24 tahun terakhir</strong> sebelum pensiun. Karyawan yang bekerja sangat lama, NKKIP-nya lebih rendah dan lebih realistis.</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="font-semibold text-gray-800 mb-2">Rumus Atribusi (DSAK IAI April 2022)</p>
            <div className="font-mono text-xs bg-gray-50 rounded p-3 space-y-1">
              <p><span className="text-secondary font-semibold">Usia Mulai Atribusi</span> = max(usia_masuk_kerja, usia_pensiun − 24)</p>
              <p><span className="text-secondary font-semibold">MK Atribusimax</span>     = min(MK_total, 24 tahun)</p>
              <p><span className="text-secondary font-semibold">Proporsi</span>            = max(0, usia_sekarang − usia_mulai) ÷ MK_atribusimax</p>
              <p><span className="text-secondary font-semibold">NKKIP</span>               = Proporsi × Nilai Kini Imbalan</p>
            </div>
          </div>

          <p className="font-semibold text-gray-800 mt-2">Contoh ilustrasi (usia pensiun = 55 tahun):</p>
          <div className="space-y-3">
            {ATRIBUSI_CONTOH.map((c) => (
              <div key={c.label} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
                  <p className="font-medium text-gray-800 text-xs">{c.label}
                    <span className="ml-2 text-gray-500">
                      (masuk usia {c.usiaMasuk}, sekarang {c.usiaSekarang}, pensiun {c.usiaPensiun})
                    </span>
                  </p>
                </div>
                <div className="px-4 py-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Usia mulai atribusi</span><span className="font-mono">{c.usiaStart}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">MK atribusi lalu</span><span className="font-mono">{c.mkAtribusiLalu}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Proporsi</span><span className="font-mono">{c.proporsi}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">NKKIP</span><span className="font-mono font-semibold text-secondary">{c.nkkip}</span></div>
                </div>
                <div className="px-4 py-1.5 bg-blue-50 text-xs text-blue-700 border-t border-blue-100">
                  ℹ {c.catatan}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Tabel Referensi ── */}
      <section>
        <SectionTitle icon={<Scale className="w-5 h-5" />}>
          6. Tabel Referensi Imbalan
        </SectionTitle>
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Tabel PSG — Uang Pesangon (PP 35/2021 Psl 40 ayat 2)
            </p>
            <SimpleTable
              headers={["Masa Kerja", "PSG (× upah)"]}
              rows={PSG_ROWS}
              highlightLast
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Tabel UPMK — Uang Penghargaan (PP 35/2021 Psl 40 ayat 3)
            </p>
            <SimpleTable
              headers={["Masa Kerja", "UPMK (× upah)"]}
              rows={UPMK_ROWS}
              highlightLast
            />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Faktor Gabungan — UUCK PP 35/2021 (Pensiun Normal)
          </p>
          <p className="text-xs text-gray-500 mb-2">
            Rumus: <span className="font-mono">1,75 × PSG + 1 × UPMK</span>
            &nbsp;— Cap tertinggi = 25,75 bulan gaji pada MK ≥ 24 tahun
          </p>
          <SimpleTable
            headers={["Masa Kerja (thn)", "PSG", "UPMK", "Faktor Total (× upah)"]}
            rows={FAKTOR_GABUNGAN}
            highlightLast
          />
        </div>

        <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Tingkat Diskonto — IGSYC (Indonesia Government Securities Yield Curve)</p>
          <p>Gunakan yield SBN jangka panjang (10–20 tahun) dari situs PHEI: <strong>www.phei.co.id</strong></p>
          <p className="mt-1">Contoh kisaran historis: 6,5% – 8,5% per tahun. Selalu ambil yield per tanggal valuasi.</p>
        </div>
      </section>

      {/* ── 7. Referensi Hukum ── */}
      <section>
        <SectionTitle icon={<BookOpen className="w-5 h-5" />}>
          7. Dasar Hukum &amp; Referensi
        </SectionTitle>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: "SAK EP Paragraf 28.18",           desc: "Dasar metode PUC dan penyederhanaan untuk entitas privat" },
            { label: "PSAK 24 (Revisi 2023)",            desc: "Standar pelaporan imbalan kerja untuk perusahaan publik" },
            { label: "UU No. 6/2023 (Cipta Kerja)",     desc: "Omnibus law yang mengamendemen UU Ketenagakerjaan" },
            { label: "PP No. 35 Tahun 2021",             desc: "Peraturan pelaksana UUCK tentang PHK dan pesangon" },
            { label: "DSAK IAI Siaran Pers April 2022", desc: "Panduan implementasi PUC dengan 5 contoh kasus numerik" },
            { label: "Tabel Mortalita Indonesia IV (TMI-2019)", desc: "Tabel standar probabilitas mortalita untuk aktuaria" },
            { label: "IGSYC — www.phei.co.id",          desc: "Indonesia Government Securities Yield Curve untuk tingkat diskonto" },
          ].map(({ label, desc }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
