import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://triskele-6ct.pages.dev";
const description =
  "A privacy-first encrypted vault that opens only when three guardians you trust agree. End-to-end encrypted in your browser.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Triskele — The vault that opens when your circle agrees.",
    template: "%s · Triskele",
  },
  description,
  applicationName: "Triskele",
  // src/app/icon.png and src/app/apple-icon.png are auto-picked-up by App Router.
  openGraph: {
    title: "Triskele — The vault that opens when your circle agrees.",
    description,
    url: siteUrl,
    siteName: "Triskele",
    type: "website",
    images: [
      {
        url: "/logo-mark.png",
        width: 512,
        height: 512,
        alt: "Triskele mark — a shield surrounded by three guardian nodes",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Triskele — The vault that opens when your circle agrees.",
    description,
    images: ["/logo-mark.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050608",
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
