import Link from "next/link";
import {
  Calculator,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Info,
  Scale,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────

const navCards = [
  {
    href: "/kalkulator",
    icon: Calculator,
    title: "Kalkulator",
    subtitle: "Satu Karyawan",
    description:
      "Hitung liabilitas imbalan pasca kerja untuk satu karyawan. Setiap langkah ditampilkan secara transparan agar mudah dipahami dan diverifikasi.",
    color: "bg-secondary",
    badge: "Paling detail",
  },
  {
    href: "/batch",
    icon: Users,
    title: "Batch",
    subtitle: "Banyak Karyawan",
    description:
      "Hitung sekaligus untuk seluruh karyawan. Import data via CSV, pilih metode, dan ekspor hasil ke Excel atau PDF.",
    color: "bg-primary",
    badge: "Import CSV",
  },
  {
    href: "/estimasi",
    icon: BarChart3,
    title: "Estimasi Rata-rata",
    subtitle: "Data Agregat",
    description:
      "Estimasi cepat menggunakan data rata-rata karyawan. Cocok untuk analisis awal atau perusahaan tanpa data individual.",
    color: "bg-accent",
    badge: "Cepat",
  },
];

const metodePerhitungan = [
  {
    nama: "Metode Likuidasi",
    kode: "LIQUIDATION",
    deskripsi:
      "Pesangon yang harus dibayar jika seluruh karyawan diberhentikan hari ini. Dasar perbandingan, bukan metode PSAK 24.",
    psak: false,
    tagColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    tag: "Baseline",
  },
  {
    nama: "PUC Tanpa Asumsi Ekonomi",
    kode: "PUC_NO_ECON",
    deskripsi:
      "Metode Projected Unit Credit menggunakan gaji saat ini tanpa proyeksi inflasi atau diskonto. Sesuai Contoh 3 DSAK IAI 2022.",
    psak: true,
    tagColor: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    tag: "Contoh 3 DSAK IAI",
  },
  {
    nama: "PUC dengan Asumsi Ekonomi",
    kode: "PUC_WITH_ECON",
    deskripsi:
      "PUC dengan proyeksi kenaikan gaji dan diskonto obligasi pemerintah. Sesuai Contoh 4 DSAK IAI 2022.",
    psak: true,
    tagColor: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    tag: "Contoh 4 DSAK IAI",
  },
  {
    nama: "PUC Komprehensif",
    kode: "PUC_COMPREHENSIVE",
    deskripsi:
      "PUC lengkap dengan asumsi demografi (mortalitas, turnover, disabilitas). Standar laporan aktuaris untuk audit PSAK 24.",
    psak: true,
    tagColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    tag: "Standar Audit",
  },
];

const fiturKunci = [
  "Transparansi langkah-langkah perhitungan dengan tooltip penjelasan",
  "Empat metode dari baseline hingga standar audit",
  "Atribusi manfaat sesuai DSAK IAI Siaran Pers April 2022",
  "Rekonsiliasi NKKIP dan komponen beban laporan keuangan",
  "Ekspor ke Excel dan PDF siap audit",
  "Import data karyawan dari CSV",
];

// ─── Komponen ─────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-full">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-primary via-primary-700 to-secondary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-sm mb-6">
              <Scale className="w-4 h-4 text-accent" />
              <span>SAK EP · PSAK 24 · PP No. 35/2021</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
              Kalkulator Imbalan
              <br />
              <span className="text-accent">Pasca Kerja</span>
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 leading-relaxed">
              Perhitungan liabilitas imbalan pasca kerja sesuai SAK EP / PSAK 24
              menggunakan metode{" "}
              <strong className="text-white">Projected Unit Credit (PUC)</strong>.
              Dirancang untuk junior auditor KAP — setiap istilah teknis dijelaskan
              dalam bahasa sederhana.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/kalkulator"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-600 text-primary-900 font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg"
              >
                <Calculator className="w-5 h-5" />
                Mulai Kalkulator
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/panduan"
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-3 rounded-lg transition-colors border border-white/20"
              >
                <Info className="w-5 h-5" />
                Baca Panduan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Navigasi 3 Card ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {navCards.map(({ href, icon: Icon, title, subtitle, description, color, badge }) => (
            <Link
              key={href}
              href={href}
              className="group bg-white dark:bg-primary-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 ease-expo-out overflow-hidden border border-gray-100 dark:border-primary-700 hover:-translate-y-1"
            >
              <div className={`${color} p-4 flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 rounded-lg p-2">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-lg leading-none">{title}</div>
                    <div className="text-white/70 text-xs mt-0.5">{subtitle}</div>
                  </div>
                </div>
                <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                  {badge}
                </span>
              </div>
              <div className="p-5">
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{description}</p>
                <div className="mt-4 flex items-center gap-1 text-secondary dark:text-secondary-400 text-sm font-medium group-hover:gap-2 transition-all">
                  Buka <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Metode Perhitungan ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">4 Metode Perhitungan</h2>
          <p className="text-muted dark:text-gray-400">
            Dari baseline non-PSAK hingga standar audit penuh. Pilih sesuai kebutuhan analisis.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metodePerhitungan.map((m) => (
            <div
              key={m.kode}
              className="bg-white dark:bg-primary-800 rounded-xl border border-gray-200 dark:border-primary-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base">{m.nama}</h3>
                <div className="flex gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${m.tagColor}`}>
                    {m.tag}
                  </span>
                  {m.psak && (
                    <span className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                      PSAK 24
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{m.deskripsi}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fitur Kunci ── */}
      <section className="bg-white dark:bg-primary-900 border-y border-gray-100 dark:border-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Dirancang untuk Junior Auditor
              </h2>
              <p className="text-muted dark:text-gray-400 leading-relaxed mb-6">
                Tidak perlu latar belakang aktuaria. Setiap istilah teknis dilengkapi tooltip
                penjelasan sederhana, dan setiap langkah perhitungan ditampilkan secara
                transparan sehingga mudah ditelusuri dan diverifikasi.
              </p>
              <ul className="space-y-3">
                {fiturKunci.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-secondary dark:text-secondary-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ilustrasi output */}
            <div className="bg-surface dark:bg-primary-800/50 rounded-xl p-6 border border-gray-200 dark:border-primary-700">
              <div className="space-y-3">
                {[
                  {
                    label: "Present Value of DBO",
                    nilai: "Rp 45.230.000",
                    bold: true,
                  },
                  { label: "Current Service Cost", nilai: "Rp 3.180.000", bold: false },
                  { label: "Interest Cost", nilai: "Rp 2.940.000", bold: false },
                  { label: "Gaji Proyeksi (Pensiun)", nilai: "Rp 28.500.000", bold: false },
                  { label: "Masa Kerja", nilai: "14 tahun 3 bulan", bold: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2.5 border-b border-gray-200 dark:border-primary-700/50 last:border-0"
                  >
                    <span className="text-sm text-muted dark:text-gray-400">{item.label}</span>
                    <span
                      className={`text-sm ${item.bold ? "font-bold text-primary dark:text-white" : "text-gray-700 dark:text-gray-300"}`}
                    >
                      {item.nilai}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted dark:text-gray-400 bg-gray-100 dark:bg-primary-800 px-3 py-1.5 rounded-full">
                  <Info className="w-3.5 h-3.5" />
                  Contoh output · PUC Komprehensif
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Siap Menghitung?</h2>
        <p className="text-muted dark:text-gray-400 mb-6 max-w-xl mx-auto">
          Mulai dengan kalkulator individual untuk satu karyawan, atau langsung gunakan
          batch untuk seluruh perusahaan.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/kalkulator"
            className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            <Calculator className="w-5 h-5" />
            Kalkulator Individual
          </Link>
          <Link
            href="/batch"
            className="inline-flex items-center gap-2 bg-white dark:bg-primary-800 hover:bg-gray-50 dark:hover:bg-primary-700 text-primary dark:text-white font-semibold px-6 py-3 rounded-lg transition-colors border border-gray-300 dark:border-primary-700"
          >
            <Users className="w-5 h-5" />
            Batch Multi-Karyawan
          </Link>
        </div>
      </section>
    </div>
  );
}
