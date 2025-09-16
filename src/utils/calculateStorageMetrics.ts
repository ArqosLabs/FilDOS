import { Synapse, TIME_CONSTANTS, SIZE_CONSTANTS } from "@filoz/synapse-sdk";
import { config } from "@/config";
import { StorageCalculationResult } from "@/types";
import { calculateRateAllowanceGB } from "./storageCostUtils";
import {
  calculateCurrentStorageUsage,
  fetchWarmStorageCosts,
  fetchWarmStorageBalanceData,
} from "./warmStorageUtils";

/**
 * Calculates storage metrics for WarmStorage service based on balance data and user config.
 * Fetches costs and balances, then computes all relevant metrics for storage and allowance sufficiency.
 *
 * @param synapse - The Synapse instance
 * @param persistencePeriodDays - The desired persistence period in days
 * @param storageCapacityBytes - The storage capacity in bytes
 * @param minDaysThreshold - Minimum days threshold for lockup sufficiency
 * @returns StorageCalculationResult containing all calculated metrics
 */
export const calculateStorageMetrics = async (
  synapse: Synapse,
  persistencePeriodDays: number = config.persistencePeriod,
  storageCapacityBytes: number = config.storageCapacity *
    Number(SIZE_CONSTANTS.GiB),
  minDaysThreshold: number = config.minDaysThreshold
): Promise<StorageCalculationResult> => {
  // Fetch storage costs and balance data from WarmStorage service
  const storageCosts = await fetchWarmStorageCosts(synapse);
  const warmStorageBalance = await fetchWarmStorageBalanceData(
    synapse,
    storageCapacityBytes,
    persistencePeriodDays
  );

  // Calculate the rate needed per epoch for the requested storage
  const rateNeeded = warmStorageBalance.costs.perEpoch;

  // Calculate daily lockup requirements at requested and current rates
  const lockupPerDay = TIME_CONSTANTS.EPOCHS_PER_DAY * rateNeeded;
  const lockupPerDayAtCurrentRate =
    TIME_CONSTANTS.EPOCHS_PER_DAY * warmStorageBalance.currentRateUsed;

  // Calculate remaining lockup and persistence days
  const currentLockupRemaining =
    warmStorageBalance.currentLockupAllowance -
    warmStorageBalance.currentLockupUsed;
  // How many days of storage remain at requested rate
  const persistenceDaysLeft =
    Number(currentLockupRemaining) / Number(lockupPerDay);
  // How many days of storage remain at current rate usage
  const persistenceDaysLeftAtCurrentRate =
    lockupPerDayAtCurrentRate > BigInt(0)
      ? Number(currentLockupRemaining) / Number(lockupPerDayAtCurrentRate)
      : currentLockupRemaining > BigInt(0)
      ? Infinity
      : 0;

  // Calculate current storage usage (in bytes and GB)
  const { currentStorageBytes, currentStorageGB } =
    calculateCurrentStorageUsage(warmStorageBalance, storageCapacityBytes);

  // Determine sufficiency of allowances
  const isRateSufficient =
    warmStorageBalance.currentRateAllowance >= rateNeeded;
  // Lockup is sufficient if enough days remain
  const isLockupSufficient = persistenceDaysLeft >= minDaysThreshold;
  // Both must be sufficient
  const isSufficient = isRateSufficient && isLockupSufficient;

  // Calculate how much storage (in GB) the current rate allowance supports
  const currentRateAllowanceGB = calculateRateAllowanceGB(
    warmStorageBalance.currentRateAllowance,
    storageCosts
  );

  const depositNeeded = warmStorageBalance.depositAmountNeeded;
  const rateUsed = warmStorageBalance.currentRateUsed;
  const totalLockupNeeded = warmStorageBalance.lockupAllowanceNeeded;
  const currentLockupAllowance = warmStorageBalance.currentLockupAllowance;
  return {
    rateNeeded, // rate needed per epoch for requested storage
    rateUsed: rateUsed, // rate currently used
    currentStorageBytes, // current storage used in bytes
    currentStorageGB, // current storage used in GB
    totalLockupNeeded, // total lockup needed
    depositNeeded, // deposit needed for storage
    persistenceDaysLeft, // days of storage left at requested rate
    persistenceDaysLeftAtCurrentRate, // days of storage left at current rate
    isRateSufficient, // is the rate allowance sufficient?
    isLockupSufficient, // is the lockup allowance sufficient?
    isSufficient, // are both sufficient?
    currentRateAllowanceGB, // how much storage (GB) current rate allowance supports
    currentLockupAllowance, // current lockup allowance
  };
};