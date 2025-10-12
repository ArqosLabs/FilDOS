import Web3Providers from "@/providers/web-providers";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css"
import { Analytics } from "@vercel/analytics/next"
import { SynapseProvider } from "@/providers/SynapseProvider";
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',   // optional: prevents layout shift
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      className={inter.className}
      >
        <Web3Providers>
          <SynapseProvider>
            <main className="flex flex-col min-h-screen">
              {children}
            </main>
          </SynapseProvider>
        </Web3Providers>
        <Analytics />
      </body>
    </html>
  );
}
