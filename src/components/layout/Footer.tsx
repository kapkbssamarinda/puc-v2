import Link from "next/link";
import { Scale, BookOpen, AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary-800 text-primary-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Disclaimer */}
          <div className="md:col-span-2">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
              <h3 className="font-semibold text-white text-sm">Disclaimer Penting</h3>
            </div>
            <p className="text-sm leading-relaxed">
              Hasil kalkulasi bersifat <strong className="text-accent">estimasi</strong> dan{" "}
              <strong className="text-white">tidak menggantikan laporan aktuaris independen</strong>.
              Untuk keperluan pelaporan keuangan resmi sesuai PSAK 24, perusahaan wajib
              menggunakan jasa aktuaris independen yang bersertifikat (PAI).
              Aplikasi ini ditujukan untuk keperluan edukasi dan review awal oleh auditor.
            </p>
          </div>

          {/* Referensi Regulasi */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Scale className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-white text-sm">Referensi Regulasi</h3>
            </div>
            <ul className="space-y-1.5 text-sm">
              <li>• PSAK 24 — Imbalan Kerja</li>
              <li>• SAK EP — Entitas Privat</li>
              <li>• PP No. 35 Tahun 2021</li>
              <li>• DSAK IAI Siaran Pers April 2022</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-700 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            <span>PUC Kalkulator — Alat Bantu Edukasi Imbalan Pasca Kerja</span>
          </div>
          <nav className="flex gap-4">
            <Link href="/panduan" className="hover:text-white transition-colors">
              Panduan
            </Link>
            <Link href="/kalkulator" className="hover:text-white transition-colors">
              Kalkulator
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
