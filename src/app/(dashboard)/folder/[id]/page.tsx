"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Upload, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UploadDialog from "@/components/upload-dialog";
import Header from "@/components/header";
import FileGrid from "@/components/file-grid";
import FileList from "@/components/file-list";
import { useFiles, useFolderData } from "@/hooks/useContract";
import EmbeddingDialog from "@/components/embedding-dialog";
import SearchDialog from "@/components/search-dialog";
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

  const { isConnected } = useAccount();
  const { data: folderFiles, isLoading: filesLoading, error: filesError } = useFiles(folderId, true);
  const { data: folderData, isLoading: folderDataLoading, error: folderDataError } = useFolderData(folderId);

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
    starred: false,
    shared: false,
    cid: file.cid,
    tags: file.tags,
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="space-y-1">
                  {filesLoading && (
                    <p className="text-gray-600">Loading folder content...</p>
                  )}
                  {folderDataLoading && (
                    <p className="text-gray-600">Loading folder details...</p>
                  )}
                  {!filesLoading && !folderDataLoading && (
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
                    />
                  ) : (
                    <FileList
                      files={files}
                      selectedFiles={selectedFiles}
                      onToggleSelection={toggleFileSelection}
                      onFolderClick={handleFileClick}
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
