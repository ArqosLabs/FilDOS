"use client";

import { WagmiProvider } from "wagmi";
import { filecoin, filecoinCalibration } from "wagmi/chains";
import { http, createConfig } from "@wagmi/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, Theme } from "@rainbow-me/rainbowkit";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [filecoinCalibration, filecoin],
  connectors: [],
  transports: {
    [filecoin.id]: http(),
    [filecoinCalibration.id]: http(),
  },
});

const myCustomTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(8px)',
  },
  colors: {
    accentColor: '#0295f6',
    accentColorForeground: 'oklch(0.985 0 0)',
    actionButtonBorder: 'oklch(0.922 0 0)',
    actionButtonBorderMobile: 'oklch(0.922 0 0)',
    actionButtonSecondaryBackground: 'oklch(0.97 0 0)',
    closeButton: 'oklch(0.556 0 0)',
    closeButtonBackground: 'oklch(0.97 0 0)',
    connectButtonBackground: '#0295f6',
    connectButtonBackgroundError: 'oklch(0.577 0.245 27.325)',
    connectButtonInnerBackground: 'oklch(1 0 0)',
    connectButtonText: 'oklch(0.985 0 0)',
    connectButtonTextError: 'oklch(0.985 0 0)',
    connectionIndicator: '#22c55e',
    downloadBottomCardBackground: 'oklch(1 0 0)',
    downloadTopCardBackground: 'oklch(0.985 0 0)',
    error: 'oklch(0.577 0.245 27.325)',
    generalBorder: 'oklch(0.922 0 0)',
    generalBorderDim: 'oklch(0.97 0 0)',
    menuItemBackground: 'oklch(0.97 0 0)',
    modalBackdrop: 'rgba(0, 0, 0, 0.3)',
    modalBackground: 'oklch(1 0 0)',
    modalBorder: 'oklch(0.922 0 0)',
    modalText: 'oklch(0.145 0 0)',
    modalTextDim: 'oklch(0.556 0 0)',
    modalTextSecondary: 'oklch(0.556 0 0)',
    profileAction: 'oklch(0.97 0 0)',
    profileActionHover: 'oklch(0.985 0 0)',
    profileForeground: 'oklch(1 0 0)',
    selectedOptionBorder: '#0295f6',
    standby: 'oklch(0.556 0 0)',
  },
  fonts: {
    body: 'var(--font-geist-sans), system-ui, sans-serif',
  },
  radii: {
    actionButton: '0.625rem',
    connectButton: '0.625rem',
    menuButton: '0.625rem',
    modal: '0.875rem',
    modalMobile: '0.875rem',
  },
  shadows: {
    connectButton: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    dialog: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    profileDetailsAction: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    selectedOption: '0 0 0 1px #0295f6',
    selectedWallet: '0 0 0 1px #0295f6',
    walletLogo: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
};


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
              theme={myCustomTheme}
              initialChain={filecoinCalibration.id}
            >
              <main className="flex flex-col min-h-screen">
                {children}
              </main>
            </RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
  );
}
