import { CONTRACT_ADDRESSES } from "@filoz/synapse-sdk";

export const getWarmStorageAddress = (network: "mainnet" | "calibration") => {
  return CONTRACT_ADDRESSES.WARM_STORAGE[network];
};

export const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1);

export const DATA_SET_CREATION_FEE = BigInt(1 * 10 ** 18); // 1 USDFC
