import { Navbar } from "@/components/navbar";
import { CollectionProvider } from "@/modules/collections/contexts/collection-context";
import { QueryProvider } from "@/providers/query-provider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Items Management",
  description: "Manage your items",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <CollectionProvider>
            <Navbar />
            {children}
            <Toaster position="top-center" />
          </CollectionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
