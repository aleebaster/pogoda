import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pogoda Fishing Assistant",
  description: "Telegram fishing assistant and Vercel-ready fishing forecast dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
