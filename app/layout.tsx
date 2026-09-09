import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mianca — Valuación y anuncios de equipo con IA",
  description:
    "Sube fotos de tu equipo, recibe un precio justo respaldado por comparables reales y un anuncio optimizado listo para publicar en Mercado Libre y Facebook Marketplace.",
  keywords: [
    "valuación de maquinaria usada",
    "precio justo equipo usado",
    "generador de anuncios con IA",
    "vender maquinaria en Mercado Libre",
  ],
  openGraph: {
    title: "Mianca",
    description:
      "Valuación y anuncios de equipo usado, asistidos por IA, en minutos.",
    locale: "es_MX",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-MX" className={inter.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
