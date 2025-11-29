"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useFileUpload } from "@/hooks/useFileUpload";
import { classifyFile } from "@/utils/fileClassification";
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Lock
} from "lucide-react";
import { useConnection } from "wagmi";

interface UploadDialogProps {
  children: React.ReactNode;
  folderId: string;
}

export default function UploadDialog({ children, folderId }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [encryptFile, setEncryptFile] = useState(false);
  const { isConnected } = useConnection();

  const { 
    uploadFileMutation, 
    uploadedInfo, 
    handleReset, 
    status, 
    progress,
    isAddingToContract,
    contractAddError,
  } = useFileUpload(folderId);

  const { isPending: isLoading, mutateAsync: uploadFile } = uploadFileMutation;

  // Get preview tags for the current file
  const previewTags = file ? classifyFile(file) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    // Prevent closing while uploading or adding to contract
    if (!newOpen && (isLoading || isAddingToContract)) {
      return;
    }
    
    setOpen(newOpen);
    
    // Clear all state when closing the dialog
    if (!newOpen) {
      handleReset();
      setFile(null);
      setEncryptFile(false);
    }
  };

  if (!mounted || !isConnected) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl overflow-y-auto overflow-x-hidden">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6" />
            Upload File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <Card className={`border border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary bg-primary/5 shadow-lg"
              : file
                ? "border-secondary bg-secondary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}>
            <CardContent
              className="p-4 sm:p-8 text-center overflow-hidden"
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <input
                id="fileInput"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setFile(e.target.files[0]);
                  }
                  e.target.value = "";
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                {file ? (
                  <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-secondary/50 rounded-full">
                    <File className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                ) : (
                  <div className={`p-3 sm:p-4 rounded-full ${
                    isDragging ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Upload className={`h-6 w-6 sm:h-8 sm:w-8 ${
                      isDragging ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                )}
                
                <div className="space-y-2 w-full max-w-full">
                  <p className="text-base sm:text-lg font-medium break-all px-4 line-clamp-3">
                    {file ? file.name : "Drop your file here"}
                  </p>
                  {!file && (
                    <>
                      <p className="text-sm sm:text-base text-muted-foreground">
                        or click to browse your files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports all file types
                      </p>
                    </>
                  )}
                  {file && (
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                      {previewTags.length > 0 && (
                        <div className="space-y-1 mx-auto">
                          <p className="text-xs text-muted-foreground">Auto-tags:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {previewTags.map((tag: string, index: number) => {
                              // Color-code tags by category
                              const getTagVariant = (tag: string) => {
                                if (['images', 'design'].includes(tag)) return 'default'; // Blue
                                if (['videos', 'audio'].includes(tag)) return 'secondary'; // Gray
                                if (['documents', 'spreadsheets', 'presentations', 'markup'].includes(tag)) return 'outline'; // White
                                if (['code', 'web', 'notebooks', 'databases'].includes(tag)) return 'destructive'; // Red
                                if (['archives', 'binary', 'applications'].includes(tag)) return 'default'; // Blue
                                if (['embeds'].includes(tag)) return 'secondary'; // Gray
                                return 'outline'; // Default
                              };
                              
                              return (
                                <Badge 
                                  key={index} 
                                  variant={getTagVariant(tag)}
                                  className="text-xs px-2 py-0.5"
                                >
                                  {tag}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encryption Option */}
          {file && !uploadedInfo && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-start py-2 gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Label 
                  htmlFor="encrypt" 
                  className="text-sm font-base cursor-pointer"
                >
                  Encrypt
                </Label>
                <Switch 
                  id="encrypt"
                  checked={encryptFile}
                  onCheckedChange={setEncryptFile}
                  disabled={isLoading || isAddingToContract}
                />
              </div>
              <p className="text-xs text-muted-foreground font-light">
                using Lit Protocol for enhanced privacy
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={async () => {
                if (!file) return;
                await uploadFile({ file, encrypt: encryptFile });
              }}
              disabled={!file || isLoading || isAddingToContract || (!!uploadedInfo && !contractAddError)}
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : isAddingToContract ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding to folder...
                </>
              ) : uploadedInfo && !contractAddError ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                setFile(null);
                setEncryptFile(false);
              }}
              disabled={!file || isLoading || isAddingToContract}
              size="lg"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Status and Progress */}
          {(status || isAddingToContract || contractAddError) && (
            <div className="space-y-2">
              {(isLoading || isAddingToContract) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <RefreshCw className="h-3 w-3 text-primary animate-spin shrink-0" />
                      <span className="text-foreground font-base truncate">
                        {isAddingToContract 
                          ? "Adding file to folder..." 
                          : status?.replace(/[❌✅🎉]/g, '').trim()
                        }
                      </span>
                    </div>
                    <span className="text-muted-foreground shrink-0">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              {!isLoading && !isAddingToContract && (contractAddError || status) && (
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  {contractAddError || status?.includes("failed") || status?.includes("error") ? (
                    <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-secondary shrink-0" />
                  )}
                  <span className={`${contractAddError || status?.includes("failed") || status?.includes("error") ? "text-destructive" : "text-foreground"} wrap-break-word`}>
                    {contractAddError || status}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Upload Success Details */}
          {uploadedInfo && !isLoading && !isAddingToContract && !contractAddError && (
            <div className="space-y-3 p-3 sm:p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-secondary" />
                <p className="text-xs sm:text-sm font-base">
                  Upload Complete
                </p>
              </div>
              
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">File:</span>
                  <span className="font-base truncate text-right max-w-[180px] sm:max-w-[200px]">{uploadedInfo.fileName}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Size:</span>
                  <span className="font-base">{(uploadedInfo.fileSize! / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">CommP:</span>
                  <span className="font-mono text-[10px] truncate">{uploadedInfo.pieceCid?.slice(0,16)}...</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">TX Hash:</span>
                  <span className="font-mono text-[10px] truncate">{uploadedInfo.txHash?.slice(0, 16)}...</span>
                </div>
                {uploadedInfo.encrypted && (
                  <div className="flex items-center justify-between pt-2 border-t gap-2">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-primary" />
                      <span className="text-primary font-base text-xs">Encrypted</span>
                    </div>
                    <span className="text-muted-foreground text-xs">Lit Protocol</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


