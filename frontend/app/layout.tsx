import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "TripKeeper — Premium Travel Planning",
  description:
    "TripKeeper is an immersive, AI-powered travel planning application for curating perfect journeys.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} ${playfair.variable} font-sans bg-[#0a0a0a] text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
