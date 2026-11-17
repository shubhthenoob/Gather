import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://gatherme.vercel.app"),
  title: "Gather",
  description: "Keep what matters. Find it later. Highlight text on any website and find it again in seconds.",
  icons: { icon: "/icon.svg" },
  openGraph: {
    siteName: "Gather",
    type: "website",
    images: [{ url: "/screens/screenshot-2.png", width: 1280, height: 800, alt: "The Gather library" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
