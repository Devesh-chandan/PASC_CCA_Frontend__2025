import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "../../components/layout/NavbarWrapper";
import ThemeProvider from "../../components/ThemProvider";
import { ToastProvider } from "@/components/ui/toast";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "PASC CCA Platform | Co-Curricular Activities",
  description: "Discover, participate, and excel in co-curricular activities. Track your progress, earn credits, and compete with peers at PASC.",
  keywords: ["PASC", "CCA", "co-curricular", "activities", "student", "events", "credits"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ToastProvider>
            <NavbarWrapper />
            <div className="pt-0">
              {children}
            </div>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}