"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Folder, CheckCircle2, X, Loader2 } from "lucide-react";
import { useOwnedFolders, useMintFolder } from "@/hooks/useContract";
import { useFolderList } from "@/hooks/useFolderList";
import Header from "@/components/header";
import CreateFolderDialog from "@/components/create-folder-dialog";
import { Button } from "@/components/ui/button";
import FileGrid from "@/components/file-grid";
import FileList from "@/components/file-list";
import { FileItem } from "@/types";

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
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const { data: ownedFolders, isLoading: foldersLoading, error: foldersError } = useOwnedFolders();
  const { 
    folderDataMap, 
    isLoading: folderDataLoading, 
    hasError: folderDataError,
    successCount,
    totalCount 
  } = useFolderList(ownedFolders || []);
  const mintFolder = useMintFolder();

  // Prevent hydration mismatches by ensuring client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Transform contract data to FileItem format - only folders at root level
  const files: FileItem[] = (ownedFolders || []).map((tokenId: string) => {
    const folderData = folderDataMap.get(tokenId);
    
    return {
      id: tokenId,
      name: folderData?.name || `Folder ${tokenId}`,
      type: "folder" as const,
      folderType: folderData?.folderType || "",
      modified: folderData ? formatDate(folderData.createdAt) : "Unknown",
      owner: address || "Unknown",
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
      router.push(`/folder/${folderId}`);
    } else if (url) {
      window.open(url, '_blank');
    }
  };

  // Get current folder data for breadcrumb
  const isLoading = foldersLoading || folderDataLoading;
  const hasError = foldersError || mintFolder.error || folderDataError;

  // Show loading state during hydration to prevent mismatch
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to access your folders and files.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isFilePage={true} viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Create Folder Button - Always visible at the top */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">My Drive</h2>
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
            <div className="bg-secondary/10 border-l-4 border-secondary p-4 m-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-secondary flex-shrink-0" />
                <p className="text-xs text-foreground flex-1 font-light">
                  Folder created successfully! &ldquo;{lastCreatedFolder.name}&rdquo; (Token ID: {lastCreatedFolder.tokenId})
                </p>
                <button
                  onClick={() => setLastCreatedFolder(null)}
                  className="rounded-sm p-1 text-secondary hover:bg-secondary/20 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
          {/* Error state */}
          {hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <div className="space-y-2">
                  {foldersError && (
                    <p className="text-gray-600">
                      <strong>Failed to load folders:</strong> {foldersError.message}
                    </p>
                  )}
                  {folderDataError && (
                    <p className="text-gray-600">
                      <strong>Failed to load folder details:</strong> Some folder information may be incomplete.
                      {successCount > 0 && totalCount > 0 && (
                        <span className="block text-sm text-gray-500 mt-1">
                          Loaded {successCount} of {totalCount} folders successfully.
                        </span>
                      )}
                    </p>
                  )}
                  {mintFolder.error && (
                    <p className="text-gray-600">
                      <strong>Failed to create folder:</strong> {mintFolder.error.message}
                    </p>
                  )}
                  {!foldersError && !folderDataError && !mintFolder.error && (
                    <p className="text-gray-600">Something went wrong. Please try again.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && !hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              </div>
            </div>
          )}

          {/* File view */}
          {(!isLoading || (folderDataLoading && successCount > 0)) && !hasError && (
            <>
              {/* Show partial loading indicator if some folders are still loading */}
              {folderDataLoading && successCount > 0 && totalCount > successCount && (
                <div className="bg-primary/10 border-l-4 border-primary p-4 m-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                    <p className="text-sm text-foreground">
                      Loading folder details... ({successCount}/{totalCount} loaded)
                    </p>
                  </div>
                </div>
              )}

              {files.length === 0 && !foldersLoading ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Folder className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No folders yet</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first folder to start organizing your files.
                  </p>
                </div>
              ) : files.length > 0 ? (
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
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
