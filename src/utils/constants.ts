import { CONTRACT_ADDRESSES } from "@filoz/synapse-sdk";

export const getPandoraAddress = (network: "mainnet" | "calibration") => {
  return CONTRACT_ADDRESSES.PANDORA_SERVICE[network];
};

export const MAX_UINT256 = 2n ** 256n - 1n;

export const PROOF_SET_CREATION_FEE = BigInt(0.1 * 10 ** 18);
