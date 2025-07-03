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
  FileArchive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useBalances } from "@/hooks/useBalances";
import { Progress } from "./ui/progress";
import Link from "next/link";

const sidebarItems = [
  { icon: HardDrive, label: "My Drive", count: null, active: true },
  { icon: Users, label: "Shared with me", count: 3, active: false },
  { icon: Clock, label: "Recent", count: null, active: false },
  { icon: Star, label: "Starred", count: 2, active: false },
  { icon: Trash2, label: "Trash", count: null, active: false },
];

const fileTypes = [
  { icon: FileText, label: "Documents", count: 12, active: false },
  { icon: Image, label: "Images", count: 45, active: false },
  { icon: Video, label: "Videos", count: 8, active: false },
  { icon: FileArchive, label: "Archives", count: 3, active: false },
];

export default function Sidebar() {

  const {
    data,
    isLoading: isBalanceLoading,
  } = useBalances();
  const balances = data;

  const storageUsagePercent = balances?.currentRateAllowanceGB
    ? (balances.currentStorageGB / balances.currentRateAllowanceGB) * 100
    : 0;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 flex-1">
        {/* Navigation Items */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Button
              key={item.label}
              variant={item.active ? "default" : "ghost"}
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
            <Link href="/dashboard/storage">
              <Button
                variant="ghost"
                className="w-full justify-start h-10 px-3"
              >
                <Cloud className="w-4 h-4 mr-3" />
                <span className="flex-1 text-left">Storage</span>
              </Button>
            </Link>

          {/* Storage Usage */}
          <div className="px-3 py-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {isBalanceLoading ? "..." : `${balances?.currentStorageGB?.toLocaleString()} GB of ${balances?.currentRateAllowanceGB?.toLocaleString()} GB used`}
                </span>
              </div>
              {!isBalanceLoading && (
                <Progress value={storageUsagePercent} className="h-2" />
              )}
              <p className="text-xs text-muted-foreground">
                {isBalanceLoading ? "..." : `${storageUsagePercent.toFixed(1)}% of allocated storage used`}
              </p>
            </div>
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
