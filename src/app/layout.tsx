import type { Metadata } from "next";
import "./globals.css";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Pau Henriques | Vive sin tóxicos",
  description: "Pau Henriques te guía hacia una vida saludable y sin tóxicos. Descubre consejos de bienestar, podcast, y productos para tu salud integral.",
  icons: {
    icon: "/jarrito-favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body style={{ backgroundColor: "#143109" }}>
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
