"use client";

import { 
  Folder, 
  FileText, 
  Image, 
  Video, 
  FileType,
  Star,
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
import { FileItem } from "./my-drive";

interface FileListProps {
  files: FileItem[];
  selectedFiles: string[];
  onToggleStar: (fileId: string) => void;
  onToggleSelection: (fileId: string) => void;
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
    default:
      return "text-gray-500";
  }
};

export default function FileList({ files, selectedFiles, onToggleStar, onToggleSelection }: FileListProps) {
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Drive</h2>
        
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
                <TableHead className="w-24">Size</TableHead>
                <TableHead className="w-12"></TableHead>
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
                    }`}
                    onClick={() => onToggleSelection(file.id)}
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
                      {file.owner === "me" ? "me" : file.owner}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {file.modified}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {file.size || "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(file.id);
                        }}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            file.starred ? "text-yellow-500 fill-yellow-500" : "text-gray-400"
                          }`}
                        />
                      </Button>
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
