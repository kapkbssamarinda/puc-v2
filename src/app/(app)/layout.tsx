import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-progress focus:bg-white focus:text-secondary focus:text-sm focus:font-medium focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Lewati ke konten utama
      </a>
      <Header />
      <main id="konten-utama" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
