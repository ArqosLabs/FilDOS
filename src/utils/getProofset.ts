import { CONTRACT_ADDRESSES, PandoraService } from "@filoz/synapse-sdk";
import { JsonRpcSigner } from "ethers";
import { config } from "@/config";

// Pick the provider that has the most used storage
// in a proofset with the client
export const getProofset = async (
  signer: JsonRpcSigner,
  network: "mainnet" | "calibration",
  address: string
) => {
  const pandoraService = new PandoraService(
    signer.provider,
    CONTRACT_ADDRESSES.PANDORA_SERVICE[network]
  );
  let providerId;
  let bestProofset;
  const AllproofSets =
    await pandoraService.getClientProofSetsWithDetails(address);

  const proofSetsWithCDN = AllproofSets.filter((proofSet) => proofSet.withCDN);

  const proofSetsWithoutCDN = AllproofSets.filter(
    (proofSet) => !proofSet.withCDN
  );

  const proofSets = config.withCDN ? proofSetsWithCDN : proofSetsWithoutCDN;

  try {
    bestProofset = proofSets.reduce((max, proofSet) => {
      return proofSet.currentRootCount > max.currentRootCount ? proofSet : max;
    }, proofSets[0]);
    if (bestProofset) {
      providerId = await pandoraService.getProviderIdByAddress(
        bestProofset.payee
      );
    }
  } catch (error) {
    console.error("Error getting providerId", error);
  }
  return { providerId, proofset: bestProofset };
};
