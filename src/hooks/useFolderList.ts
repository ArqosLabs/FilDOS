import { useQueries } from "@tanstack/react-query";
import { useContract } from "./useContract";

/**
 * Custom hook to fetch folder data for multiple folder token IDs
 * This hook uses React Query's useQueries to dynamically fetch folder data
 * for any number of folders without hardcoding limits
 */
export const useFolderList = (tokenIds: string[]) => {
  const { contract } = useContract();

  // Use useQueries to dynamically create queries for each token ID
  const queries = useQueries({
    queries: tokenIds.map((tokenId) => ({
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
    })),
  });

  // Calculate loading and error states
  const isLoading = queries.some((query) => query.isLoading);
  const hasError = queries.some((query) => query.error);
  const errors = queries.filter((query) => query.error).map((query) => query.error);

  // Transform the results into a map for easy access
  const folderDataMap = new Map<string, { name: string; folderType: string; isPublic: boolean; owner: string; createdAt: bigint }>();
  queries.forEach((query, index) => {
    if (query.data && tokenIds[index]) {
      folderDataMap.set(tokenIds[index], query.data);
    }
  });

  return {
    folderDataMap,
    isLoading,
    hasError,
    errors,
  };
};
