import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Script anti-flash: aplica la clase .dark antes del primer paint leyendo la
// preferencia guardada (o el prefers-color-scheme del sistema). Se inyecta como
// string en <head> para que el navegador lo ejecute durante el parseo, antes de
// pintar. Va fuera del árbol React para no provocar warnings de hidratación.
const THEME_INIT = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`;

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FormaPro · Dashboard de pagos",
  description:
    "Dashboard de pagos de FormaPro Academy. Lee la tabla pagos de Supabase, formatea por moneda y permite filtrar, buscar y exportar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {children}
      </body>
    </html>
  );
}
