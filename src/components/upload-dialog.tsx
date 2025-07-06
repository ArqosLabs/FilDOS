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
import { useAccount } from "wagmi";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAddFile } from "@/hooks/useContract";
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  FileText,
  Hash,
  HardDrive
} from "lucide-react";

interface UploadDialogProps {
  children: React.ReactNode;
  folderId: string;
}

export default function UploadDialog({ children, folderId }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAddingToContract, setIsAddingToContract] = useState(false);
  const [contractAddError, setContractAddError] = useState<string | null>(null);
  const [processedUploadId, setProcessedUploadId] = useState<string | null>(null);
  const { isConnected } = useAccount();

  const { uploadFileMutation, uploadedInfo, handleReset, status, progress } =
    useFileUpload();
  const addFile = useAddFile();

  const { isPending: isLoading, mutateAsync: uploadFile } = uploadFileMutation;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add file to contract after upload is complete
  useEffect(() => {
    const addFileToContract = async () => {
      // Create a unique identifier for this upload to prevent duplicate processing
      const uploadId = uploadedInfo?.commp || '';
      
      if (uploadedInfo && uploadedInfo.commp && uploadedInfo.fileName && file && 
          !isAddingToContract && uploadId !== processedUploadId) {
        
        setProcessedUploadId(uploadId);
        setIsAddingToContract(true);
        setContractAddError(null);
        
        try {
          // Get file extension and type for tags
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
          const fileType = file.type || 'unknown';
          const tags = [fileExtension, fileType].filter(Boolean);

          await addFile.mutateAsync({
            tokenId: folderId,
            cid: uploadedInfo.commp,
            filename: uploadedInfo.fileName,
            tags: tags,
          });
          
          console.log("✅ File added to contract successfully!");
        } catch (error) {
          console.error("❌ Error adding file to contract:", error);
          setContractAddError(error instanceof Error ? error.message : "Failed to add file to folder");
          setProcessedUploadId(null); // Reset on error so user can retry
        } finally {
          setIsAddingToContract(false);
        }
      }
    };

    addFileToContract();
  }, [uploadedInfo, file, folderId, isAddingToContract, processedUploadId, addFile]);

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

  if (!mounted || !isConnected) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload File
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Upload your files to decentralized storage on Filecoin
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <Card className={`border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary bg-primary/5 shadow-lg"
              : file
                ? "border-green-500 bg-green-50"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}>
            <CardContent
              className="p-8 text-center"
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
              <div className="flex flex-col items-center gap-4">
                {file ? (
                  <div className="flex items-center gap-3 p-4 bg-green-100 rounded-full">
                    <File className="h-8 w-8 text-green-600" />
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                ) : (
                  <div className={`p-4 rounded-full ${
                    isDragging ? "bg-primary/10" : "bg-muted"
                  }`}>
                    <Upload className={`h-8 w-8 ${
                      isDragging ? "text-primary" : "text-muted-foreground"
                    }`} />
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-lg font-semibold">
                    {file ? file.name : "Drop your file here"}
                  </p>
                  {!file && (
                    <>
                      <p className="text-muted-foreground">
                        or click to browse your files
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supports all file types
                      </p>
                    </>
                  )}
                  {file && (
                    <Badge variant="secondary" className="text-xs">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={async () => {
                if (!file) return;
                await uploadFile(file);
              }}
              disabled={!file || isLoading || isAddingToContract || !!uploadedInfo}
              className="flex-1"
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
              ) : !uploadedInfo ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                setFile(null);
                setIsAddingToContract(false);
                setContractAddError(null);
                setProcessedUploadId(null);
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
            <Card className={
              status?.includes("❌") || contractAddError
                ? "border-red-200 bg-red-50"
                : status?.includes("✅") || status?.includes("🎉")
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
            }>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {status?.includes("❌") || contractAddError ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : status?.includes("✅") || status?.includes("🎉") ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  <p className={`text-sm font-medium ${
                    status?.includes("❌") || contractAddError
                      ? "text-red-700"
                      : status?.includes("✅") || status?.includes("🎉")
                        ? "text-green-700"
                        : "text-blue-700"
                  }`}>
                    {contractAddError 
                      ? `Failed to add to folder: ${contractAddError}`
                      : isAddingToContract 
                        ? "Adding file to folder..." 
                        : status
                    }
                  </p>
                </div>
                {isLoading && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Upload Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {/* Upload Success Details */}
          {uploadedInfo && !isLoading && !contractAddError && (
            <Card className="">
              <CardContent className="pt-6">
                
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-green-700">
                    {isAddingToContract ? "Uploading & Adding to Folder..." : "File Successfully Uploaded & Added to Folder"}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">File Name</p>
                        <p className="text-muted-foreground truncate">{uploadedInfo.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Size</p>
                        <p className="text-muted-foreground">{uploadedInfo.fileSize?.toLocaleString() || "N/A"} bytes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">CommP</p>
                        <p className="text-muted-foreground font-mono truncate">{uploadedInfo.commp?.slice(0,10) + "..."}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">TX Hash</p>
                        <p className="text-muted-foreground font-mono truncate">{uploadedInfo.txHash?.slice(0, 10)}...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


