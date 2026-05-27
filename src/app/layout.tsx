/**
 * src/app/layout.tsx
 * Layout principal com injeção do AuthProvider, AppShell, Google Analytics e Google Ads.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { AuthProvider } from "@/components/auth/auth-provider";
import AppShell from "@/components/ui/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestão Pro - Gráfica Gramame",
  description: "Sistema de gestão inteligente para gráficas e vitrine online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" className="scroll-smooth">
      <head>
        {/* ==========================================
            GOOGLE ANALYTICS (GA4) & GOOGLE ADS
            ========================================== */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-5D4ZHH0H4T`}
        />
        <Script
          id="google-tags"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              /* 1. Google Analytics (Já estava correto) */
              gtag('config', 'G-5D4ZHH0H4T', {
                page_path: window.location.pathname,
              });

              /* 2. Google Ads (COLOQUE O SEU ID AW- ABAIXO) */
              gtag('config', 'AW-18036800440');
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-slate-950 text-slate-200 antialiased`}>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}