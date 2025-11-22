"use client";

import { useState, useEffect, useMemo } from "react";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { TransactionButton } from "thirdweb/react";
import { prepareContractCall, getContract, readContract } from "thirdweb";
import { client } from "@/utils/client";
import { filecoinCalibration } from "@/utils/chains";
import { CONTRACT_ADDRESS } from "@/utils/contracts";
import { usePaymentToken } from "@/hooks/useContract";
import { useActiveAccount } from "thirdweb/react";

interface PayAccessDialogProps {
  children: React.ReactNode;
  folderId: string;
  folderName: string;
  viewingPrice: bigint;
  onSuccess?: () => void;
}

const formatPrice = (price: bigint) => {
  // USDFC has 6 decimals
  const priceInUSDFC = Number(price) / 1_000_000;
  return priceInUSDFC.toFixed(2);
};

export default function PayAccessDialog({ 
  children, 
  folderId, 
  folderName,
  viewingPrice,
  onSuccess
}: PayAccessDialogProps) {
  const [open, setOpen] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(true);
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [hasCheckedAllowance, setHasCheckedAllowance] = useState(false);

  const account = useActiveAccount();
  const { data: paymentTokenAddress } = usePaymentToken();

  // Get ThirdWeb contract instance
  const contract = useMemo(() => getContract({
    client,
    address: CONTRACT_ADDRESS,
    chain: filecoinCalibration,
  }), []);

  // Get payment token contract instance - memoized to prevent recreation
  const paymentTokenContract = useMemo(() => {
    if (!paymentTokenAddress) return null;
    return getContract({
      client,
      address: paymentTokenAddress,
      chain: filecoinCalibration,
    });
  }, [paymentTokenAddress]);

  // Check allowance when dialog opens or after approval
  useEffect(() => {
    // Reset check flag when dialog is closed
    if (!open) {
      setHasCheckedAllowance(false);
      setNeedsApproval(true);
      return;
    }

    // Don't check again if we've already checked and are still checking
    if (hasCheckedAllowance || isCheckingAllowance) {
      return;
    }

    const checkAllowance = async () => {
      if (!account?.address || !paymentTokenContract) {
        return;
      }

      setIsCheckingAllowance(true);
      try {
        const allowance = await readContract({
          contract: paymentTokenContract,
          method: "function allowance(address owner, address spender) view returns (uint256)",
          params: [account.address, CONTRACT_ADDRESS],
        });

        setNeedsApproval(allowance < viewingPrice);
        setHasCheckedAllowance(true);
      } catch (error) {
        console.error("Error checking allowance:", error);
        setNeedsApproval(true);
      } finally {
        setIsCheckingAllowance(false);
      }
    };

    checkAllowance();
  }, [open, account?.address, paymentTokenContract, viewingPrice, hasCheckedAllowance, isCheckingAllowance]);

  const handleApprovalSuccess = () => {
    // Reset check flag to allow recheck after approval
    setHasCheckedAllowance(false);
    setNeedsApproval(false);
  };

  const handlePaymentSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Lock className="w-5 h-5 text-primary" />
            Pay for Access
          </DialogTitle>
          <DialogDescription className="text-sm">
            Purchase access to {folderName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Price Info - Compact */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
            <span className="text-sm font-medium text-foreground">Access Price</span>
            <span className="text-lg font-semibold text-primary">
              {formatPrice(viewingPrice)} USDFC
            </span>
          </div>

          {/* Payment Steps - Compact */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
            <div className={`flex items-center gap-1.5 ${needsApproval && !isCheckingAllowance ? "text-primary font-medium" : needsApproval ? "" : "text-green-600"}`}>
              {!needsApproval ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full ${needsApproval && !isCheckingAllowance ? "bg-primary" : "bg-muted"}`} />
              )}
              <span>Approve</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center gap-1.5 ${!needsApproval && !isCheckingAllowance ? "text-primary font-medium" : ""}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${!needsApproval && !isCheckingAllowance ? "bg-primary" : "bg-muted"}`} />
              <span>Payment</span>
            </div>
          </div>

          {/* Step 1: Approval Widget */}
          {account && paymentTokenContract && needsApproval && !isCheckingAllowance && (
            <div className="space-y-2 mx-auto flex">
              <TransactionButton
                transaction={() => prepareContractCall({
                  contract: paymentTokenContract,
                  method: "function approve(address spender, uint256 amount) returns (bool)",
                  params: [CONTRACT_ADDRESS, viewingPrice],
                })}
                theme="light"
                onTransactionConfirmed={handleApprovalSuccess}
                >
                Approve Token Spending
              </TransactionButton>
            </div>
          )}

          {/* Step 2: Payment Widget */}
          {account && !needsApproval && !isCheckingAllowance && (
            <div className="space-y-2 mx-auto flex">
              <TransactionButton
                transaction={() => prepareContractCall({
                  contract,
                  method: "function payForViewAccess(uint256 tokenId)",
                  params: [BigInt(folderId)],
                })}
                theme="light"
                onTransactionConfirmed={handlePaymentSuccess}
              >
                Complete Payment ({formatPrice(viewingPrice)} USDFC)
              </TransactionButton>
            </div>
          )}

          {/* Checking allowance */}
          {isCheckingAllowance && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Checking allowance...</span>
            </div>
          )}

          {/* No wallet connected */}
          {!account && (
            <Alert className="border-yellow-200 bg-yellow-50 py-3">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <div className="ml-2 text-sm text-yellow-800">
                Connect your wallet to proceed
              </div>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
