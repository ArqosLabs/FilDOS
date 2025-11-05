import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { TOKENS, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { DATA_SET_CREATION_FEE, MAX_UINT256 } from "@/utils";
import { config } from "@/config";
import { useSynapse } from "@/providers/SynapseProvider";
import { useAccount } from "./useAccount";

/**
 * Hook to handle payment for storage
 * @param lockup - The lockup amount to be used for the storage
 * @param epochRate - The epoch rate to be used for the storage
 * @param depositAmount - The deposit amount to be used for the storage
 * @notice LockUp is the accoumulated amount of USDFC that the user has locked up for Storing data over time.
 * It is different from the depositAmount. Which is the amount needed to pay for more storage if required.
 * @returns Mutation and status
 */
export const usePayment = () => {
  const [status, setStatus] = useState<string>("");
  const { address } = useAccount();
  const { synapse, warmStorageService } = useSynapse();
  const mutation = useMutation({
    mutationFn: async ({
      lockupAllowance,
      epochRateAllowance,
      depositAmount,
    }: {
      lockupAllowance: bigint;
      epochRateAllowance: bigint;
      depositAmount: bigint;
    }) => {
      if (!address) throw new Error("Address not found");
      if (!synapse) throw new Error("Synapse not found");
      if (!warmStorageService)
        throw new Error("Warm storage service not found");
      setStatus("Preparing transaction...");

      const paymentsAddress = synapse.getPaymentsAddress();

      const dataset = (
        await warmStorageService.getClientDataSetsWithDetails(address)
      ).filter((dataset) => dataset.withCDN === config.withCDN);

      const hasDataset = dataset.length > 0;

      const fee = hasDataset ? BigInt(0) : DATA_SET_CREATION_FEE;

      const amount = depositAmount + fee;

      const allowance = await synapse.payments.allowance(
        paymentsAddress,
        TOKENS.USDFC
      );

      const balance = await synapse.payments.walletBalance(TOKENS.USDFC);

      if (balance < amount) {
        throw new Error("Insufficient USDFC balance");
      }

      if (allowance < MAX_UINT256 / BigInt(2)) {
        setStatus("Approving USDFC to cover storage costs...");
        const transaction = await synapse.payments.approve(
          paymentsAddress,
          MAX_UINT256,
          TOKENS.USDFC
        );
        await transaction.wait();
        setStatus("Successfully approved USDFC to cover storage costs");
      }
      if (amount > BigInt(0)) {
        setStatus("Depositing USDFC to cover storage costs...");
        const transaction = await synapse.payments.deposit(amount);
        await transaction.wait();
        setStatus("Successfully deposited USDFC to cover storage costs");
      }

      setStatus(
        "Approving Filecoin Warm Storage service USDFC spending rates..."
      );
      const transaction = await synapse.payments.approveService(
        synapse.getWarmStorageAddress(),
        epochRateAllowance,
        lockupAllowance + fee,
        TIME_CONSTANTS.EPOCHS_PER_DAY * BigInt(config.persistencePeriod)
      );
      await transaction.wait();
      setStatus(
        "Successfully approved Filecoin Warm Storage spending rates"
      );
    },
    onSuccess: () => {
      setStatus("Payment was successful!");
    },
    onError: (error) => {
      console.error("Payment failed:", error);
      setStatus(
        `❌ ${error.message || "Transaction failed. Please try again."}`
      );
    },
  });
  return { mutation, status };
};

export const useRevokeService = () => {
  const [status, setStatus] = useState<string>("");
  const { synapse } = useSynapse();
  const mutation = useMutation({
    mutationFn: async ({ service }: { service: string }) => {
      if (!synapse) throw new Error("Synapse not ready");
      setStatus("Preparing transaction...");
      const transaction = await synapse.payments.revokeService(
        service,
        TOKENS.USDFC
      );
      await transaction.wait();
      setStatus("Successfully revoked service");
    },
  });
  return { mutation, status };
};
