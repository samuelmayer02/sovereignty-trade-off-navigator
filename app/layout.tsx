import type { Metadata } from "next";
import "./globals.css";
import { DataLoader } from "@/components/DataLoader";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import StaticModeBanner from "@/components/StaticModeBanner";

export const metadata: Metadata = {
  title: "Sovereignty Trade-off Navigator",
  description: "Navigiere die komplexen Abhängigkeiten zwischen digitaler Souveränität, Resilienz und Kosten in der Cloud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInitializer />
      </head>
      <body className="antialiased">
        <StaticModeBanner />
        <DataLoader />
        {children}
      </body>
    </html>
  );
}
