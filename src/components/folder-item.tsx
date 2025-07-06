"use client";

import { useFolderData } from "@/hooks/useContract";
import { FileItem } from "./my-drive";

interface FolderItemProps {
  tokenId: string;
  isStarred: boolean;
  onToggleStar: (fileId: string) => void;
  onToggleSelection: (fileId: string) => void;
  onFolderClick: (folderId: string) => void;
  isSelected: boolean;
}

export function FolderItem({
  tokenId,
  isStarred,
  onToggleStar,
  onToggleSelection,
  onFolderClick,
  isSelected,
}: FolderItemProps) {
  const { data: folderData, isLoading, error } = useFolderData(tokenId);

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const fileItem: FileItem = {
    id: tokenId,
    name: isLoading ? `Loading...` : error ? `Folder ${tokenId}` : folderData?.name || `Folder ${tokenId}`,
    type: "folder" as const,
    modified: isLoading ? "Loading..." : error ? "Unknown" : formatDate(folderData?.createdAt || BigInt(0)),
    owner: isLoading ? "Loading..." : error ? "Unknown" : folderData?.owner || "Unknown",
    starred: isStarred,
    shared: folderData?.isPublic || false,
    tokenId,
  };

  return {
    fileItem,
    isLoading,
    error,
  };
}
