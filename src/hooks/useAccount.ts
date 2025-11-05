import { useActiveWallet, useActiveAccount } from "thirdweb/react";

export const useAccount = () => {
  const wallet = useActiveWallet();
  const account = useActiveAccount();

  const chainId = wallet?.getChain()?.id;
  const address = account?.address;
  const isConnected = !!account;

  return {
    address,
    chainId,
    isConnected,
    wallet,
    account,
  };
};
