"use client";

import { useState } from "react";
import { Globe, Lock, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useSetFolderPublic } from "@/hooks/useContract";

interface MakePublicDialogProps {
  children: React.ReactNode;
  folderId: string;
  folderName: string;
  isCurrentlyPublic: boolean;
}

export default function MakePublicDialog({ 
  children, 
  folderId, 
  folderName, 
  isCurrentlyPublic 
}: MakePublicDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setFolderPublic = useSetFolderPublic();

  const handleTogglePublic = async () => {
    setIsSubmitting(true);
    try {
      await setFolderPublic.mutateAsync({
        tokenId: folderId,
        isPublic: !isCurrentlyPublic,
      });
      
      setOpen(false);
    } catch (error) {
      console.error("Error updating folder visibility:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isCurrentlyPublic ? (
              <>
                <Lock className="w-5 h-5" />
                Make Private
              </>
            ) : (
              <>
                <Globe className="w-5 h-5" />
                Make Public
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isCurrentlyPublic 
              ? `Make "${folderName}" private so only you and people you've shared it with can access it.`
              : `Make "${folderName}" public so anyone can view it.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Status */}
          <div className="bg-gray-50 p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium text-gray-900">Current Status</div>
            </div>
            <div className="flex items-center gap-2">
              {isCurrentlyPublic ? (
                <>
                  <Badge variant="default" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                  <span className="text-sm text-gray-600">Anyone can view this folder</span>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                  <span className="text-sm text-gray-600">Only you and shared users can view</span>
                </>
              )}
            </div>
          </div>

          {/* What will change */}
          <div className={`p-3 rounded-sm ${isCurrentlyPublic ? 'bg-orange-50' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {isCurrentlyPublic ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <Eye className="w-4 h-4 text-blue-600" />
              )}
              <span className={`text-sm font-medium ${isCurrentlyPublic ? 'text-orange-900' : 'text-blue-900'}`}>
                {isCurrentlyPublic ? 'Making this folder private will:' : 'Making this folder public will:'}
              </span>
            </div>
            <ul className={`text-sm space-y-1 ${isCurrentlyPublic ? 'text-orange-700' : 'text-blue-700'}`}>
              {isCurrentlyPublic ? (
                <>
                  <li>• Hide the folder from public discovery</li>
                  <li>• Restrict access to only you and shared users</li>
                  <li>• Remove it from public folder listings</li>
                </>
              ) : (
                <>
                  <li>• Allow anyone to view the folder and its content</li>
                  <li>• Make it discoverable in public folder listings</li>
                  <li>• Enable access without explicit sharing</li>
                </>
              )}
            </ul>
          </div>

          {/* New Status Preview */}
          <div className="bg-gray-50 p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm font-medium text-gray-900">After Change</div>
            </div>
            <div className="flex items-center gap-2">
              {!isCurrentlyPublic ? (
                <>
                  <Badge variant="default" className="text-xs">
                    <Globe className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                  <span className="text-sm text-gray-600">Anyone can view this folder</span>
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Private
                  </Badge>
                  <span className="text-sm text-gray-600">Only you and shared users can view</span>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTogglePublic}
              disabled={isSubmitting}
              variant={isCurrentlyPublic ? "destructive" : "default"}
            >
              {isSubmitting 
                ? (isCurrentlyPublic ? "Making Private..." : "Making Public...") 
                : (isCurrentlyPublic ? "Make Private" : "Make Public")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
