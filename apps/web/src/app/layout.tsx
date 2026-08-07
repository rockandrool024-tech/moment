import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOMENT",
  description: "Creator-competition marketplace — Phase 1 client",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#16643f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          <main className="container">{children}</main>
          <PwaInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
