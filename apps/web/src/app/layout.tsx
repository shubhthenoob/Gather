import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Highlight",
  description: "Capture now. Organise automatically. Retrieve anytime.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
