import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { decryptFileWithLit, initLitClient } from "@/lib/litClient";

export const useFileDecryption = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const { address } = useAccount();

  const mutation = useMutation({
    mutationKey: ["file-decryption", address],
    mutationFn: async ({
      ciphertext,
      dataToEncryptHash,
      metadata,
    }: {
      ciphertext: string;
      dataToEncryptHash: string;
      metadata: {
        originalFileName: string;
        originalFileSize: number;
        originalFileType: string;
      };
    }) => {
      if (!address) throw new Error("Address not found");
      
      setProgress(0);
      setStatus("Initializing Lit Protocol...");

      try {
        setProgress(10);
        await initLitClient();
        
        setStatus("Getting session signatures...");
        setProgress(25);

        setStatus("Decrypting file...");
        setProgress(50);

        const decryptedFile = await decryptFileWithLit(
          ciphertext,
          dataToEncryptHash,
          metadata,
          address
        );

        setStatus("Decryption complete!");
        setProgress(100);

        return decryptedFile;
      } catch (error) {
        console.error("Decryption error:", error);
        throw new Error(
          `Decryption failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },
    onError: (error) => {
      console.error("Decryption failed:", error);
      setStatus(`❌ Decryption failed: ${error.message || "Please try again"}`);
      setProgress(0);
    },
  });

  const handleReset = () => {
    setProgress(0);
    setStatus("");
  };

  return {
    decryptFileMutation: mutation,
    progress,
    status,
    handleReset,
  };
};
