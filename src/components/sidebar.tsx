"use client";

import { useState, useEffect } from "react";
import {
  HardDrive,
  Users,
  Cloud,
  FileText,
  Image,
  Video,
  FileArchive,
  Scale,
  RefreshCw,
  Loader2,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useBalances } from "@/hooks/useBalances";
import { Progress } from "./ui/progress";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

const sidebarItems = [
  { icon: HardDrive, label: "My Drive", route: null },
  { icon: Users, label: "Shared with me", route: "shared" },
  { icon: Store, label: "Data Marketplace", route: "public" },
  // { icon: Trash2, label: "Trash", route: "trash" },
  { icon: Scale, label: "My Data Sets", route: "data-sets" }
];

const fileTypes = [
  { icon: FileText, label: "Documents", route: "tagged/documents" },
  { icon: Image, label: "Images", route: "tagged/images" },
  { icon: Video, label: "Videos", route: "tagged/videos" },
  { icon: FileArchive, label: "Archives", route: "tagged/archives" }
];

export default function Sidebar() {
  const segment = useSelectedLayoutSegment();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsCollapsed(window.innerWidth < 640);
      setIsMobile(window.innerWidth < 640);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const {
    data,
    isLoading: isBalanceLoading,
    refetch,
    isRefetching,
  } = useBalances();
  const balances = data;

  const storageUsagePercent = balances?.currentRateAllowanceGB
    ? (balances.currentStorageGB / balances.currentRateAllowanceGB) * 100
    : 0;

  return (
    <aside 
      className={`bg-background border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out relative ${
        isCollapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-3 top-6 z-10 bg-background border border-sidebar-border rounded-full p-1 hover:bg-sidebar-accent transition-colors shadow-sm ${isMobile ? "hidden" : ""}`}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <div className="p-4 flex-1 overflow-hidden">
        {/* Navigation Items */}
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = segment === (item.route || "(root)" );
            const href = item.route ? `/${item.route}` : '/';
            
            return (
              <Link key={item.label} href={href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-10 transition-all ${
                    isCollapsed ? "px-2" : "px-3"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={`w-4 h-4 ${isCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                  <span 
                    className={`flex-1 text-left transition-all duration-300 ${
                      isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Storage Section */}
        <div className="space-y-1">
            <Link href="/storage">
              <Button
                variant={segment === "storage" ? "default" : "ghost"}
                className={`w-full justify-start h-10 transition-all ${
                  isCollapsed ? "px-2" : "px-3"
                }`}
                title={isCollapsed ? "Storage" : undefined}
              >
                <Cloud className={`w-4 h-4 ${isCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                <span 
                  className={`flex-1 text-left transition-all duration-300 ${
                    isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                  }`}
                >
                  Storage
                </span>
              </Button>
            </Link>

          {/* Storage Usage */}
          {!isCollapsed && (
          <div className="px-3 py-2">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {isBalanceLoading ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    `${balances?.currentStorageGB?.toLocaleString()} GB of ${balances?.currentRateAllowanceGB?.toLocaleString()} GB used`
                  )}
                </span>
                <button
                  onClick={() => refetch()}
                  disabled={isBalanceLoading || isRefetching}
                  className="p-1 hover:bg-sidebar-accent rounded disabled:opacity-50 disabled:cursor-none transition-colors"
                  title="Refresh storage data"
                >
                  <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {!isBalanceLoading && (
                <Progress value={storageUsagePercent} className="h-2" />
              )}
              <p className="text-xs text-muted-foreground">
                {isBalanceLoading ? "..." : `${storageUsagePercent.toFixed(1)}% of allocated storage used`}
              </p>
            </div>
          </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* File Types */}
        <div className="space-y-1">
          {!isCollapsed && (
          <div className="px-3 py-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">File Types</h3>
          </div>
          )}
          {fileTypes.map((item) => {
            const isActive = segment === item.route;
            const href = `/${item.route}`;
            
            return (
              <Link key={item.label} href={href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-9 text-sm transition-all ${
                    isCollapsed ? "px-2" : "px-3"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={`w-4 h-4 ${isCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                  <span 
                    className={`flex-1 text-left transition-all duration-300 ${
                      isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-auto opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
