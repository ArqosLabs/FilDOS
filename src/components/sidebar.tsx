"use client";

import { 
  HardDrive, 
  Star, 
  Clock, 
  Users, 
  Trash2, 
  Cloud,
  FileText,
  Image,
  Video,
  FileArchive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const sidebarItems = [
  { icon: HardDrive, label: "My Drive", count: null, active: true },
  { icon: Users, label: "Shared with me", count: 3, active: false },
  { icon: Clock, label: "Recent", count: null, active: false },
  { icon: Star, label: "Starred", count: 2, active: false },
  { icon: Trash2, label: "Trash", count: null, active: false },
];

const storageItems = [
  { icon: Cloud, label: "Storage", count: null, active: false },
];

const fileTypes = [
  { icon: FileText, label: "Documents", count: 12, active: false },
  { icon: Image, label: "Images", count: 45, active: false },
  { icon: Video, label: "Videos", count: 8, active: false },
  { icon: FileArchive, label: "Archives", count: 3, active: false },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 flex-1">
        {/* Navigation Items */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "secondary" : "ghost"}
              className="w-full justify-start h-10 px-3"
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count && (
                <Badge variant="secondary" className="ml-auto">
                  {item.count}
                </Badge>
              )}
            </Button>
          ))}
        </nav>

        <Separator className="my-4" />

        {/* Storage Section */}
        <div className="space-y-1">
          {storageItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start h-10 px-3"
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
            </Button>
          ))}
          
          {/* Storage Usage */}
          <div className="px-3 py-2">
            <div className="text-xs text-gray-500 mb-2">15 GB of 100 GB used</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: "15%" }}></div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-3 text-xs">
              Buy storage
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* File Types */}
        <div className="space-y-1">
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">File Types</h3>
          </div>
          {fileTypes.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="w-full justify-start h-9 px-3 text-sm"
            >
              <item.icon className="w-4 h-4 mr-3" />
              <span className="flex-1 text-left">{item.label}</span>
              <span className="text-xs text-gray-400">{item.count}</span>
            </Button>
          ))}
        </div>
      </div>
    </aside>
  );
}
