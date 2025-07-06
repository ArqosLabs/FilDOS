"use client";

import { Search, HelpCircle, Grid3X3, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  isFilePage: boolean;
  viewMode?: "grid" | "list";
  setViewMode?: (mode: "grid" | "list") => void;
}

export default function Header({ isFilePage, viewMode, setViewMode }: HeaderProps) {
  return (
    <div className="flex border-b border-gray-200 bg-white justify-end p-2">
      {/* Search Bar */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search in Drive"
            className="pl-10 bg-gray-50 border-0 w-xl focus:bg-white focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* View Mode Toggle */}
        {isFilePage && setViewMode && (
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        )}

        <Button variant="ghost" size="sm">
          <HelpCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
