"use client";

import {
  MoreVertical,
  Share,
  Globe,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { FileItem } from "@/app/(dashboard)/page";
import ShareFolderDialog from "@/components/share-folder-dialog";
import MakePublicDialog from "@/components/make-public-dialog";
import DetailsModal from "@/components/details-modal";
import FilePreviewModal from "@/components/preview-modal";
import { useState } from "react";
import Image from "next/image";

interface FileGridProps {
  files: FileItem[];
  selectedFiles: string[];
  onToggleSelection: (fileId: string) => void;
  onFolderClick?: (folderId?: string, url?: string) => void;
}

const getFileLogo = (type: FileItem["type"]) => {
  switch (type) {
    case "folder":
      return "/logos/folder.png";
    case "document":
      return "/logos/document.png";
    case "image":
      return "/logos/image.png";
    case "video":
      return "/logos/video.png";
    case "pdf":
      return "/logos/pdf.png";
    case "audio":
      return "/logos/audio.png";
    case "presentation":
      return "/logos/presentation.png";
    case "spreadsheet":
      return "/logos/spreadsheet.png";
    default:
      return "/logos/other.png";
  }
};


export default function FileGrid({ files, selectedFiles, onToggleSelection, onFolderClick }: FileGridProps) {
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleFileClick = (file: FileItem) => {
    if (file.type === "folder" && onFolderClick && file.tokenId) {
      onFolderClick(file.tokenId);
    } else if (file.type !== "folder") {
      setPreviewFile(file);
      setIsPreviewOpen(true);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((file) => {
            const logoSrc = getFileLogo(file.type);
            const isSelected = selectedFiles.includes(file.id);

            return (
              <div
                key={file.id}
                className={`group relative bg-background border border-gray-200 rounded-md p-4 hover:shadow-sm transition-all cursor-pointer select-none ${
                  isSelected ? "ring-2 ring-primary bg-blue-50" : ""
                }`}
                onClick={() => onToggleSelection(file.id)}
                onDoubleClick={() => handleFileClick(file)}
              >
                {/* File Icon */}
                <div className="flex flex-col items-center text-center">
                  <Image 
                    src={logoSrc} 
                    alt={file.type} 
                    width={48} 
                    height={48} 
                    className="mb-3"
                  />

                  {/* File Name */}
                  <h3 className="text-sm font-base text-black truncate w-full mb-1">
                    {file.name}
                  </h3>

                  {/* File Info */}
                  <div className="text-xs text-gray-400 space-y-1">
                    {file.size && <div>{file.size}</div>}
                    <div>{file.modified}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <DetailsModal file={file}>
                          <div className="flex items-center cursor-pointer font-light p-1">
                            <Info className="w-4 h-4 mr-2" />
                            Details
                          </div>
                        </DetailsModal>
                      </DropdownMenuItem>
                      {file.type === "folder" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <ShareFolderDialog
                              folderId={file.tokenId || file.id}
                              folderName={file.name}
                            >
                              <div className="flex items-center cursor-pointer font-light p-1">
                                <Share className="w-4 h-4 mr-2" />
                                Share
                              </div>
                            </ShareFolderDialog>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <MakePublicDialog
                              folderId={file.tokenId || file.id}
                              folderName={file.name}
                              isCurrentlyPublic={file.shared}
                            >
                              <div className="flex items-center cursor-pointer font-light p-1">
                                <Globe className="w-4 h-4 mr-2" />
                                {file.shared ? "Make Private" : "Make Public"}
                              </div>
                            </MakePublicDialog>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-background rounded-full"></div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>
      
      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewFile(null);
        }}
      />
    </div>
  );
}
