import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Article Forge — Generate articles with AI",
  description:
    "A server-secured, rate-limited article generator powered by n8n and AI. Craft professional articles in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        {/* System-aware theme color */}
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#faf9f7" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#1e1b17" />
        <meta name="color-scheme" content="light dark" />
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&amp;family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&amp;display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
