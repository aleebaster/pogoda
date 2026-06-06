import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pogoda-woad.vercel.app"),
  title: "Рибальський помічник України | Pogoda Fishing Assistant",
  description: "Преміальний сервіс прогнозу кльову, погоди, активної риби, водойм і маршрутів для рибалки в Україні.",
  openGraph: {
    title: "Рибальський помічник України",
    description: "Коли клює, де ловити і яка риба активна сьогодні.",
    type: "website",
    locale: "uk_UA",
    images: [
      {
        url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Рибальський світанок біля озера",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Рибальський помічник України",
    description: "Прогноз кльову, водойми, маршрути і активна риба.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
