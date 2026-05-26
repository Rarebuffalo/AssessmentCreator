import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AssessmentAI – Smart Question Paper Generator",
  description:
    "Create professional AI-powered question papers in minutes. Powered by Gemini AI.",
  keywords: ["assessment", "question paper", "AI", "education", "teacher tools"],
  authors: [{ name: "AssessmentAI" }],
  openGraph: {
    title: "AssessmentAI – Smart Question Paper Generator",
    description: "Create professional AI-powered question papers in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
