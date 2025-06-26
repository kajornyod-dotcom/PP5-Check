import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ฟอร์มส่ง ปพ.5 โรงเรียนโพนงามพิทยานุกูล",
  description: "ระบบส่งไฟล์ ปพ.5 เพื่อตรวจสอบข้อมูล",
  icons: {
    icon: [
      {
        url: "/logo-ppk-512x512-1.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/logo-ppk-512x512-1.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/logo-ppk-512x512-1.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/logo-ppk-512x512-1.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/logo-ppk-512x512-1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
