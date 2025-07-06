import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getContract } from "@/utils/contracts";
import { useEthersSigner, useEthersProvider } from "@/hooks/useEthers";
import type { FileEntry, FolderAccess } from "@/types";


/**
 * Hook to interact with the FolderNFT smart contract
 */
export const useContract = () => {
  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const { address } = useAccount();
  const queryClient = useQueryClient();

  // Get contract instance
  const contract = useMemo(() => {
    if (!signer && !provider) return null;
    return getContract(signer || provider!);
  }, [signer, provider]);

  // Read-only queries
  const queries = {
    // Get files in a folder
    useFiles: (tokenId: string | number, enabled = true) => {
      return useQuery({
        queryKey: ["folder-files", tokenId],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const files = await contract.getFiles(tokenId);
          return files.map((file: {
            cid: string;
            filename: string;
            timestamp: bigint;
            owner: string;
            tags: string[];
          }) => ({
            cid: file.cid,
            filename: file.filename,
            timestamp: file.timestamp,
            owner: file.owner,
            tags: file.tags,
          })) as FileEntry[];
        },
        enabled: enabled && !!contract && !!tokenId,
      });
    },

    // Get folder data
    useFolderData: (tokenId: string | number) => {
      return useQuery({
        queryKey: ["folder-data", tokenId],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const data = await contract.getFolderData(tokenId);
          return {
            name: data.name,
            folderType: data.folderType,
            isPublic: data.isPublic,
            owner: data.owner,
            createdAt: data.createdAt,
          };
        },
        enabled: !!contract && !!tokenId,
      });
    },

    // Get folder access permissions
    useFolderAccess: (tokenId: string | number, user?: string) => {
      return useQuery({
        queryKey: ["folder-access", tokenId, user || address],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const [canRead, canWrite, isOwner] = await contract.getFolderAccess(
            tokenId,
            user || address
          );
          return { canRead, canWrite, isOwner } as FolderAccess;
        },
        enabled: !!contract && !!tokenId && !!(user || address),
      });
    },

    // Get folders owned by user
    useOwnedFolders: (owner?: string) => {
      return useQuery({
        queryKey: ["owned-folders", owner || address],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const folders = await contract.getFoldersOwnedBy(owner || address);
          return folders.map((id: bigint) => id.toString());
        },
        enabled: !!contract && !!(owner || address),
      });
    },

    // Get public folders
    usePublicFolders: () => {
      return useQuery({
        queryKey: ["public-folders"],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const folders = await contract.getPublicFolders();
          return folders.map((id: bigint) => id.toString());
        },
        enabled: !!contract,
      });
    },

    // Get folders shared to user
    useSharedFolders: (user?: string) => {
      return useQuery({
        queryKey: ["shared-folders", user || address],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const folders = await contract.getFoldersSharedTo(user || address);
          return folders.map((id: bigint) => id.toString());
        },
        enabled: !!contract && !!(user || address),
      });
    },

    // Check if user can read a folder
    useCanRead: (tokenId: string | number, user?: string) => {
      return useQuery({
        queryKey: ["can-read", tokenId, user || address],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          return await contract.canRead(tokenId, user || address);
        },
        enabled: !!contract && !!tokenId && !!(user || address),
      });
    },

    // Check if user can write to a folder
    useCanWrite: (tokenId: string | number, user?: string) => {
      return useQuery({
        queryKey: ["can-write", tokenId, user || address],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          return await contract.canWrite(tokenId, user || address);
        },
        enabled: !!contract && !!tokenId && !!(user || address),
      });
    },
  };

  // Write mutations
  const mutations = {
    // Mint a new folder
    mintFolder: useMutation({
      mutationFn: async ({ name, folderType }: { name: string; folderType: string }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.mintFolder(name, folderType);
        const receipt = await tx.wait();
        
        // Extract the token ID from the event
        const event = receipt.logs.find((log: { topics: string[]; data: string }) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === 'FolderMinted';
          } catch {
            return false;
          }
        });
        
        let tokenId = null;
        if (event) {
          const parsed = contract.interface.parseLog(event);
          tokenId = parsed?.args?.tokenId?.toString();
        }
        
        return { receipt, tokenId };
      },
      onSuccess: () => {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ["owned-folders"] });
        queryClient.invalidateQueries({ queryKey: ["public-folders"] });
      },
    }),

    // Add a file to a folder
    addFile: useMutation({
      mutationFn: async ({
        tokenId,
        cid,
        filename,
        tags = [],
      }: {
        tokenId: string | number;
        cid: string;
        filename: string;
        tags?: string[];
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.addFile(tokenId, cid, filename, tags);
        return await tx.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate files query for this folder
        queryClient.invalidateQueries({ queryKey: ["folder-files", variables.tokenId] });
      },
    }),

    // Move a file between folders
    moveFile: useMutation({
      mutationFn: async ({
        fromTokenId,
        toTokenId,
        cid,
      }: {
        fromTokenId: string | number;
        toTokenId: string | number;
        cid: string;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.moveFile(fromTokenId, toTokenId, cid);
        return await tx.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate files queries for both folders
        queryClient.invalidateQueries({ queryKey: ["folder-files", variables.fromTokenId] });
        queryClient.invalidateQueries({ queryKey: ["folder-files", variables.toTokenId] });
      },
    }),

    // Set folder public/private
    setFolderPublic: useMutation({
      mutationFn: async ({
        tokenId,
        isPublic,
      }: {
        tokenId: string | number;
        isPublic: boolean;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.setFolderPublic(tokenId, isPublic);
        return await tx.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate public folders query
        queryClient.invalidateQueries({ queryKey: ["public-folders"] });
        // Invalidate folder data query to update the UI
        queryClient.invalidateQueries({ queryKey: ["folder-data", variables.tokenId] });
      },
    }),

    // Share a folder with another user
    shareFolder: useMutation({
      mutationFn: async ({
        tokenId,
        grantee,
        canRead,
        canWrite,
      }: {
        tokenId: string | number;
        grantee: string;
        canRead: boolean;
        canWrite: boolean;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.shareFolder(tokenId, grantee, canRead, canWrite);
        const receipt = await tx.wait();
        
        // Extract the share ID from the event
        const event = receipt.logs.find((log: { topics: string[]; data: string }) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === 'ShareCreated';
          } catch {
            return false;
          }
        });
        
        let shareId = null;
        if (event) {
          const parsed = contract.interface.parseLog(event);
          shareId = parsed?.args?.shareId?.toString();
        }
        
        return { receipt, shareId };
      },
      onSuccess: (_, variables) => {
        // Invalidate shared folders query for the grantee
        queryClient.invalidateQueries({ queryKey: ["shared-folders", variables.grantee] });
        queryClient.invalidateQueries({ queryKey: ["folder-access", variables.tokenId, variables.grantee] });
      },
    }),

    // Revoke a share
    revokeShare: useMutation({
      mutationFn: async ({ shareId }: { shareId: string | number }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.revokeShare(shareId);
        return await tx.wait();
      },
      onSuccess: () => {
        // Invalidate all shared folders queries
        queryClient.invalidateQueries({ queryKey: ["shared-folders"] });
        queryClient.invalidateQueries({ queryKey: ["folder-access"] });
      },
    }),
  };

  // Helper functions
  const helpers = {
    // Check if contract is ready
    isReady: !!contract,
    
    // Get contract address
    getAddress: () => contract?.target,
    
    // Format token ID
    formatTokenId: (tokenId: bigint | string) => {
      return typeof tokenId === 'bigint' ? tokenId.toString() : tokenId;
    },
    
    // Parse contract events
    parseEvents: (receipt: { logs: { topics: string[]; data: string }[] }, eventName: string) => {
      if (!contract || !receipt) return [];
      return receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try {
            const parsed = contract.interface.parseLog(log);
            return parsed?.name === eventName ? parsed : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    },
  };

  return {
    contract,
    queries,
    mutations,
    helpers,
  };
};

// Export individual mutation hooks for convenience
export const useMintFolder = () => useContract().mutations.mintFolder;
export const useAddFile = () => useContract().mutations.addFile;
export const useMoveFile = () => useContract().mutations.moveFile;
export const useSetFolderPublic = () => useContract().mutations.setFolderPublic;
export const useShareFolder = () => useContract().mutations.shareFolder;
export const useRevokeShare = () => useContract().mutations.revokeShare;

// Export individual query hooks for convenience
export const useFiles = (tokenId: string | number, enabled = true) => 
  useContract().queries.useFiles(tokenId, enabled);
export const useFolderData = (tokenId: string | number) =>
    useContract().queries.useFolderData(tokenId);
export const useFolderAccess = (tokenId: string | number, user?: string) => 
  useContract().queries.useFolderAccess(tokenId, user);
export const useOwnedFolders = (owner?: string) => 
  useContract().queries.useOwnedFolders(owner);
export const usePublicFolders = () => useContract().queries.usePublicFolders();
export const useSharedFolders = (user?: string) => 
  useContract().queries.useSharedFolders(user);
export const useCanRead = (tokenId: string | number, user?: string) => 
  useContract().queries.useCanRead(tokenId, user);
export const useCanWrite = (tokenId: string | number, user?: string) => 
  useContract().queries.useCanWrite(tokenId, user);