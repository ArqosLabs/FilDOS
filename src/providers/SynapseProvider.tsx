"use client";

import { RPC_URLS, Synapse, WarmStorageService } from "@filoz/synapse-sdk";
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { config } from "@/config";
import { useEthersSigner } from "@/hooks/useEthers";
import { useAccount } from "@/hooks/useAccount";

export const SynapseContext = createContext<{
  synapse: Synapse | null;
  warmStorageService: WarmStorageService | null;
}>({ synapse: null, warmStorageService: null });

export const SynapseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [synapse, setSynapse] = useState<Synapse | null>(null);
  const [warmStorageService, setWarmStorageService] =
    useState<WarmStorageService | null>(null);

  const { isConnected, chainId } = useAccount();
  const ethersSigner = useEthersSigner();
  const synapseRef = useRef<Synapse | null>(null);

  const destroyProvider = async (maybeProvider: unknown) => {
    try {
      const provider = maybeProvider as { destroy?: () => Promise<void> | void } | null | undefined;
      if (provider && typeof provider.destroy === "function") {
        await provider.destroy();
      }
    } catch (err) {
      console.warn("SynapseProvider: failed to destroy provider", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Check if wallet is connected and signer is available
      if (!isConnected || !ethersSigner) {
        if (synapseRef.current) {
          await destroyProvider(synapseRef.current.getProvider());
        }
        if (!cancelled) {
          synapseRef.current = null;
          setSynapse(null);
          setWarmStorageService(null);
        }
        return;
      }

      // Validate chain ID
      if (chainId !== 314 && chainId !== 314159) {
        console.error(`Invalid chain ID: ${chainId}. Please connect to Filecoin Calibration (314159) or Mainnet (314).`);
        if (!cancelled) {
          synapseRef.current = null;
          setSynapse(null);
          setWarmStorageService(null);
        }
        return;
      }

      try {
        if (synapseRef.current) {
          await destroyProvider(synapseRef.current.getProvider());
        }

        // Determine the correct RPC URL based on the current chain
        const rpcURL = chainId === 314
            ? RPC_URLS.mainnet.websocket
            : RPC_URLS.calibration.websocket;

        const synapse = await Synapse.create({
          signer: ethersSigner,
          withCDN: config.withCDN,
          disableNonceManager: false,
          rpcURL,
        });

        const wss = await WarmStorageService.create(
          synapse.getProvider(),
          synapse.getWarmStorageAddress()
        );

        if (!cancelled) {
          synapseRef.current = synapse;
          setSynapse(synapse);
          setWarmStorageService(wss);
        } else {
          await destroyProvider(synapse.getProvider());
        }
      } catch (error) {
        console.error("SynapseProvider: Failed to initialize", error);
        if (!cancelled) {
          synapseRef.current = null;
          setSynapse(null);
          setWarmStorageService(null);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      (async () => {
        if (synapseRef.current) {
          await destroyProvider(synapseRef.current.getProvider());
        }
        synapseRef.current = null;
      })();
    };
  }, [isConnected, ethersSigner, chainId]);

  return (
    <SynapseContext.Provider value={{ synapse, warmStorageService }}>
      {children}
    </SynapseContext.Provider>
  );
};

export const useSynapse = () => {
  const { synapse, warmStorageService } = useContext(SynapseContext);
  return { synapse, warmStorageService };
};