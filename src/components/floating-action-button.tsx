"use client";

import { useState } from "react";
import { Plus, Upload, FolderPlus, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import UploadDialog from "./upload-dialog";

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Upload,
      label: "Upload files",
      action: "upload",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      icon: FolderPlus,
      label: "New folder",
      action: "folder",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      icon: FileText,
      label: "New document",
      action: "document", 
      color: "bg-purple-600 hover:bg-purple-700",
    },
  ];

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Action Buttons */}
        <div className={`flex flex-col gap-3 mb-4 transition-all duration-300 ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}>
          {actions.map((action, index) => {
            if (action.action === "upload") {
              return (
                <UploadDialog key={action.action}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className={`w-12 h-12 rounded-full shadow-lg ${action.color} text-white transition-all duration-200 hover:scale-110`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <action.icon className="w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>{action.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </UploadDialog>
              );
            }
            
            return (
              <Tooltip key={action.action}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    className={`w-12 h-12 rounded-full shadow-lg ${action.color} text-white transition-all duration-200 hover:scale-110`}
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                    onClick={() => {
                      console.log(`${action.action} clicked`);
                      setIsOpen(false);
                    }}
                  >
                    <action.icon className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{action.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Main FAB */}
        <Button
          size="lg"
          className={`w-16 h-16 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 ${
            isOpen ? "rotate-45" : "rotate-0"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </Button>
      </div>
    </TooltipProvider>
  );
}
