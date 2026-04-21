import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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
      <body className="antialiased">
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
