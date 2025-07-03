import { getPandoraAddress } from "@/utils";
import { Synapse } from "@filoz/synapse-sdk";
import { PandoraService, CONTRACT_ADDRESSES } from "@filoz/synapse-sdk";
import { PROOF_SET_CREATION_FEE } from "@/utils";
import { config } from "@/config";

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
 * @param withProofset - Whether to include proofset creation fee
 * @param setStatus - Callback to update status messages
 * @param setProgress - Callback to update progress percentage
 */
export const preflightCheck = async (
  file: File,
  synapse: Synapse,
  network: "mainnet" | "calibration",
  withProofset: boolean,
  setStatus: (status: string) => void,
  setProgress: (progress: number) => void
) => {
  // Verify signer and provider are available
  const signer = synapse.getSigner();
  if (!signer) throw new Error("Signer not found");
  if (!signer.provider) throw new Error("Provider not found");

  // Initialize Pandora service for allowance checks
  const pandoraService = new PandoraService(
    signer.provider,
    CONTRACT_ADDRESSES.PANDORA_SERVICE[network]
  );

  // Check if current allowance is sufficient for the file size
  const preflight = await pandoraService.checkAllowanceForStorage(
    file.size,
    config.withCDN,
    synapse.payments
  );

  // If allowance is insufficient, handle deposit and approval process
  if (!preflight.sufficient) {
    setStatus("💰 Insufficient USDFC allowance...");

    // Calculate total allowance needed including proofset creation fee if required
    const proofSetCreationFee = withProofset
      ? PROOF_SET_CREATION_FEE
      : BigInt(0);

    const allowanceNeeded =
      preflight.lockupAllowanceNeeded + proofSetCreationFee;

    // Step 1: Deposit USDFC to cover storage costs
    setStatus("💰 Approving & depositing USDFC to cover storage costs...");
    await synapse.payments.deposit(allowanceNeeded);
    setStatus("💰 USDFC deposited successfully");
    setProgress(10);

    // Step 2: Approve Pandora service to spend USDFC at specified rates
    setStatus("💰 Approving Pandora service USDFC spending rates...");
    await synapse.payments.approveService(
      getPandoraAddress(network),
      preflight.rateAllowanceNeeded,
      allowanceNeeded
    );
    setStatus("💰 Pandora service approved to spend USDFC");
    setProgress(20);
  }
};
