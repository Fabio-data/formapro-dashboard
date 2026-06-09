import type { NextConfig } from "next";

// Cabeceras de seguridad. Defensa en profundidad por encima de RLS de Supabase.
// La fuente de verdad para acceso a datos sigue siendo las policies en Supabase;
// estas cabeceras endurecen el navegador y el origen de la app desplegada.
const isDev = process.env.NODE_ENV !== "production";

// React en development necesita eval() para reconstruir stacks; en producción no.
// Por eso 'unsafe-eval' solo se incluye en dev. En prod la CSP es más estricta.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  // Anti clickjacking. La app no debe ser embebible en iframes externos.
  { key: "X-Frame-Options", value: "DENY" },
  // Evita MIME sniffing.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Solo enviar Referer al mismo origen en cross-origin. No leak de query strings.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Forzar HTTPS en Vercel y previews. En localhost los navegadores la ignoran.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Apagar APIs sensibles que el dashboard no necesita.
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  // CSP: script-src y style-src admiten 'unsafe-inline' porque Next 16 inyecta
  // bootstrap inline y Recharts inyecta estilos inline en SVG. connect-src abre
  // Supabase para queries client-side futuras (hoy la lectura es server-side).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
