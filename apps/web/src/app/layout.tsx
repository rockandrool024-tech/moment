import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { PageTransition } from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Perokio",
  description: "Creator-competition marketplace — Phase 1 client",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          <Sidebar />
          <main className="container container-with-sidebar">
            <PageTransition>{children}</PageTransition>
          </main>
          <BottomNav />
          <PwaInstallPrompt />
        </AuthProvider>
      </body>
    </html>
  );
}
