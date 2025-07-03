import { useMutation } from "@tanstack/react-query";
import { Synapse } from "@filoz/synapse-sdk";
import { useEthersSigner } from "@/hooks/useEthers";
import { useAccount } from "wagmi";
import { useNetwork } from "@/hooks/useNetwork";
import { getProofset } from "@/utils/getProofset";
import { config } from "@/config";

/**
 * Hook to download a root from the Filecoin network using Synapse.
 */
export const useDownloadRoot = (commp: string, filename: string) => {
  const signer = useEthersSigner();
  const { address, chainId } = useAccount();
  const { data: network } = useNetwork();
  const mutation = useMutation({
    mutationKey: ["download-root", address, commp, filename],
    mutationFn: async () => {
      if (!signer) throw new Error("Signer not found");
      if (!address) throw new Error("Address not found");
      if (!chainId) throw new Error("Chain ID not found");
      if (!network) throw new Error("Network not found");

      // 1) Create Synapse instance
      const synapse = await Synapse.create({
        provider: signer.provider,
        withCDN: config.withCDN,
      });

      // 2) Get proofset
      const { providerId } = await getProofset(signer, network, address);

      // 3) Create storage service
      const storageService = await synapse.createStorage({
        providerId,
      });

      // 4) Download file
      const uint8ArrayBytes = await storageService.download(commp);

      const file = new File([uint8ArrayBytes], filename);

      // Download file to browser
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      return file;
    },
  });

  return {
    downloadMutation: mutation,
  };
};
