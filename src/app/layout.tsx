import type { Metadata } from "next";
import Script from "next/script";
import { Fraunces, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Article Forge — Generate articles with AI",
  description:
    "A server-secured, rate-limited article generator powered by n8n and AI. Craft professional articles in seconds.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

const sansFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const serifFont = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sansFont.variable} ${serifFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
      data-theme="light"
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf9f7" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e1b17" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
