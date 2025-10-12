"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { AlertCircle, Search, Loader2, FileText, Image as ImageIcon } from "lucide-react";
import { useAI, SearchResult } from "@/hooks/useAI";
import { FileItem } from "@/app/(dashboard)/page";
import { Card, CardContent } from "./ui/card";

interface SearchDialogProps {
  children: React.ReactNode;
  files: FileItem[];
}

export default function SearchDialog({ children, files }: SearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const {
    searchEmbeddings,
    isSearching,
    searchResults,
    searchStatus,
    searchError,
    resetSearch,
    isServerHealthy,
    serverHealthError,
  } = useAI();

const latestEmbedFile = useMemo(() => {
    const embedFiles = files.filter(file => file.type === 'embed');
    if (embedFiles.length === 0) return null;
    
    return embedFiles.sort((a: FileItem, b: FileItem) => {
        return b.name.localeCompare(a.name);
    })[0];
}, [files]);

  // Construct the embed file URL
  const embedFileUrl = latestEmbedFile 
    ? `https://${latestEmbedFile.owner}.calibration.filcdn.io/${latestEmbedFile.cid}`
    : null;
    

  const handleSearch = async () => {
    if (!query.trim() || !embedFileUrl) return;

    searchEmbeddings({
      query: query.trim(),
      embed_file_url: embedFileUrl
    });
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setQuery("");
      resetSearch();
    }, 300);
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'image':
        return ImageIcon;
      case 'text':
        return FileText;
      default:
        return FileText;
    }
  };

  const handleResultClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const canSearch = isServerHealthy && latestEmbedFile && query.trim();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Semantic Search
          </DialogTitle>
          <DialogDescription>
            Search through your folder files using natural language
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {/* Server and Embed File Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">AI Server Status:</div>
                <Badge variant={isServerHealthy ? 'default' : 'destructive'}>
                  {isServerHealthy ? 'Healthy' : 'Offline'}
                </Badge>
              </div>
              {serverHealthError && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>

            <div className="p-3 rounded-md border">
              {latestEmbedFile ? (
                <div className="space-y-1">
                  <div className="text-sm text-primary">
                    Found: {latestEmbedFile.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Created: {latestEmbedFile.modified}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-orange-700">
                  ⚠️ No embedding files found. Create embeddings first.
                </div>
              )}
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="Search for files (e.g., 'documents about cats', 'red car images', 'contract files')"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && canSearch && handleSearch()}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSearch}
                disabled={!canSearch || isSearching}
                className="flex-1"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetSearch}>
                Clear
              </Button>
            </div>
          </div>

          {/* Search Status */}
          {searchStatus && (
            <div className="p-3 bg-muted rounded">
              <p className="text-sm">{searchStatus}</p>
            </div>
          )}

          {/* Search Error */}
          {searchError && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                {searchError.message}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults && searchResults.results.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Search Results ({searchResults.results.length})
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {searchResults.total_embeddings} files indexed
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {searchResults.results.map((result, index) => {
                  const ResultIcon = getResultIcon(result.type);
                  return (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => handleResultClick(result.url)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <ResultIcon className={`w-5 h-5 ${
                              result.type === 'image' ? 'text-green-500' : 'text-blue-500'
                            }`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium truncate">
                                {result.filename}
                              </span>
                              <Badge 
                                variant="secondary"
                                className="text-xs"
                              >
                                {result.type}
                              </Badge>
                              <Badge className="text-xs">
                                {(result.score * 100).toFixed(1)}%
                              </Badge>
                            </div>
                            
                            {result.excerpt && (
                              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {result.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchResults && searchResults.results.length === 0 && (
            <div className="text-center p-6 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No results found for `${searchResults.query}`</p>
              <p className="text-xs mt-1">Try different keywords or check your embeddings</p>
            </div>
          )}

          {/* Helper Text */}
          {!latestEmbedFile && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <div className="font-medium mb-1">No embeddings found</div>
                  <div>Create embeddings first using the Embed button to enable semantic search.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
