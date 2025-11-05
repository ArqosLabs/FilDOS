import { useQuery } from "@tanstack/react-query";
import { useActiveWallet } from "thirdweb/react";

const getNetwork = async (chainId: number) => {
  const network =
    chainId === 314159 ? "calibration" : chainId === 314 ? "mainnet" : null;
  return network;
};

export const useNetwork = () => {
  const wallet = useActiveWallet();
  const chainId = wallet?.getChain()?.id;
  
  return useQuery({
    queryKey: ["network", chainId],
    queryFn: () => {
      if (!chainId) throw new Error("Chain ID not found");
      const network = getNetwork(chainId);
      if (!network) throw new Error("Unsupported network");
      return network;
    },
    enabled: !!chainId,
  });
};
