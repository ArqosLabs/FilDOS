import { useMemo } from "react";
import { useActiveWallet, useActiveAccount } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { client } from "@/utils/client";

/** Hook to get an ethers.js Signer from ThirdWeb wallet. */
export const useEthersSigner = () => {
  const wallet = useActiveWallet();
  const account = useActiveAccount();

  return useMemo(() => {
    if (!wallet || !account) return undefined;

    try {
      const chain = wallet.getChain();
      if (!chain) return undefined;

      // Validate chain ID - only allow Filecoin chains
      if (chain.id !== 314 && chain.id !== 314159) {
        console.warn(`Unsupported chain ID: ${chain.id}. Only Filecoin Calibration (314159) and Mainnet (314) are supported.`);
        return undefined;
      }

      // Convert ThirdWeb wallet to ethers signer
      const signer = ethers6Adapter.signer.toEthers({
        client,
        chain,
        account,
      });

      return signer;
    } catch (error) {
      console.error("Failed to create ethers signer:", error);
      return undefined;
    }
  }, [wallet, account]);
};

/** Hook to get an ethers.js Provider from ThirdWeb wallet. */
export const useEthersProvider = () => {
  const wallet = useActiveWallet();

  return useMemo(() => {
    if (!wallet) return undefined;

    try {
      const chain = wallet.getChain();
      if (!chain) return undefined;

      // Validate chain ID - only allow Filecoin chains
      if (chain.id !== 314 && chain.id !== 314159) {
        console.warn(`Unsupported chain ID: ${chain.id}. Only Filecoin Calibration (314159) and Mainnet (314) are supported.`);
        return undefined;
      }

      // Convert ThirdWeb wallet to ethers provider
      const provider = ethers6Adapter.provider.toEthers({
        client,
        chain,
      });

      return provider;
    } catch (error) {
      console.error("Failed to create ethers provider:", error);
      return undefined;
    }
  }, [wallet]);
};
