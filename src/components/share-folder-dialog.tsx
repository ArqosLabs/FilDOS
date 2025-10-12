"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Share, Users, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useShareFolder } from "@/hooks/useContract";

interface ShareFolderDialogProps {
  children: React.ReactNode;
  folderId: string;
  folderName: string;
}

export default function ShareFolderDialog({ children, folderId, folderName }: ShareFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [granteeAddress, setGranteeAddress] = useState("");
  const [canRead, setCanRead] = useState(true);
  const [canWrite, setCanWrite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address } = useAccount();
  const shareFolder = useShareFolder();

  const handleShare = async () => {
    if (!granteeAddress.trim()) {
      alert("Please enter a valid wallet address");
      return;
    }

    if (granteeAddress.toLowerCase() === address?.toLowerCase()) {
      alert("You cannot share a folder with yourself");
      return;
    }

    setIsSubmitting(true);
    try {
      await shareFolder.mutateAsync({
        tokenId: folderId,
        grantee: granteeAddress,
        canRead,
        canWrite,
      });
      
      // Reset form
      setGranteeAddress("");
      setCanRead(true);
      setCanWrite(false);
      setOpen(false);
      
    } catch (error) {
      console.error("Error sharing folder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="w-5 h-5" />
            Share Folder
          </DialogTitle>
          <DialogDescription>
            Share &quot;{folderName}&quot; with another user by entering their wallet address.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grantee">Wallet Address</Label>
            <Input
              id="grantee"
              type="text"
              placeholder="0x..."
              value={granteeAddress}
              onChange={(e) => setGranteeAddress(e.target.value)}
              className={`${
                granteeAddress && !isValidAddress(granteeAddress) 
                  ? "border-red-500 focus:border-red-500" 
                  : ""
              }`}
            />
            {granteeAddress && !isValidAddress(granteeAddress) && (
              <p className="text-sm text-red-500">Please enter a valid Ethereum address</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canRead"
                  checked={canRead}
                  onCheckedChange={(checked) => setCanRead(checked === true)}
                />
                <Label htmlFor="canRead" className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4" />
                  Can view folder and files
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canWrite"
                  checked={canWrite}
                  onCheckedChange={(checked) => setCanWrite(checked === true)}
                />
                <Label htmlFor="canWrite" className="flex items-center gap-2 text-sm">
                  <Edit className="w-4 h-4" />
                  Can add and modify files
                </Label>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Permission Summary</span>
            </div>
            <div className="flex gap-2">
              {canRead && (
                <Badge variant="secondary" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  Read
                </Badge>
              )}
              {canWrite && (
                <Badge variant="secondary" className="text-xs">
                  <Edit className="w-3 h-3 mr-1" />
                  Write
                </Badge>
              )}
              {!canRead && !canWrite && (
                <Badge variant="outline" className="text-xs">
                  No permissions
                </Badge>
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
              onClick={handleShare}
              disabled={!granteeAddress || !isValidAddress(granteeAddress) || (!canRead && !canWrite) || isSubmitting}
            >
              {isSubmitting ? "Sharing..." : "Share Folder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
