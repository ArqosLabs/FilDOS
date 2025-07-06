"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { useOwnedFolders, useMintFolder } from "@/hooks/useContract";
import { useFolderList } from "@/hooks/useFolderList";
import Header from "@/components/header";
import CreateFolderDialog from "@/components/create-folder-dialog";
import { Button } from "@/components/ui/button";
import FileGrid from "@/components/file-grid";
import FileList from "@/components/file-list";

export interface FileItem {
  id: string;
  name: string;
  folderType: string;
  type: "folder" | "document" | "image" | "video" | "pdf" | "embed" | "other";
  size?: string;
  modified: string;
  owner: string;
  starred: boolean;
  shared: boolean;
  tokenId?: string;
  cid?: string;
  tags?: string[];
}

const formatDate = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export default function MyDrive() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [lastCreatedFolder, setLastCreatedFolder] = useState<{ name: string; tokenId: string } | null>(null);
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { data: ownedFolders, isLoading: foldersLoading, error: foldersError } = useOwnedFolders();
  const { folderDataMap, isLoading: folderDataLoading, hasError: folderDataError } = useFolderList(ownedFolders || []);
  const mintFolder = useMintFolder();

  // Transform contract data to FileItem format - only folders at root level
  const files: FileItem[] = (ownedFolders || []).map((tokenId: string) => {
    const folderData = folderDataMap.get(tokenId);
    const isLoading = folderDataLoading && !folderData;
    const hasError = folderDataError && !folderData;
    
    return {
      id: tokenId,
      name: isLoading ? "Loading..." : hasError ? `Folder ${tokenId}` : folderData?.name || `Folder ${tokenId}`,
      type: "folder" as const,
      folderType: folderData?.folderType || "",
      modified: isLoading ? "Loading..." : hasError ? "Unknown" : formatDate(folderData?.createdAt || BigInt(0)),
      owner: address || "Unknown",
      starred: false,
      shared: folderData?.isPublic || false,
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

  const handleCreateFolder = async (name: string, folderType: string = "personal") => {
    if (!isConnected) {
      console.error("Please connect your wallet first");
      return;
    }

    try {
      console.log(`Creating folder "${name}" of type "${folderType}"...`);
      const result = await mintFolder.mutateAsync({ name, folderType });
      
      // Set success state
      if (result.tokenId) {
        setLastCreatedFolder({ name, tokenId: result.tokenId });
        // Clear success message after 5 seconds
        setTimeout(() => setLastCreatedFolder(null), 5000);
      }
      
      console.log("✅ Folder created successfully!");
      console.log(`📁 Folder Name: ${name}`);
      console.log(`🏷️ Folder Type: ${folderType}`);
      console.log(`🔢 Token ID: ${result.tokenId}`);
      console.log(`📋 Transaction Hash: ${result.receipt.hash}`);
    } catch (error) {
      console.error("❌ Error creating folder:", error);
    }
  };

  const handleFolderClick = (folderId?: string, url?: string) => {
    if (folderId) {
      router.push(`/dashboard/folder/${folderId}`);
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  // Get current folder data for breadcrumb
  const isLoading = foldersLoading || folderDataLoading;
  const hasError = foldersError || mintFolder.error || folderDataError;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access your folders and files.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <Header isFilePage={true} viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Create Folder Button - Always visible at the top */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Drive</h2>
              <CreateFolderDialog onCreateFolder={handleCreateFolder}>
                <Button
                  className="bg-primary hover:bg-secondary text-white"
                  disabled={mintFolder.isPending}
                >
                  {mintFolder.isPending ? "Creating..." : "Create Folder"}
                </Button>
              </CreateFolderDialog>
            </div>
          </div>

          {/* Success notification */}
          {lastCreatedFolder && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    <strong>Folder created successfully!</strong> &ldquo;{lastCreatedFolder.name}&rdquo; (Token ID: {lastCreatedFolder.tokenId})
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      onClick={() => setLastCreatedFolder(null)}
                      className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <p className="text-gray-600">
                  {mintFolder.error?.message || foldersError?.message || "Something went wrong"}
                </p>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && !hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="space-y-1">
                  {foldersLoading && (
                    <p className="text-gray-600">Loading your folders...</p>
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
                  <Folder className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No folders yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first folder to start organizing your files.
                  </p>
                </div>
              ) : (
                <>
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
