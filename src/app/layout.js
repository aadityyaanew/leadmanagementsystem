import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Compare Degree | Admissions & Lead Management Platform",
  description:
    "Smart Decisions, Brighter Futures — Centralized Higher Education Lead Management System & Admissions CRM for Compare Degree.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ colorScheme: "light" }}
      data-theme="light"
    >
      <body
        className="min-h-full flex flex-col bg-[#FBFBFC] text-slate-900 font-sans selection:bg-rose-100 selection:text-rose-900"
        style={{ colorScheme: "light" }}
      >
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
