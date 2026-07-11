import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "PUC Kalkulator — Imbalan Pasca Kerja PSAK 24",
    template: "%s | PUC Kalkulator",
  },
  description:
    "Kalkulator imbalan pasca kerja sesuai SAK EP / PSAK 24 menggunakan metode Projected Unit Credit (PUC). Dirancang untuk junior auditor KAP — hitung NKKIP, Biaya Jasa Kini, dan draft CALK.",
  keywords: ["PSAK 24", "SAK EP", "imbalan pasca kerja", "PUC", "aktuaria", "kalkulator", "KAP", "auditor", "pesangon", "PP 35 2021"],
  authors: [{ name: "Viany Ramadhany" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "PUC Kalkulator — Imbalan Pasca Kerja PSAK 24",
    description: "Hitung liabilitas imbalan pasca kerja sesuai SAK EP / PSAK 24 dengan metode Projected Unit Credit.",
    type: "website",
    locale: "id_ID",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="font-sans bg-surface text-gray-900 flex flex-col min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
