import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { NavBar } from "@/components/NavBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOMENT",
  description: "Creator-competition marketplace — Phase 1 client",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <NavBar />
          <main className="container">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
