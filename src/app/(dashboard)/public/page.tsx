"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Globe, Eye } from "lucide-react";
import { usePublicFolders } from "@/hooks/useContract";
import { useFolderList } from "@/hooks/useFolderList";
import Header from "@/components/header";
import FileGrid from "@/components/file-grid";
import FileList from "@/components/file-list";
import { FileItem } from "../page";

const formatDate = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function PublicFolders() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const router = useRouter();

  const { isConnected } = useAccount();
  const { data: publicFolders, isLoading: foldersLoading, error: foldersError } = usePublicFolders();
  const { folderDataMap, isLoading: folderDataLoading, hasError: folderDataError } = useFolderList(publicFolders || []);

  // Transform contract data to FileItem format - only public folders
  const files: FileItem[] = (publicFolders || []).map((tokenId: string) => {
    const folderData = folderDataMap.get(tokenId);
    const isLoading = folderDataLoading && !folderData;
    const hasError = folderDataError && !folderData;
    
    return {
      id: tokenId,
      name: isLoading ? "Loading..." : hasError ? `Folder ${tokenId}` : folderData?.name || `Folder ${tokenId}`,
      type: "folder" as const,
      folderType: folderData?.folderType || "",
      modified: isLoading ? "Loading..." : hasError ? "Unknown" : formatDate(folderData?.createdAt || BigInt(0)),
      owner: folderData?.owner || "Unknown",
      starred: false,
      shared: true, // All public folders are considered "shared" for display purposes
      tokenId,
      tags: [], // Add empty tags array
    };
  });

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleFolderClick = (folderId?: string, url?: string) => {
    if (folderId) {
      router.push(`/folder/${folderId}`);
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  // Get current folder data for breadcrumb
  const isLoading = foldersLoading || folderDataLoading;
  const hasError = foldersError || folderDataError;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access public folders.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isFilePage={true} viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-medium">Public Folders</h2>
              </div>
              <div className="text-sm text-gray-600">
                {files.length} public folder{files.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>
          
          {/* Error state */}
          {hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <p className="text-gray-600">
                  {foldersError?.message || "Something went wrong loading public folders"}
                </p>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && !hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                <div className="space-y-1">
                  {foldersLoading && (
                    <p className="text-gray-600">Loading public folders...</p>
                  )}
                  {folderDataLoading && (
                    <p className="text-gray-600">Loading folder details...</p>
                  )}
                  {!foldersLoading && !folderDataLoading && (
                    <p className="text-gray-600">Loading...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* File view */}
          {!isLoading && !hasError && (
            <>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Globe className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No public folders yet</h3>
                  <p className="text-gray-600 mb-4">
                    Public folders that anyone can access will appear here.
                  </p>
                  <p className="text-sm text-gray-500">
                    Create folders and make them public to share with the community.
                  </p>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Eye className="w-4 h-4" />
                      <span>These folders are publicly accessible by anyone</span>
                    </div>
                  </div>
                  {viewMode === "grid" ? (
                    <FileGrid 
                      files={files} 
                      selectedFiles={selectedFiles}
                      onToggleSelection={toggleFileSelection}
                      onFolderClick={handleFolderClick}
                    />
                  ) : (
                    <FileList
                      files={files} 
                      selectedFiles={selectedFiles}
                      onToggleSelection={toggleFileSelection}
                      onFolderClick={handleFolderClick}
                    />
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
