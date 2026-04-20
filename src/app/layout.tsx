import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
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
  title: "ZombieCoder Agentic Hub",
  description: "যেখানে কোড ও কথা বলে - AI Development Assistant",
  keywords: [
    "ZombieCoder",
    "AI",
    "Development Assistant",
    "Agentic Hub",
    "Sahon Srabon",
    "Developer Zone",
    "Bangladesh",
  ],
  authors: [{ name: "Sahon Srabon" }],
  openGraph: {
    title: "ZombieCoder Agentic Hub",
    description: "যেখানে কোড ও কথা বলে - AI Development Assistant",
    siteName: "ZombieCoder",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZombieCoder Agentic Hub",
    description: "যেখানে কোড ও কথা বলে - AI Development Assistant",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
