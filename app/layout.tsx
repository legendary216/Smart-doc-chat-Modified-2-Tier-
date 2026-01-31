import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider"; // <--- Import
import { Providers } from '@/components/providers'
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Doc Chat",
  description: "AI Powered Document Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Wrap children with AuthProvider */}
        <AuthProvider> 
          <Providers>
          {children}
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}