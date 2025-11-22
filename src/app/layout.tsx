import "./globals.css";
import { Analytics } from "@vercel/analytics/next"
import { SynapseProvider } from "@/providers/SynapseProvider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { ThirdwebProvider } from "thirdweb/react";
import { ChainWarning } from "@/components/chain-warning";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'FilDOS - AI-Native Decentralized Storage',
    template: '%s | FilDOS'
  },
  description: 'A Secure, AI-Native, Meaning-First Decentralized Drive built on Filecoin',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
      className={inter.className}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ThirdwebProvider>
            <ReactQueryProvider>
              <SynapseProvider>
                <ChainWarning />
                <main className="flex flex-col min-h-screen">
                  {children}
                </main>
              </SynapseProvider>
            </ReactQueryProvider>
          </ThirdwebProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
