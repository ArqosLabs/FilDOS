"use client";

import { 
  Folder, 
  FileText, 
  Image, 
  Video, 
  FileType,
  MoreVertical,
  Share,
  Download,
  Trash2,
  Edit3
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
import { FileItem } from "./my-drive";
import FileContextMenu from "./file-context-menu";

interface FileGridProps {
  files: FileItem[];
  selectedFiles: string[];
  onToggleSelection: (fileId: string) => void;
  onFolderClick?: (folderId: string) => void;
}

const getFileIcon = (type: FileItem["type"]) => {
  switch (type) {
    case "folder":
      return Folder;
    case "document":
      return FileText;
    case "image":
      return Image;
    case "video":
      return Video;
    case "pdf":
      return FileType;
    default:
      return FileType;
  }
};


export default function FileGrid({ files, selectedFiles, onToggleSelection, onFolderClick }: FileGridProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {files.map((file) => {
            const Icon = getFileIcon(file.type);
            const isSelected = selectedFiles.includes(file.id);
            
            return (
              <FileContextMenu
                key={file.id}
                file={file}
              >
                <div
                  className={`group relative bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                    isSelected ? "ring-2 ring-primary bg-blue-50" : ""
                  }`}
                  onClick={() => onToggleSelection(file.id)}
                  onDoubleClick={() => {
                    if (file.type === "folder" && onFolderClick && file.tokenId) {
                      onFolderClick(file.tokenId);
                    }
                  }}
                >
                {/* File Icon */}
                <div className="flex flex-col items-center text-center">
                  <Icon className={`w-12 h-12 mb-3 text-primary`} />
                  
                  {/* File Name */}
                  <h3 className="text-sm font-medium text-gray-900 truncate w-full mb-1">
                    {file.name}
                  </h3>
                  
                  {/* File Info */}
                  <div className="text-xs text-gray-500 space-y-1">
                    {file.size && <div>{file.size}</div>}
                    <div>{file.modified}</div>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-1 mt-2">
                    {file.shared && (
                      <Badge variant="secondary" className="text-xs">
                        <Share className="w-3 h-3 mr-1" />
                        Shared
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Move to trash
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}

              </div>
              </FileContextMenu>
            );
          })}
        </div>
      </div>
    </div>
  );
}
