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
            encrypted: boolean;
            dataToEncryptHash: string;
            fileType: string;
          }) => ({
            cid: file.cid,
            filename: file.filename,
            timestamp: file.timestamp,
            owner: file.owner,
            tags: file.tags,
            encrypted: file.encrypted,
            dataToEncryptHash: file.dataToEncryptHash,
            fileType: file.fileType,
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
            viewingPrice: data.viewingPrice,
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

    // Get file count in a folder
    useFileCount: (tokenId: string | number) => {
      return useQuery({
        queryKey: ["file-count", tokenId],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const count = await contract.getFileCount(tokenId);
          return Number(count);
        },
        enabled: !!contract && !!tokenId,
      });
    },

    // Check if a file exists in a folder
    useFileExists: (tokenId: string | number, cid: string) => {
      return useQuery({
        queryKey: ["file-exists", tokenId, cid],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          return await contract.fileExists(tokenId, cid);
        },
        enabled: !!contract && !!tokenId && !!cid,
      });
    },

    // Search files by tag in a specific folder
    useSearchFilesByTag: (tokenId: string | number, tag: string, enabled = true) => {
      return useQuery({
        queryKey: ["search-files-by-tag", tokenId, tag],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const files = await contract.searchFilesByTag(tokenId, tag);
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
        enabled: enabled && !!contract && !!tokenId && !!tag,
      });
    },

    // Search files by tag across multiple folders
    useSearchFilesByTagAcrossFolders: (folderIds: (string | number)[], tag: string, enabled = true) => {
      return useQuery({
        queryKey: ["search-files-across-folders", folderIds, tag],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const files = await contract.searchFilesByTagAcrossFolders(folderIds, tag);
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
        enabled: enabled && !!contract && folderIds.length > 0 && !!tag,
      });
    },

    // Search my files by tag across all owned folders
    useSearchMyFilesByTag: (tag: string, enabled = true) => {
      return useQuery({
        queryKey: ["search-my-files-by-tag", address, tag],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const files = await contract.searchMyFilesByTag(tag);
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
        enabled: enabled && !!contract && !!address && !!tag,
      });
    },

    // Get all unique tags from files in a specific folder
    useFolderTags: (tokenId: string | number) => {
      return useQuery({
        queryKey: ["folder-tags", tokenId],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          return await contract.getFolderTags(tokenId);
        },
        enabled: !!contract && !!tokenId,
      });
    },

    // Search files by multiple tags (must have ALL tags)
    useSearchFilesByMultipleTags: (tokenId: string | number, tags: string[], enabled = true) => {
      return useQuery({
        queryKey: ["search-files-by-multiple-tags", tokenId, tags],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const files = await contract.searchFilesByMultipleTags(tokenId, tags);
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
        enabled: enabled && !!contract && !!tokenId && tags.length > 0,
      });
    },

    // Get viewing price for a folder
    useViewingPrice: (tokenId: string | number) => {
      return useQuery({
        queryKey: ["viewing-price", tokenId],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const price = await contract.getViewingPrice(tokenId);
          return price;
        },
        enabled: !!contract && !!tokenId,
      });
    },

    // Check if user has paid for view access
    useHasPaidViewAccess: (tokenId: string | number, viewer?: string) => {
      return useQuery({
        queryKey: ["has-paid-view-access", tokenId, viewer || address],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          return await contract.hasPaidViewAccess(tokenId, viewer || address);
        },
        enabled: !!contract && !!tokenId && !!(viewer || address),
      });
    },

    // Get payment token address
    usePaymentToken: () => {
      return useQuery({
        queryKey: ["payment-token"],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          return await contract.paymentToken();
        },
        enabled: !!contract,
      });
    },

    // Get folder sharees (users with share access)
    useFolderSharees: (tokenId: string | number) => {
      return useQuery({
        queryKey: ["folder-sharees", tokenId],
        queryFn: async () => {
          if (!contract) throw new Error("Contract not initialized");
          const [shareIds, sharees, canReadList, canWriteList] = await contract.getFolderSharees(tokenId);
          return {
            shareIds: shareIds.map((id: bigint) => id.toString()),
            sharees: sharees as string[],
            canReadList: canReadList as boolean[],
            canWriteList: canWriteList as boolean[],
          };
        },
        enabled: !!contract && !!tokenId,
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
        tags,
        encrypted = false,
        dataToEncryptHash = "",
        fileType = "",
      }: {
        tokenId: string | number;
        cid: string;
        filename: string;
        tags: string[];
        encrypted?: boolean;
        dataToEncryptHash?: string;
        fileType?: string;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const transaction = await contract.addFile(
          tokenId, 
          cid, 
          filename, 
          tags,
          encrypted,
          dataToEncryptHash,
          fileType
        );
        return await transaction.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate files query for this folder
        queryClient.invalidateQueries({ queryKey: ["folder-files", variables.tokenId] });
        queryClient.invalidateQueries({ queryKey: ["file-count", variables.tokenId] });
        queryClient.invalidateQueries({ queryKey: ["folder-tags", variables.tokenId] });
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

    // Set folder public/private with optional viewing price
    setFolderPublic: useMutation({
      mutationFn: async ({
        tokenId,
        isPublic,
        viewingPrice = 0,
      }: {
        tokenId: string | number;
        isPublic: boolean;
        viewingPrice?: bigint | number;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.setFolderPublic(tokenId, isPublic, viewingPrice);
        return await tx.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate public folders query
        queryClient.invalidateQueries({ queryKey: ["public-folders"] });
        // Invalidate folder data query to update the UI
        queryClient.invalidateQueries({ queryKey: ["folder-data", variables.tokenId] });
        // Invalidate viewing price query
        queryClient.invalidateQueries({ queryKey: ["viewing-price", variables.tokenId] });
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
        // Invalidate folder sharees query
        queryClient.invalidateQueries({ queryKey: ["folder-sharees", variables.tokenId] });
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
        // Invalidate all folder sharees queries
        queryClient.invalidateQueries({ queryKey: ["folder-sharees"] });
      },
    }),

    // Remove a file from a folder
    removeFile: useMutation({
      mutationFn: async ({
        tokenId,
        cid,
      }: {
        tokenId: string | number;
        cid: string;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.removeFile(tokenId, cid);
        return await tx.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate files query for this folder
        queryClient.invalidateQueries({ queryKey: ["folder-files", variables.tokenId] });
        queryClient.invalidateQueries({ queryKey: ["file-count", variables.tokenId] });
        queryClient.invalidateQueries({ queryKey: ["file-exists", variables.tokenId, variables.cid] });
        queryClient.invalidateQueries({ queryKey: ["folder-tags", variables.tokenId] });
      },
    }),

    // Set viewing price for a folder
    setViewingPrice: useMutation({
      mutationFn: async ({
        tokenId,
        price,
      }: {
        tokenId: string | number;
        price: bigint | string;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.setViewingPrice(tokenId, price);
        return await tx.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate viewing price query
        queryClient.invalidateQueries({ queryKey: ["viewing-price", variables.tokenId] });
      },
    }),

    // Pay for view access (direct payment - requires approval)
    payForViewAccess: useMutation({
      mutationFn: async ({
        tokenId,
      }: {
        tokenId: string | number;
      }) => {
        if (!contract || !signer) throw new Error("Contract or signer not initialized");
        const tx = await contract.payForViewAccess(tokenId);
        return await tx.wait();
      },
      onSuccess: (_, variables) => {
        // Invalidate access queries
        queryClient.invalidateQueries({ queryKey: ["has-paid-view-access", variables.tokenId] });
        queryClient.invalidateQueries({ queryKey: ["can-read", variables.tokenId] });
        queryClient.invalidateQueries({ queryKey: ["folder-access", variables.tokenId] });
      },
    })
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

export const useMintFolder = () => useContract().mutations.mintFolder;
export const useAddFile = () => useContract().mutations.addFile;
export const useMoveFile = () => useContract().mutations.moveFile;
export const useSetFolderPublic = () => useContract().mutations.setFolderPublic;
export const useShareFolder = () => useContract().mutations.shareFolder;
export const useRevokeShare = () => useContract().mutations.revokeShare;
export const useRemoveFile = () => useContract().mutations.removeFile;
export const useSetViewingPrice = () => useContract().mutations.setViewingPrice;
export const usePayForViewAccess = () => useContract().mutations.payForViewAccess;

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
export const useFileCount = (tokenId: string | number) => 
  useContract().queries.useFileCount(tokenId);
export const useFileExists = (tokenId: string | number, cid: string) => 
  useContract().queries.useFileExists(tokenId, cid);
export const useSearchFilesByTag = (tokenId: string | number, tag: string, enabled = true) => 
  useContract().queries.useSearchFilesByTag(tokenId, tag, enabled);
export const useSearchFilesByTagAcrossFolders = (folderIds: (string | number)[], tag: string, enabled = true) => 
  useContract().queries.useSearchFilesByTagAcrossFolders(folderIds, tag, enabled);
export const useSearchMyFilesByTag = (tag: string, enabled = true) => 
  useContract().queries.useSearchMyFilesByTag(tag, enabled);
export const useFolderTags = (tokenId: string | number) => 
  useContract().queries.useFolderTags(tokenId);
export const useSearchFilesByMultipleTags = (tokenId: string | number, tags: string[], enabled = true) => 
  useContract().queries.useSearchFilesByMultipleTags(tokenId, tags, enabled);
export const useViewingPrice = (tokenId: string | number) => 
  useContract().queries.useViewingPrice(tokenId);
export const useHasPaidViewAccess = (tokenId: string | number, viewer?: string) => 
  useContract().queries.useHasPaidViewAccess(tokenId, viewer);
export const usePaymentToken = () => 
  useContract().queries.usePaymentToken();
export const useFolderSharees = (tokenId: string | number) => 
  useContract().queries.useFolderSharees(tokenId);

// Helper to get contract address
export const useContractAddress = () => useContract().helpers.getAddress();