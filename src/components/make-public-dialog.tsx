"use client";

import { useState } from "react";
import { Globe, Lock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  const [isFree, setIsFree] = useState(true);
  const [viewingPrice, setViewingPrice] = useState("");

  const setFolderPublic = useSetFolderPublic();

  const handleTogglePublic = async () => {
    if (!isCurrentlyPublic && !isFree && (!viewingPrice || parseFloat(viewingPrice) <= 0)) {
      alert("Please enter a valid viewing price or toggle free access");
      return;
    }

    setIsSubmitting(true);
    try {
      // Calculate price in USDFC (6 decimals)
      const priceInUSDFC = (!isCurrentlyPublic && !isFree) 
        ? BigInt(Math.floor(parseFloat(viewingPrice) * 1_000_000))
        : BigInt(0);

      // Set folder public/private with viewing price in one transaction
      await setFolderPublic.mutateAsync({
        tokenId: folderId,
        isPublic: !isCurrentlyPublic,
        viewingPrice: priceInUSDFC,
      });
      
      setOpen(false);
      setIsFree(true);
      setViewingPrice("");
    } catch (error) {
      console.error("Error updating folder visibility:", error);
      alert("Failed to update folder settings. Please try again.");
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
                  <span className="text-xs text-gray-600">Anyone can view this folder on marketplace</span>
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

          {/* Pricing Options - Only show when making public */}
          {!isCurrentlyPublic && (
            <div className="bg-gray-50 p-4 rounded-sm space-y-3">
              <div className="text-sm font-medium text-gray-900">Access Settings</div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="free-access" className="text-sm font-normal">
                    Free Access
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    {isFree ? "Anyone can view for free" : "Viewers must pay to access"}
                  </div>
                </div>
                <Switch
                  id="free-access"
                  checked={isFree}
                  onCheckedChange={setIsFree}
                />
              </div>

              {!isFree && (
                <div className="space-y-2">
                  <Input
                    id="viewing-price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={viewingPrice}
                    onChange={(e) => setViewingPrice(e.target.value)}
                    placeholder="Enter price in USDFC"
                    required={!isFree}
                  />
                </div>
              )}
            </div>
          )}

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
                  <span className="text-xs text-gray-600">Anyone can view this folder on marketplace</span>
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
