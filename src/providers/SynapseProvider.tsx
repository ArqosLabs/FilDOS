"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { config } from "@/config";

interface SynapseContextValue {
  getSynapse: () => Promise<Synapse>;
}

const SynapseContext = createContext<SynapseContextValue | undefined>(
  undefined
);

export const SynapseProvider = ({ children }: { children: ReactNode }) => {
  const signer = useEthersSigner();

  const getSynapse = async (): Promise<Synapse> => {
    const synapse = await Synapse.create({
      signer: signer ?? undefined,
      withCDN: config.withCDN,
    });
    return synapse;
  };

  return (
    <SynapseContext.Provider value={{ getSynapse }}>
      {children}
    </SynapseContext.Provider>
  );
};

export const useSynapse = () => {
  const context = useContext(SynapseContext);
  if (context === undefined) {
    throw new Error("useSynapse must be used within a SynapseProvider");
  }
  return context;
};
