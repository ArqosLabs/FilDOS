"use client";

import { Search, HelpCircle, Grid3X3, List, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import UploadDialog from "./upload-dialog";

interface HeaderProps {
  isFilePage: boolean;
  viewMode?: "grid" | "list";
  setViewMode?: (mode: "grid" | "list") => void;
}

export default function Header({ isFilePage, viewMode, setViewMode }: HeaderProps) {
  return (
    <TooltipProvider>
      <header className="flex border-b border-gray-200 bg-white justify-end">
        <div className="flex items-center px-4 py-3 gap-4">

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-4">
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
            {/* Upload Button */}
            <UploadDialog>
              <Button className="bg-primary hover:bg-secondary text-white">
                <Upload className="w-4 h-4 mr-2" />
                New
              </Button>
            </UploadDialog>

            {/* View Mode Toggle */}
            {isFilePage && setViewMode && (
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid view</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="rounded-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List view</TooltipContent>
              </Tooltip>
            </div>
            )}

            {/* Help */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Help</TooltipContent>
            </Tooltip>
         
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
