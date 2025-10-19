"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Tag, Search, Filter, FileText, Image as ImageIcon, Video, Archive, Code } from "lucide-react";
import { useSearchMyFilesByTag } from "@/hooks/useContract";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import FileGrid from "@/components/file-grid";
import FileList from "@/components/file-list";
import type { FileEntry } from "@/types";

// Convert FileEntry to FileItem format for compatibility with existing components
interface FileItem {
  id: string;
  name: string;
  folderType: string;
  type: "folder" | "document" | "image" | "video" | "pdf" | "audio" | "presentation" | "spreadsheet" | "other";
  size?: string;
  modified: string;
  owner: string;
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

const getFileTypeFromTags = (tags: string[]): FileItem['type'] => {
  if (tags.includes('images') || tags.includes('design')) return 'image';
  if (tags.includes('videos')) return 'video';
  if (tags.includes('documents') || tags.includes('pdf')) return 'document';
  if (tags.includes('audio')) return 'audio';
  if (tags.includes('presentations')) return 'presentation';
  if (tags.includes('spreadsheets')) return 'spreadsheet';
  return 'other';
};

const getTagIcon = (tag: string) => {
  if (['images', 'design'].includes(tag)) return <ImageIcon className="h-4 w-4" />;
  if (['videos', 'audio'].includes(tag)) return <Video className="h-4 w-4" />;
  if (['documents', 'spreadsheets', 'presentations', 'markup'].includes(tag)) return <FileText className="h-4 w-4" />;
  if (['code', 'web', 'notebooks', 'databases'].includes(tag)) return <Code className="h-4 w-4" />;
  if (['archives', 'binary', 'applications'].includes(tag)) return <Archive className="h-4 w-4" />;
  return <Tag className="h-4 w-4" />;
};

const getTagColor = (tag: string) => {
  if (['images', 'design'].includes(tag)) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (['videos', 'audio'].includes(tag)) return 'bg-purple-100 text-purple-700 border-purple-200';
  if (['documents', 'spreadsheets', 'presentations', 'markup'].includes(tag)) return 'bg-green-100 text-green-700 border-green-200';
  if (['code', 'web', 'notebooks', 'databases'].includes(tag)) return 'bg-red-100 text-red-700 border-red-200';
  if (['archives', 'binary', 'applications'].includes(tag)) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (['embeds'].includes(tag)) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function TaggedFilesPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const params = useParams();
  const { isConnected } = useAccount();

  // Get the tag from the URL and decode it
  const tag = decodeURIComponent(params.tag as string);

  // Search for files with this tag across all owned folders
  const { 
    data: searchResults, 
    isLoading: searchLoading, 
    error: searchError 
  } = useSearchMyFilesByTag(tag, !!tag && isConnected);

  // Convert FileEntry to FileItem format
  const files: FileItem[] = useMemo(() => {
    if (!searchResults) return [];
    
    return searchResults
      .filter(file => {
        // Apply search filter if query exists
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
          file.filename.toLowerCase().includes(query) ||
          file.tags.some(tag => tag.toLowerCase().includes(query))
        );
      })
      .map((file: FileEntry) => ({
        id: file.cid,
        name: file.filename,
        folderType: "file",
        type: getFileTypeFromTags(file.tags),
        modified: formatDate(file.timestamp),
        owner: file.owner,
        shared: false,
        cid: file.cid,
        tags: file.tags,
        encrypted: file.encrypted,
        dataToEncryptHash: file.dataToEncryptHash,
        fileType: file.fileType,
      }));
  }, [searchResults, searchQuery]);

  // Get all unique tags from the results for filtering
  const allTags = useMemo(() => {
    if (!searchResults) return [];
    const tagSet = new Set<string>();
    searchResults.forEach(file => {
      file.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [searchResults]);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleFileClick = (url?: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-medium mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">Please connect your wallet to search your files.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isFilePage={true} viewMode={viewMode} setViewMode={setViewMode} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header with back button and tag info */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackClick}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-2">
                {getTagIcon(tag)}
                <h1 className="text-xl font-medium">Files tagged with</h1>
                <Badge 
                  variant="outline" 
                  className={`${getTagColor(tag)} text-sm font-medium`}
                >
                  {tag}
                </Badge>
              </div>
            </div>

            {/* Search and filter bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search within tagged files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="secondary" className="whitespace-nowrap">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </Badge>
            </div>
          </div>

          {/* Related tags */}
          {allTags.length > 1 && (
            <div className="p-4 border-b bg-background">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Related tags:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags
                  .filter(t => t !== tag) // Don't show the current tag
                  .slice(0, 10) // Limit to 10 tags
                  .map((relatedTag) => (
                    <Button
                      key={relatedTag}
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/tagged/${encodeURIComponent(relatedTag)}`)}
                      className={`${getTagColor(relatedTag)} border text-xs hover:opacity-80`}
                    >
                      {getTagIcon(relatedTag)}
                      <span className="ml-1">{relatedTag}</span>
                    </Button>
                  ))}
                {allTags.length > 11 && (
                  <Badge variant="outline" className="text-xs">
                    +{allTags.length - 11} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Loading state */}
          {searchLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Searching files with tag &ldquo;{tag}&rdquo;...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {searchError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <p className="text-gray-600">
                  Failed to search files: {searchError.message}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()} 
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Results */}
          {!searchLoading && !searchError && (
            <>
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Tag className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No files found with tag &ldquo;{tag}&rdquo;
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery 
                      ? `No files match your search criteria within this tag.`
                      : `You don't have any files tagged with "${tag}" yet.`
                    }
                  </p>
                  <Button onClick={handleBackClick} variant="outline">
                    Go Back
                  </Button>
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
