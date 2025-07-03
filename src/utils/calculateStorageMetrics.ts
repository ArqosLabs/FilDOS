import {
  PandoraService,
  Synapse,
  TIME_CONSTANTS,
  SIZE_CONSTANTS,
} from "@filoz/synapse-sdk";
import { PandoraBalanceData, StorageCalculationResult } from "@/types";
import { config } from "@/config";

/**
 * Constants for storage pricing and calculations
 */
const STORAGE_CONSTANTS = {
  /** Price per TB per month in wei (2 USDFC) */
  PRICE_PER_TB_PER_MONTH: BigInt(2) * BigInt(10) ** BigInt(18),
  /** Price per TB per month in wei (3 USDFC) */
  PRICE_PER_TB_PER_MONTH_CDN: BigInt(3) * BigInt(10) ** BigInt(18),
} as const;

/**
 * Calculates storage metrics for Pandora service based on balance data
 * @param synapse - The Synapse instance
 * @param persistencePeriodDays - The desired persistence period in days
 * @param storageCapacity - The storage capacity in bytes
 * @param minDaysThreshold - Minimum days threshold for lockup sufficiency
 * @returns StorageCalculationResult containing all calculated metrics
 */
export const calculateStorageMetrics = async (
  synapse: Synapse,
  persistencePeriodDays: number = config.persistencePeriod,
  storageCapacity: number = config.storageCapacity * Number(SIZE_CONSTANTS.GiB),
  minDaysThreshold: bigint = BigInt(config.minDaysThreshold)
): Promise<StorageCalculationResult> => {
  // Initialize Pandora service and fetch balance data
  const pandoraService = new PandoraService(
    synapse.getProvider(),
    synapse.getPandoraAddress()
  );
  const pandoraBalance = await pandoraService.checkAllowanceForStorage(
    storageCapacity,
    config.withCDN,
    synapse.payments,
    persistencePeriodDays
  );

  // Calculate rate-related metrics
  const rateNeeded = pandoraBalance.costs.perEpoch;

  // Calculate daily lockup requirements
  const lockupPerDay = TIME_CONSTANTS.EPOCHS_PER_DAY * rateNeeded;
  const lockupPerDayAtCurrentRate =
    TIME_CONSTANTS.EPOCHS_PER_DAY * pandoraBalance.currentRateUsed;

  // Calculate remaining lockup and persistence days
  const currentLockupRemaining =
    pandoraBalance.currentLockupAllowance - pandoraBalance.currentLockupUsed;
  const persistenceDaysLeft =
    Number(currentLockupRemaining) / Number(lockupPerDay);
  const persistenceDaysLeftAtCurrentRate =
    lockupPerDayAtCurrentRate > BigInt(0)
      ? Number(currentLockupRemaining) / Number(lockupPerDayAtCurrentRate)
      : currentLockupRemaining > BigInt(0)
        ? Infinity
        : 0;

  // Calculate current storage usage
  const { currentStorageBytes, currentStorageGB } =
    calculateCurrentStorageUsage(pandoraBalance, storageCapacity);

  // Determine sufficiency of allowances
  const isRateSufficient = pandoraBalance.currentRateAllowance >= rateNeeded;
  const isLockupSufficient = persistenceDaysLeft >= minDaysThreshold;
  const isSufficient = isRateSufficient && isLockupSufficient;

  const currentRateAllowanceGB = calculateRateAllowanceGB(
    pandoraBalance.currentRateAllowance
  );
  const depositNeeded = pandoraBalance.depositAmountNeeded;

  return {
    rateNeeded,
    rateUsed: pandoraBalance.currentRateUsed,
    currentStorageBytes,
    currentStorageGB,
    totalLockupNeeded: pandoraBalance.lockupAllowanceNeeded,
    depositNeeded,
    persistenceDaysLeft,
    persistenceDaysLeftAtCurrentRate,
    isRateSufficient,
    isLockupSufficient,
    isSufficient,
    currentRateAllowanceGB,
    currentLockupAllowance: pandoraBalance.currentLockupAllowance,
  };
};

const getPricePerTBPerMonth = (): bigint => {
  return config.withCDN
    ? STORAGE_CONSTANTS.PRICE_PER_TB_PER_MONTH_CDN
    : STORAGE_CONSTANTS.PRICE_PER_TB_PER_MONTH;
};

/**
 * Calculates the storage capacity in GB that can be supported by a given rate allowance
 */
const calculateRateAllowanceGB = (rateAllowance: bigint): number => {
  const monthlyRate = rateAllowance * BigInt(TIME_CONSTANTS.EPOCHS_PER_MONTH);
  const bytesThatCanBeStored =
    (monthlyRate * SIZE_CONSTANTS.TiB) / getPricePerTBPerMonth();
  return Number(bytesThatCanBeStored) / Number(SIZE_CONSTANTS.GiB);
};

/**
 * Calculates current storage usage based on rate usage
 */
const calculateCurrentStorageUsage = (
  pandoraBalance: PandoraBalanceData,
  storageCapacity: number
): { currentStorageBytes: bigint; currentStorageGB: number } => {
  let currentStorageBytes = BigInt(0);
  let currentStorageGB = 0;

  if (
    pandoraBalance.currentRateUsed > BigInt(0) &&
    pandoraBalance.rateAllowanceNeeded > BigInt(0)
  ) {
    try {
      currentStorageBytes =
        (pandoraBalance.currentRateUsed * BigInt(storageCapacity)) /
        pandoraBalance.rateAllowanceNeeded;
      currentStorageGB =
        Number(currentStorageBytes) / Number(SIZE_CONSTANTS.GiB);
    } catch (error) {
      console.warn("Failed to calculate current storage usage:", error);
    }
  }

  return { currentStorageBytes, currentStorageGB };
};
