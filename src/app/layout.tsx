import Web3Providers from "@/providers/web-providers";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css"
import { Analytics } from "@vercel/analytics/next"
import { SynapseProvider } from "@/providers/SynapseProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
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
