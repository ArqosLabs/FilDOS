import { useMemo } from "react";
import { useActiveWallet, useActiveAccount } from "thirdweb/react";
import { ethers6Adapter } from "thirdweb/adapters/ethers6";
import { client } from "@/utils/client";
import { TypedDataDomain, TypedDataField } from "ethers";

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

      // Check if this is an in-app/enclave wallet
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const walletId = (wallet as any).id || '';
      const isEnclaveWallet = walletId === 'inApp' || walletId.includes('embedded');
      
      if (isEnclaveWallet) {
        console.warn('⚠️ In-App Wallet detected. There may be issues with EIP-712 signing.');
        console.warn('👉 If you encounter signing errors, please use MetaMask, Coinbase Wallet, or Rainbow Wallet.');
      }

      // Convert ThirdWeb wallet to ethers signer
      const baseSigner = ethers6Adapter.signer.toEthers({
        client,
        chain,
        account,
      });

      // Wrap the signer to provide better error messages for enclave wallets
      if (baseSigner && typeof baseSigner.signTypedData === 'function') {
        const originalSignTypedData = baseSigner.signTypedData.bind(baseSigner);
        
        // Create a proxy to intercept _signTypedData calls
        const signerProxy = new Proxy(baseSigner, {
          get(target, prop) {
            if (prop === '_signTypedData') {
              return async (domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, unknown>) => {
                try {
                  // Try the internal method first
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  if (typeof (target as any)._signTypedData === 'function') {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return await (target as any)._signTypedData(domain, types, value);
                  }
                  
                  // Use the public signTypedData method
                  const result = await originalSignTypedData(domain, types, value);
                  return result;
                } catch (error) {
                  console.error('Error in _signTypedData:', error);
                  
                  // Provide helpful error message for enclave wallet users
                  if (isEnclaveWallet) {
                    throw new Error(
                      'In-App Wallet does not support file uploads due to a signing issue. ' +
                      'Please disconnect and use MetaMask, Coinbase Wallet, or Rainbow Wallet instead.'
                    );
                  }
                  
                  throw error;
                }
              };
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (target as any)[prop];
          }
        });
        
        return signerProxy as typeof baseSigner;
      }

      return baseSigner;
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
