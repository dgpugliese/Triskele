import type { Metadata } from "next";
import "./globals.css";

// @cloudflare/next-on-pages requires server-rendered routes to use the edge runtime.
// Declared on the root layout so every nested route inherits it.
export const runtime = "edge";

export const metadata: Metadata = {
  title: "Triskele — Quorum Vault",
  description:
    "A privacy-first encrypted vault that requires three trusted guardians to retrieve sensitive information.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Geist:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-void text-on-surface font-body antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
