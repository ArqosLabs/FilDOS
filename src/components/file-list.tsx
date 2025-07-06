"use client";

import {
  Folder,
  FileText,
  Image,
  Video,
  FileType,
  MoreVertical,
  Share,
  Globe,
  Info,
  Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileItem } from "@/app/dashboard/page";
import ShareFolderDialog from "@/components/share-folder-dialog";
import MakePublicDialog from "@/components/make-public-dialog";
import DetailsModal from "@/components/details-modal";

interface FileListProps {
  files: FileItem[];
  selectedFiles: string[];
  onToggleSelection: (fileId: string) => void;
  onFolderClick?: (folderId?: string, url?: string) => void;
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
    case "embed":
      return Brain;
    default:
      return FileType;
  }
};

const getFileColor = (type: FileItem["type"]) => {
  switch (type) {
    case "folder":
      return "text-blue-600";
    case "document":
      return "text-blue-500";
    case "image":
      return "text-green-500";
    case "video":
      return "text-red-500";
    case "pdf":
      return "text-red-600";
    case "embed":
      return "text-purple-500";
    default:
      return "text-gray-500";
  }
};

export default function FileList({ files, selectedFiles, onToggleSelection, onFolderClick }: FileListProps) {
  const allSelected = files.length > 0 && selectedFiles.length === files.length;

  const handleSelectAll = () => {
    if (allSelected) {
      files.forEach(file => {
        if (selectedFiles.includes(file.id)) {
          onToggleSelection(file.id);
        }
      });
    } else {
      files.forEach(file => {
        if (!selectedFiles.includes(file.id)) {
          onToggleSelection(file.id);
        }
      });
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-32">Owner</TableHead>
                <TableHead className="w-32">Last modified</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => {
                const Icon = getFileIcon(file.type);
                const isSelected = selectedFiles.includes(file.id);

                return (
                  <TableRow
                    key={file.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      isSelected ? "bg-blue-50" : ""
                    } ${file.type === "embed" ? "opacity-40" : ""}`}
                    onClick={() => onToggleSelection(file.id)}
                    onDoubleClick={() => {
                      if (file.type === "folder" && onFolderClick && file.tokenId) {
                        onFolderClick(file.tokenId);
                      } else if (file.type !== "folder" && onFolderClick && file.cid) {
                        onFolderClick(undefined, `https://${file.owner}.calibration.filcdn.io/${file.cid}`);
                      }
                    }}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(file.id)}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Icon className={`w-5 h-5 ${getFileColor(file.type)}`} />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{file.name}</span>
                        {file.shared && (
                          <Badge variant="secondary" className="text-xs">
                            <Share className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {file.owner.slice(0, 6) + "..." + file.owner.slice(-4)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {file.modified}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <DetailsModal file={file}>
                              <div className="flex items-center cursor-pointer p-1 font-light">
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
                                  <div className="flex items-center cursor-pointer p-1 font-light">
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
                                  <div className="flex items-center cursor-pointer p-1 font-light">
                                    <Globe className="w-4 h-4 mr-2" />
                                    {file.shared ? "Make Private" : "Make Public"}
                                  </div>
                                </MakePublicDialog>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
