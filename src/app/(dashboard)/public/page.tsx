"use client";

import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { Store, User, Calendar } from "lucide-react";
import { usePublicFolders } from "@/hooks/useContract";
import { useFolderList } from "@/hooks/useFolderList";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const formatDate = (timestamp: bigint) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const formatPrice = (price: bigint) => {
  // USDFC has 6 decimals
  const priceInUSDFC = Number(price) / 1_000_000;
  return priceInUSDFC.toFixed(2);
};  

export default function Marketplace() {
  const router = useRouter();

  const { isConnected } = useAccount();
  const { data: publicFolders, isLoading: foldersLoading, error: foldersError } = usePublicFolders();
  const { folderDataMap, isLoading: folderDataLoading, hasError: folderDataError } = useFolderList(publicFolders || []);

  const handleFolderClick = (folderId: string) => {
    router.push(`/folder/${folderId}`);
  };

  const isLoading = foldersLoading || folderDataLoading;
  const hasError = foldersError || folderDataError;

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-medium mb-2">Data Marketplace</h2>
          <p className="text-gray-600">Please connect your wallet to browse public folders.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header isFilePage={true} viewMode="grid" setViewMode={() => {}} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                <h2 className="text-lg font-medium">Data Marketplace</h2>
              </div>
              <div className="text-sm text-gray-600">
                {publicFolders?.length || 0} folder{(publicFolders?.length || 0) !== 1 ? 's' : ''} available
              </div>
            </div>
          </div>

          {/* Error state */}
          {hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <p className="text-gray-600">
                  {foldersError?.message || "Something went wrong loading the marketplace"}
                </p>
              </div>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && !hasError && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">Loading marketplace...</p>
              </div>
            </div>
          )}

          {/* Marketplace Grid */}
          {!isLoading && !hasError && (
            <>
              {(publicFolders?.length || 0) === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Store className="w-16 h-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No folders available yet</h3>
                  <p className="text-gray-600 mb-4">
                    Public folders will appear here when they become available.
                  </p>
                  <p className="text-sm text-gray-500">
                    Create folders and make them public to share with the community.
                  </p>
                </div>
              ) : (
                <div className="p-6 overflow-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(publicFolders || []).map((tokenId: string) => {
                      const folderData = folderDataMap.get(tokenId);
                      const isFree = !folderData?.viewingPrice || folderData.viewingPrice === BigInt(0);
                      
                      return (
                        <Card 
                          key={tokenId}
                          className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                          onClick={() => handleFolderClick(tokenId)}
                        >
                          {/* Card Header */}
                          <div className="bg-gray-50 p-4 border-b">
                            <h3 className="font-medium text-md line-clamp-1">
                              {folderData?.name || `Dataset ${tokenId}`}
                            </h3>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 space-y-3">
                            {/* Price */}
                            
                              <div className="flex items-center justify-between p-2 bg-gray-50 rounded-sm">
                                <span className="text-xs font-medium text-gray-600">Price</span>
                                <div className="flex items-center gap-1 text-gray-900 font-base text-sm">
                                  <span>{!isFree ? `${formatPrice(folderData?.viewingPrice || BigInt(0))} USDFC` : "Free"}</span>
                                </div>
                              </div>

                            {/* Metadata */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate font-mono">
                                  {folderData?.owner ? 
                                    `${folderData.owner.slice(0, 6)}...${folderData.owner.slice(-4)}` : 
                                    "Unknown"
                                  }
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  {folderData?.createdAt ? 
                                    formatDate(folderData.createdAt) : 
                                    "Unknown"
                                  }
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button 
                              className="w-full mt-3 text-sm h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFolderClick(tokenId);
                              }}
                            >
                              View Folder
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
