import Web3Providers from "@/providers/web-providers";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css"
import { Databuddy } from '@databuddy/sdk';

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
          <main className="flex flex-col min-h-screen">
            {children}
          </main>
        </Web3Providers>
        <Databuddy
          clientId={process.env.NEXT_PUBLIC_ANALYTICS!}
          enableBatching={true}
        />
      </body>
    </html>
  );
}
