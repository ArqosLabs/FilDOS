"use client";

import { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { usePayForViewAccess, usePaymentToken, useContractAddress } from "@/hooks/useContract";
import { useAccount } from "wagmi";
import { ethers } from "ethers";

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
  const [isApproving, setIsApproving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string>("");

  const { address } = useAccount();
  const payForViewAccess = usePayForViewAccess();
  const { data: paymentTokenAddress } = usePaymentToken();
  const contractAddress = useContractAddress();

  const handlePayment = async () => {
    if (!address || !paymentTokenAddress || !contractAddress) {
      setError("Wallet not connected or contract not initialized");
      return;
    }

    setError("");
    
    try {
      // Step 1: Approve the payment token
      setIsApproving(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get the contract ABI (minimal for approval)
      const tokenAbi = [
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function allowance(address owner, address spender) public view returns (uint256)"
      ];
      
      const tokenContract = new ethers.Contract(
        paymentTokenAddress as string,
        tokenAbi,
        signer
      );

      // Check current allowance
      const currentAllowance = await tokenContract.allowance(address, contractAddress as string);
      
      // Only approve if needed
      if (currentAllowance < viewingPrice) {
        const approveTx = await tokenContract.approve(contractAddress as string, viewingPrice);
        await approveTx.wait();
      }
      
      setIsApproving(false);

      // Step 2: Pay for access
      setIsPaying(true);
      await payForViewAccess.mutateAsync({ tokenId: folderId });
      
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Failed to process payment. Please try again.");
    } finally {
      setIsApproving(false);
      setIsPaying(false);
    }
  };

  const isProcessing = isApproving || isPaying;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Pay for Access
          </DialogTitle>
          <DialogDescription>
            This folder requires payment to access
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Folder Info */}
          <div className="p-4 bg-gray-50 rounded-md border">
            <div className="text-sm font-medium text-gray-700 mb-1">
              Dataset
            </div>
            <div className="font-medium text-gray-900">{folderName}</div>
          </div>

          {/* Price Info */}
          <div className="p-4 bg-primary/5 rounded-md border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">Access Price</span>
              </div>
              <div className="text-md text-primary font-semibold">
                {formatPrice(viewingPrice)} USDFC
              </div>
            </div>
          </div>

          {/* Payment Steps */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Payment Process:</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className={`flex items-center gap-2 ${isApproving ? "text-primary" : ""}`}>
                <div className={`w-2 h-2 rounded-full ${isApproving ? "bg-primary" : "bg-gray-300"}`} />
                Step 1: Approve token transfer
              </div>
              <div className={`flex items-center gap-2 ${isPaying ? "text-primary" : ""}`}>
                <div className={`w-2 h-2 rounded-full ${isPaying ? "bg-primary" : "bg-gray-300"}`} />
                Step 2: Process payment
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <div className="ml-2 text-sm text-red-800">{error}</div>
            </Alert>
          )}

          {/* Info message */}
          <Alert>
            <AlertCircle className="w-4 h-4 text-primary" />
            <div className="ml-2 text-xs font-light text-foreground">
              After payment, you will have permanent read access to this folder and its contents.
            </div>
          </Alert>

          {/* Action buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="min-w-[120px]"
            >
              {isApproving ? "Approving..." : isPaying ? "Processing..." : `Pay ${formatPrice(viewingPrice)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
