import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gather",
  description: "Keep what matters. Find it later.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
