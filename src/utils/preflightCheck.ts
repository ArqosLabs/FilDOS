import { checkAllowances } from "./warmStorageUtils";
import { config } from "@/config";
import { Synapse, TIME_CONSTANTS } from "@filoz/synapse-sdk";
import { WarmStorageService } from "@filoz/synapse-sdk/warm-storage";
import { ethers } from "ethers";

/**
 * Performs a preflight check before file upload to ensure sufficient USDFC balance and allowances
 * for storage costs. This function:
 * 1. Verifies signer and provider availability
 * 2. Checks if there's enough USDFC allowance for the file size
 * 3. If insufficient, handles the deposit and approval process
 *
 * @param file - The file to be uploaded
 * @param synapse - Synapse SDK instance
 * @param network - Network to use (mainnet or calibration)
 * @param includeDataSetCreationFee - Whether to include data set creation fee
 * @param updateStatus - Callback to update status messages
 * @param updateProgress - Callback to update progress percentage
 */
export const preflightCheck = async (
  file: File,
  synapse: Synapse,
  includeDataSetCreationFee: boolean,
  updateStatus: (status: string) => void,
  updateProgress: (progress: number) => void
) => {
  // Verify signer and provider are available
  // Initialize Pandora service for allowance checks
  const warmStorageService = await WarmStorageService.create(
    synapse.getProvider(),
    synapse.getWarmStorageAddress()
  );

  // Step 1: Check if current allowance is sufficient for the file size
  const warmStorageBalance = await warmStorageService.checkAllowanceForStorage(
    file.size,
    config.withCDN,
    synapse.payments,
    config.persistencePeriod
  );

  // Step 2: Check if allowances and balances are sufficient for storage and data set creation
  const {
    isSufficient,
    rateAllowanceNeeded,
    lockupAllowanceNeeded,
    depositAmountNeeded,
  } = await checkAllowances(
    warmStorageBalance,
    config.minDaysThreshold,
    includeDataSetCreationFee
  );

  // If allowance is insufficient, handle deposit and approval process
  if (!isSufficient) {
    updateStatus("💰 Insufficient USDFC allowance...");

    // Step 3: Deposit USDFC to cover storage costs
    updateStatus("💰 Depositing USDFC to cover storage costs...");
    const depositTx = await synapse.payments.deposit(
      depositAmountNeeded,
      "USDFC",
      {
        onDepositStarting: () => updateStatus("💰 Depositing USDFC..."),
        onAllowanceCheck: (current: bigint, required: bigint) =>
          updateStatus(
            `💰 Allowance check ${
              current > required ? "sufficient" : "insufficient"
            }`
          ),
        onApprovalTransaction: async (tx: ethers.TransactionResponse) => {
          updateStatus(`💰 Approving USDFC... ${tx.hash}`);
          const receipt = await tx.wait();
          updateStatus(`💰 USDFC approved ${receipt?.hash}`);
        },
      }
    );
    await depositTx.wait();
    updateStatus("💰 USDFC deposited successfully");
    updateProgress(10);

    // Step 4: Approve Filecoin Warm Storage service to spend USDFC at specified rates
    updateStatus(
      "💰 Approving Filecoin Warm Storage service USDFC spending rates..."
    );
    const approvalTx = await synapse.payments.approveService(
      synapse.getWarmStorageAddress(),
      rateAllowanceNeeded,
      lockupAllowanceNeeded,
      TIME_CONSTANTS.EPOCHS_PER_DAY * BigInt(config.persistencePeriod)
    );
    await approvalTx.wait();
    updateStatus("💰 Filecoin Warm Storage service approved to spend USDFC");
    updateProgress(20);
  }
};