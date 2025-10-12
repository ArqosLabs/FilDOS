"use client";

import {
  RPC_URLS,
  Synapse,
  WarmStorageService,
} from "@filoz/synapse-sdk";
import { createContext, useState, useEffect, useContext, useRef } from "react";
import { useEthersSigner } from "@/hooks/useEthers";
import { config } from "@/config";
import { useAccount } from "wagmi";

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
  const signer = useEthersSigner();
  const { chainId } = useAccount();
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
      if (!signer) {
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

      if (synapseRef.current) {
        await destroyProvider(synapseRef.current.getProvider());
      }

      // Determine the correct RPC URL based on the current chain
      const rpcURL = chainId === 314 
        ? RPC_URLS.mainnet.websocket 
        : RPC_URLS.calibration.websocket;

      const synapse = await Synapse.create({
        signer,
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
  }, [signer, chainId]);

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