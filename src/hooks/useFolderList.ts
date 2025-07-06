import { useFolderData } from "./useContract";

/**
 * Custom hook to fetch folder data for multiple folder token IDs
 * This hook handles the dynamic fetching of folder metadata while adhering to React hooks rules
 */
export const useFolderList = (tokenIds: string[]) => {
  // Create individual queries for each token ID
  // We'll handle up to 20 folders (reasonable limit)
  const maxFolders = 20;
  const limitedTokenIds = tokenIds.slice(0, maxFolders);
  
  // Create array of folder data hooks
  const folderDataHooks = [
    useFolderData(limitedTokenIds[0] || ""),
    useFolderData(limitedTokenIds[1] || ""),
    useFolderData(limitedTokenIds[2] || ""),
    useFolderData(limitedTokenIds[3] || ""),
    useFolderData(limitedTokenIds[4] || ""),
    useFolderData(limitedTokenIds[5] || ""),
    useFolderData(limitedTokenIds[6] || ""),
    useFolderData(limitedTokenIds[7] || ""),
    useFolderData(limitedTokenIds[8] || ""),
    useFolderData(limitedTokenIds[9] || ""),
    useFolderData(limitedTokenIds[10] || ""),
    useFolderData(limitedTokenIds[11] || ""),
    useFolderData(limitedTokenIds[12] || ""),
    useFolderData(limitedTokenIds[13] || ""),
    useFolderData(limitedTokenIds[14] || ""),
    useFolderData(limitedTokenIds[15] || ""),
    useFolderData(limitedTokenIds[16] || ""),
    useFolderData(limitedTokenIds[17] || ""),
    useFolderData(limitedTokenIds[18] || ""),
    useFolderData(limitedTokenIds[19] || ""),
  ];

  // Only use the queries that have actual token IDs
  const activeQueries = folderDataHooks.slice(0, limitedTokenIds.length);

  const isLoading = activeQueries.some((query) => query.isLoading);
  const hasError = activeQueries.some((query) => query.error);
  const errors = activeQueries.filter((query) => query.error).map((query) => query.error);

  // Transform the results into a map for easy access
  const folderDataMap = new Map<string, { name: string; folderType: string; isPublic: boolean; owner: string; createdAt: bigint }>();
  activeQueries.forEach((query, index) => {
    if (query.data && limitedTokenIds[index]) {
      folderDataMap.set(limitedTokenIds[index], query.data);
    }
  });

  return {
    folderDataMap,
    isLoading,
    hasError,
    errors,
  };
};
