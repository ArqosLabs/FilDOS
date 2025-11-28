import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSynapse } from "@/providers/SynapseProvider";
import { encryptFileWithLit, initLitClient } from "@/lib/litClient";
import { useAccount } from "./useAccount";
import { config } from "@/config";
import { calculateStorageMetrics } from "@/utils";
import { usePayment } from "./usePayment";

export type UploadedInfo = {
  fileName?: string;
  fileSize?: number;
  pieceCid?: string;
  txHash?: string;
  encrypted?: boolean;
  dataToEncryptHash?: string;
  fileType?: string;
  // Metadata from Lit encryption
  encryptedMetadata?: {
    dataToEncryptHash: string;
    originalFileName: string;
    originalFileSize: number;
    originalFileType: string;
    encryptedAt: number;
  };
};

/**
 * Hook to upload a file to the Filecoin network using Synapse.
 */
export const useFileUpload = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [uploadedInfo, setUploadedInfo] = useState<UploadedInfo | null>(null);
  const { address, chainId } = useAccount();
  const { synapse } = useSynapse();
  const { mutation: paymentMutation } = usePayment();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationKey: ["file-upload", address],
    mutationFn: async ({ file, encrypt = false }: { file: File; encrypt?: boolean }) => {
      if (!address) throw new Error("Address not found");
      setProgress(0);
      setUploadedInfo(null);
      setStatus("Initializing file upload to Filecoin...");

      let fileToUpload = file;
      let encryptedMetadata: UploadedInfo["encryptedMetadata"];

      // Optional encryption step
      if (encrypt) {
        setStatus("Initializing Lit Protocol...");
        setProgress(5);
        
        try {
          await initLitClient();
          setStatus("Encrypting file with Lit Protocol...");
          setProgress(10);
          
          const encrypted = await encryptFileWithLit(file, address);
          
          // Convert ciphertext to a Blob/File for upload
          const encryptedBlob = new Blob([encrypted.ciphertext], { 
            type: "application/octet-stream" 
          });
          fileToUpload = new File([encryptedBlob], `${file.name}.encrypted`, {
            type: "application/octet-stream"
          });
          
          encryptedMetadata = {
            dataToEncryptHash: encrypted.dataToEncryptHash,
            originalFileName: encrypted.originalFileName,
            originalFileSize: encrypted.originalFileSize,
            originalFileType: encrypted.originalFileType,
            encryptedAt: encrypted.encryptedAt,
          };
          
          setStatus("File encrypted successfully!");
          setProgress(15);
        } catch (error) {
          console.error("Encryption error:", error);
          throw new Error(`Encryption failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // 1) Convert File → ArrayBuffer
      const arrayBuffer = await fileToUpload.arrayBuffer();
      // 2) Convert ArrayBuffer → Uint8Array
      const uint8ArrayBytes = new Uint8Array(arrayBuffer);

      // Ensure synapse instance is available
      if (!synapse) {
        throw new Error("Wallet not connected or signer unavailable. Please connect your wallet and ensure you're on a supported Filecoin network.");
      }

      setStatus("Checking USDFC balance and storage allowances...");
      setProgress(encrypt ? 20 : 5);
      const { isSufficient, depositNeeded } =
        await calculateStorageMetrics(synapse, config, file.size);
      if (!isSufficient) {
        setStatus(
          "Insufficient storage balance, setting up your storage configuration..."
        );
        await paymentMutation.mutateAsync({
          depositAmount: depositNeeded
        });
        setStatus("Storage configuration setup complete");
      }

      setStatus("Setting up storage service and dataset...");
      setProgress(encrypt ? 30 : 25);

      let storageService;
      try {
        storageService = await synapse.createStorage({
          providerId: 4,
          callbacks: {
            onDataSetResolved: (info) => {
              console.log("Dataset resolved:", info);
              setStatus("Existing dataset found and resolved");
              setProgress(encrypt ? 35 : 30);
            },
            onProviderSelected: (provider) => {
              console.log("Storage provider selected:", provider);
              setStatus(`Storage provider selected (${provider.name})`);
              setProgress(encrypt ? 40 : 35);
            },
          },
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("recordKeeper address not allowed") || errorMessage.includes("403")) {
          throw new Error(
            "Storage not set up. Please visit the Storage Manager to buy storage capacity before uploading files."
          );
        }
        throw error;
      }

      setStatus("Uploading file to storage provider...");
      setProgress(encrypt ? 60 : 55);
      // 7) Upload file to storage provider
      const {pieceCid} = await storageService.upload(uint8ArrayBytes, {
        onUploadComplete: (piece) => {
          setStatus(
            `File uploaded! Signing msg to add pieces to the dataset`
          );
          setUploadedInfo((prev) => ({
            ...prev,
            fileName: encrypt ? file.name : fileToUpload.name,
            fileSize: file.size,
            pieceCid: piece.toV1().toString(),
            encrypted: encrypt,
            fileType: file.type || "application/octet-stream",
            dataToEncryptHash: encryptedMetadata?.dataToEncryptHash || "",
            encryptedMetadata: encryptedMetadata,
          }));
          setProgress(80);
        },
        onPieceAdded: (hash) => {
          setStatus(
            `Waiting for transaction to be confirmed on chain (txHash: ${hash})`
          );
          setUploadedInfo((prev) => ({
            ...prev,
            txHash: hash,
          }));
        },
        onPieceConfirmed: () => {
          setStatus("Data pieces added to dataset successfully");
          setProgress(90);
        },
      });

      setProgress(encrypt ? 98 : 95);
      setUploadedInfo((prev) => ({
        ...prev,
        pieceCid: pieceCid.toV1().toString(),
      }));
    },
    onSuccess: () => {
      setStatus("File successfully stored on Filecoin!");
      setProgress(100);
      queryClient.invalidateQueries({
        queryKey: ["balances", address, config, chainId],
      });
      queryClient.invalidateQueries({
        queryKey: ["datasets", address, chainId],
      });
    },
    onError: (error) => {
      console.error("Upload failed:", error);
      setStatus(`Upload failed: ${error.message || "Please try again"}`);
      setProgress(0);
    },
  });

  const handleReset = () => {
    setProgress(0);
    setUploadedInfo(null);
    setStatus("");
  };

  return {
    uploadFileMutation: mutation,
    progress,
    uploadedInfo,
    handleReset,
    status,
  };
};