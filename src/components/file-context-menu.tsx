"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Share,
  Download,
  Edit3,
  Copy,
  Trash2,
  Star,
  FolderOpen,
  Eye,
} from "lucide-react";

interface FileContextMenuProps {
  children: React.ReactNode;
  file: {
    id: string;
    name: string;
    type: string;
    starred: boolean;
  };
  onToggleStar: (fileId: string) => void;
}

export default function FileContextMenu({ children, file, onToggleStar }: FileContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>
          <Eye className="w-4 h-4 mr-2" />
          Preview
        </ContextMenuItem>
        {file.type === "folder" && (
          <ContextMenuItem>
            <FolderOpen className="w-4 h-4 mr-2" />
            Open
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Share className="w-4 h-4 mr-2" />
          Share
        </ContextMenuItem>
        <ContextMenuItem>
          <Download className="w-4 h-4 mr-2" />
          Download
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Edit3 className="w-4 h-4 mr-2" />
          Rename
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy className="w-4 h-4 mr-2" />
          Make a copy
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onToggleStar(file.id)}>
          <Star 
            className={`w-4 h-4 mr-2 ${
              file.starred ? "text-yellow-500 fill-yellow-500" : ""
            }`} 
          />
          {file.starred ? "Remove from starred" : "Add to starred"}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Move to trash
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
