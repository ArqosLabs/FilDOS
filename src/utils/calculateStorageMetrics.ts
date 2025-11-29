import {
  Synapse,
  TIME_CONSTANTS,
  SIZE_CONSTANTS,
  TOKENS,
  WarmStorageService,
} from "@filoz/synapse-sdk";

import { MAX_UINT256, CDN_DATA_SET_CREATION_COST } from "@/utils/constants";
import { StorageCosts } from "@/types";

/**
 * Fetches the current storage costs from the WarmStorage service.
 * @param synapse - The Synapse instance
 * @returns The storage costs object
 */
export const fetchWarmStorageCosts = async (
  synapse: Synapse
): Promise<StorageCosts> => {
  const warmStorageService = await WarmStorageService.create(
    synapse.getProvider(),
    synapse.getWarmStorageAddress()
  );
  const servicePrice = await warmStorageService.getServicePrice();
  return {
    pricePerTiBPerMonthNoCDN: servicePrice.pricePerTiBPerMonthNoCDN,
    pricePerTiBPerMonthWithCDN: servicePrice.pricePerTiBPerMonthNoCDN + CDN_DATA_SET_CREATION_COST,
  };
};
export const calculateStorageMetrics = async (
  synapse: Synapse,
  config: {
    storageCapacity: number;
    persistencePeriod: number;
    minDaysThreshold: number;
  },
  fileSize?: number
) => {

  const bytesToStore = fileSize
    ? fileSize
    : Number((BigInt(config.storageCapacity)
      * SIZE_CONSTANTS.GiB))

  const warmStorageService = await WarmStorageService.create(synapse.getProvider(), synapse.getWarmStorageAddress());

  // Fetch approval info, storage costs, and balance in parallel
  const [allowance, accountInfo, prices] = await Promise.all([
    synapse.payments.serviceApproval(synapse.getWarmStorageAddress()),
    synapse.payments.accountInfo(TOKENS.USDFC),
    warmStorageService.calculateStorageCost(bytesToStore)
  ]);

  const availableFunds = accountInfo.availableFunds;

  const currentMonthlyRate = allowance.rateUsed * TIME_CONSTANTS.EPOCHS_PER_MONTH;

  const currentDailyRate = allowance.rateUsed * TIME_CONSTANTS.EPOCHS_PER_DAY;

  const maxMonthlyRate = prices.perMonth

  const daysLeft = Number(availableFunds) / Number(prices.perDay);

  const daysLeftAtCurrentRate = currentDailyRate === BigInt(0) ? Infinity : Number(availableFunds) / Number(currentDailyRate);

  const amountNeeded = prices.perDay * BigInt(config.persistencePeriod);

  // Add CDN dataset creation cost to the deposit if needed
  const totalAmountNeeded = amountNeeded + CDN_DATA_SET_CREATION_COST;

  const totalDepositNeeded =
    daysLeft >= config.minDaysThreshold
      ? BigInt(0)
      : totalAmountNeeded - accountInfo.availableFunds;

  const availableToFreeUp =
    accountInfo.availableFunds > totalAmountNeeded
      ? accountInfo.availableFunds - totalAmountNeeded
      : BigInt(0);

  const isRateSufficient = allowance.rateAllowance >= MAX_UINT256 / BigInt(2)

  const isLockupSufficient = allowance.lockupAllowance >= MAX_UINT256 / BigInt(2);

  const isSufficient = isRateSufficient && isLockupSufficient && daysLeft >= config.minDaysThreshold;

  return {
    rateNeeded: MAX_UINT256,
    depositNeeded: totalDepositNeeded,
    availableToFreeUp: availableToFreeUp,
    lockupNeeded: MAX_UINT256,
    daysLeft,
    daysLeftAtCurrentRate,
    isRateSufficient,
    isLockupSufficient,
    isSufficient: isSufficient,
    totalConfiguredCapacity: config.storageCapacity,
    currentMonthlyRate,
    maxMonthlyRate,
  };
};