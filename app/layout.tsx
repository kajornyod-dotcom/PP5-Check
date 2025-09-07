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
  title: "ฟอร์มส่ง ปพ.5 โรงเรียนวารินชำราบ",
  description: "ระบบส่งไฟล์ ปพ.5 เพื่อตรวจสอบข้อมูล",
  icons: {
    icon: [
      {
        url: "/Gold LOGO WR no EF.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: "/Gold LOGO WR no EF.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/Gold LOGO WR no EF.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/Gold LOGO WR no EF.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/Gold LOGO WR no EF.png",
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
