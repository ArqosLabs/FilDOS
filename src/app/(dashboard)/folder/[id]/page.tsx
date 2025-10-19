"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Upload, ArrowLeft, Search, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UploadDialog from "@/components/upload-dialog";
import Header from "@/components/header";
import FileGrid from "@/components/file-grid";
import FileList from "@/components/file-list";
import { useFiles, useFolderData, useCanRead } from "@/hooks/useContract";
import EmbeddingDialog from "@/components/embedding-dialog";
import SearchDialog from "@/components/search-dialog";
import PayAccessDialog from "@/components/pay-access-dialog";
import { FileItem } from "@/types";

const formatDate = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getFileTypeFromExtension = (filename: string): FileItem['type'] => {
  
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return 'image';
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'mkv':
      return 'video';
    case 'doc':
    case 'docx':
    case 'txt':
      return 'document';
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'audio';
    case 'xls':
    case 'xlsx':
    case 'csv':
      return 'spreadsheet';
    case 'ppt':
    case 'pptx':
      return 'presentation';
    case 'pdf':
      return 'pdf';  
    default:
      return 'other';
  }
};

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const folderId = params.id as string;

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const { isConnected, address } = useAccount();
  const { data: folderFiles, isLoading: filesLoading, error: filesError } = useFiles(folderId, true);
  const { data: folderData, isLoading: folderDataLoading, error: folderDataError } = useFolderData(folderId);
  const { data: canRead, isLoading: canReadLoading } = useCanRead(folderId, address);

  // Prevent hydration mismatches by ensuring client-side rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Transform contract data to FileItem format
  const files: FileItem[] = folderFiles ? folderFiles.map(file => ({
    id: file.cid,
    name: file.filename,
    type: getFileTypeFromExtension(file.filename),
    folderType: "",
    modified: formatDate(file.timestamp),
    owner: file.owner,
    shared: false,
    cid: file.cid,
    tags: file.tags,
    encrypted: file.encrypted,
    dataToEncryptHash: file.dataToEncryptHash,
    fileType: file.fileType,
    tokenId: Array.isArray(params.id) ? params.id[0] : params.id, // Add tokenId so preview modal can fetch metadata
  })) : [];

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleFileClick = (folderId?: string, url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleBackToRoot = () => {
    router.push("/");
  };

  const isLoading = filesLoading || folderDataLoading;
  const hasError = filesError || folderDataError;

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

  // Check if user has access to this folder
  const isOwner = folderData?.owner?.toLowerCase() === address?.toLowerCase();
  const needsPayment = folderData?.isPublic && 
                      folderData?.viewingPrice && 
                      folderData.viewingPrice > BigInt(0) && 
                      !canRead &&
                      !isOwner;

  // Show payment required screen for paid folders without access
  if (!canReadLoading && needsPayment && folderData) {
    return (
      <div>
        <Header isFilePage={true} viewMode={viewMode} setViewMode={setViewMode} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[60vh]">
              <Lock className="w-20 h-20 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Payment Required</h3>
              <p className="text-gray-600 mb-1">
                This folder requires a one-time payment to access.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                After payment, you&apos;ll have permanent read access to all contents.
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg border max-w-md w-full mb-6">
                <div className="text-sm text-gray-600 mb-2">Dataset</div>
                <div className="text-lg font-semibold mb-4">{folderData.name}</div>
                <div className="text-sm text-gray-600 mb-1">Owner</div>
                <div className="font-mono text-sm text-gray-900 mb-4">
                  {folderData.owner.slice(0, 6)}...{folderData.owner.slice(-4)}
                </div>
              </div>

              <PayAccessDialog
                folderId={folderId}
                folderName={folderData.name}
                viewingPrice={folderData.viewingPrice}
                onSuccess={() => window.location.reload()}
              >
                <Button size="lg" className="min-w-[200px]">
                  Pay to Access
                </Button>
              </PayAccessDialog>
              
              <Button 
                variant="ghost" 
                className="mt-4"
                onClick={handleBackToRoot}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Drive
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Show access denied for private folders
  if (!canReadLoading && !canRead && !isOwner && folderData) {
    return (
      <div>
        <Header isFilePage={true} viewMode={viewMode} setViewMode={setViewMode} />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[60vh]">
              <Lock className="w-20 h-20 text-gray-400 mb-4" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-6">
                You don&apos;t have permission to access this folder.
              </p>
              <Button 
                onClick={handleBackToRoot}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Drive
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isFilePage={true} viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Upload Button - Always visible at the top */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Folder Content</h2>
              <div className="flex items-center space-x-2">
                <SearchDialog files={files}>
                  <Button
                    variant="outline"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </SearchDialog>
                <EmbeddingDialog folderId={folderId} files={files}>
                  <Button
                    variant="secondary"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Embed
                  </Button>
                </EmbeddingDialog>
                <UploadDialog folderId={folderId}>
                  <Button
                    className="bg-primary hover:bg-secondary text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </UploadDialog>
              </div>
            </div>
          </div>

          {/* Navigation breadcrumb */}
          <div className="p-4 border-b">
            <button
              onClick={handleBackToRoot}
              className="text-primary hover:text-secondary-foreground text-sm flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to My Drive
            </button>
            <h2 className="text-lg font-medium mt-2">
              {folderDataLoading
                ? "Loading folder..."
                : folderData?.name || `Folder ${folderId}`
              }
            </h2>
            {folderData && (
              <div className="text-sm text-gray-600 mt-1">
                <Badge className="capitalize">{folderData.folderType}</Badge>
                {folderData.isPublic && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Public
                  </span>
                )}
                <span className="ml-2">Created {formatDate(folderData.createdAt)}</span>
              </div>
            )}
          </div>

          {/* Error state */}
          {hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <p className="text-gray-600">
                  {filesError?.message || folderDataError?.message || "Something went wrong"}
                </p>
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
          {!isLoading && !hasError && (
            <>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Upload className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No files in this folder
                  </h3>
                  <p className="text-gray-600 mb-4">
                    This folder is empty. Upload files to get started.
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "grid" ? (
                    <FileGrid
                      files={files}
                      selectedFiles={selectedFiles}
                      onToggleSelection={toggleFileSelection}
                      onFolderClick={handleFileClick}
                      currentFolderId={Array.isArray(params.id) ? params.id[0] : params.id}
                    />
                  ) : (
                    <FileList
                      files={files}
                      selectedFiles={selectedFiles}
                      onToggleSelection={toggleFileSelection}
                      onFolderClick={handleFileClick}
                      currentFolderId={Array.isArray(params.id) ? params.id[0] : params.id}
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
