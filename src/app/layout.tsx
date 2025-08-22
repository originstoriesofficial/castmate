import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import React from 'react';
import Link from 'next/link';
import { Mic } from "lucide-react";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const CREAM = '#f5eddd';
const RETRO_RED = '#a13d2d';

export const metadata: Metadata = {
  title: 'Castmate',
  description: 'AI-powered line reader for actors',
};

function Navbar() {
  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 border-b-4" style={{ background: CREAM, borderColor: RETRO_RED }}>
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#a13d2d] bg-[#f5eddd]">
          <Mic size={32} color={RETRO_RED} />
        </span>
        <span className="text-2xl font-black" style={{ color: RETRO_RED, fontFamily: 'serif' }}>
          <Link href="/">Castmate</Link>
        </span>
      </div>
      <div className="flex gap-6 items-center">
        <Link href="/" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>Home</Link>
        <Link href="/upload" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>Upload Script</Link>
        <Link href="/script" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>Script</Link>
        <Link href="/rehearse" className="font-mono text-lg hover:underline" style={{ color: RETRO_RED }}>Rehearse</Link>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} style={{ background: CREAM }}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
