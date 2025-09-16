import { SIZE_CONSTANTS, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { config } from "@/config";
import { StorageCosts } from "@/types";

/**
 * Returns the price per TiB per month, depending on CDN usage.
 * @param storageCosts - The storage cost object from WarmStorage service
 * @returns The price per TiB per month as a bigint
 */
export const getPricePerTBPerMonth = (storageCosts: StorageCosts): bigint => {
  return config.withCDN
    ? storageCosts.pricePerTiBPerMonthWithCDN
    : storageCosts.pricePerTiBPerMonthNoCDN;
};

/**
 * Calculates the storage capacity in GB that can be supported by a given rate allowance.
 * @param rateAllowance - The current rate allowance (bigint)
 * @param storageCosts - The storage cost object from WarmStorage service
 * @returns The number of GB that can be supported by the rate allowance
 */
export const calculateRateAllowanceGB = (
  rateAllowance: bigint,
  storageCosts: StorageCosts
): number => {
  // Calculate the total monthly rate allowance
  const monthlyRate = rateAllowance * BigInt(TIME_CONSTANTS.EPOCHS_PER_MONTH);
  // Calculate how many bytes can be stored for that rate
  const bytesThatCanBeStored =
    (monthlyRate * SIZE_CONSTANTS.TiB) / getPricePerTBPerMonth(storageCosts);
  // Convert bytes to GB
  return Number(bytesThatCanBeStored) / Number(SIZE_CONSTANTS.GiB);
};