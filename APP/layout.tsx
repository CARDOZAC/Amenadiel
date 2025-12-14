import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema DLE - Gestión de Microcrédito",
  description: "Sistema de Gestión de Microcrédito Diario de Alto Rendimiento",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
