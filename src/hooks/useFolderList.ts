import { useQueries } from "@tanstack/react-query";
import { useContract } from "./useContract";
import type { FolderInfo } from "@/types";

/**
 * Custom hook to fetch folder data for multiple folder token IDs
 * This hook uses React Query's useQueries to dynamically fetch folder data
 * for any number of folders without hardcoding limits
 */
export const useFolderList = (tokenIds: (string | number)[]) => {
  const { contract } = useContract();

  // Use useQueries to dynamically create queries for each token ID
  const queries = useQueries({
    queries: tokenIds.map((tokenId) => ({
      queryKey: ["folder-data", tokenId],
      queryFn: async (): Promise<FolderInfo> => {
        if (!contract) throw new Error("Contract not initialized");
        const data = await contract.getFolderData(tokenId);
        return {
          name: data.name,
          folderType: data.folderType,
          isPublic: data.isPublic,
          owner: data.owner,
          createdAt: data.createdAt,
          viewingPrice: data.viewingPrice, // Added for viewing price feature
        };
      },
      enabled: !!contract && !!tokenId,
      // Add some basic retry and stale time configuration
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  // Calculate loading and error states
  const isLoading = queries.some((query) => query.isLoading);
  const hasError = queries.some((query) => query.error);
  const errors = queries.filter((query) => query.error).map((query) => query.error);
  
  // Check if all queries are done (either success or error)
  const isComplete = queries.every((query) => !query.isLoading);
  
  // Count successful queries
  const successCount = queries.filter((query) => query.isSuccess).length;

  // Transform the results into a map for easy access
  const folderDataMap = new Map<string, FolderInfo>();
  queries.forEach((query, index) => {
    if (query.data && tokenIds[index]) {
      const tokenId = typeof tokenIds[index] === 'number' 
        ? tokenIds[index].toString() 
        : tokenIds[index] as string;
      folderDataMap.set(tokenId, query.data);
    }
  });

  // Convert map to array for easier iteration in components
  const folders = Array.from(folderDataMap.entries()).map(([tokenId, data]) => ({
    tokenId,
    ...data,
  }));

  return {
    folderDataMap,
    folders,
    isLoading,
    isComplete,
    hasError,
    errors,
    successCount,
    totalCount: tokenIds.length,
  };
};
