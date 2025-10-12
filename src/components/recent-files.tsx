"use client";

import { Clock, FileText, Image, Video, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";

const recentFiles = [
  {
    id: "recent1",
    name: "Budget Report 2024.xlsx",
    type: "document",
    time: "2 hours ago",
    icon: FileText,
  },
  {
    id: "recent2", 
    name: "Team Photos",
    type: "folder",
    time: "5 hours ago",
    icon: Folder,
  },
  {
    id: "recent3",
    name: "presentation-final.pdf",
    type: "document", 
    time: "Yesterday",
    icon: FileText,
  },
  {
    id: "recent4",
    name: "vacation-video.mp4",
    type: "video",
    time: "2 days ago", 
    icon: Video,
  },
  {
    id: "recent5",
    name: "screenshot.png",
    type: "image",
    time: "3 days ago",
    icon: Image,
  },
];

export default function RecentFiles() {
  return (
    <div className="bg-background border border-gray-200 rounded-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-500" />
        <h3 className="font-medium text-gray-900">Recent</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {recentFiles.map((file) => {
          const Icon = file.icon;
          return (
            <Button
              key={file.id}
              variant="ghost"
              className="h-auto p-3 flex flex-col items-start space-y-2 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 w-full">
                <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </span>
              </div>
              <span className="text-xs text-gray-500 self-start">
                {file.time}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
