"use client";

import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit";

const queryClient = new QueryClient();

const config = getDefaultConfig({
  appName: 'FilDOS',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!, 
  chains: [filecoinCalibration, filecoin],
  transports: {
    [filecoin.id]: http(),
    [filecoinCalibration.id]: http(),
  },
  ssr: true,
});


export default function Web3Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={config}>
            <RainbowKitProvider
              modalSize="compact"
                  theme={lightTheme({
                    accentColor: '#0295f6',
                    accentColorForeground: 'white',
                    borderRadius: 'medium',
                    fontStack: 'system',
                    overlayBlur: 'small',
                  })}
            >
              <main className="flex flex-col min-h-screen">
                {children}
              </main>
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
  );
}
