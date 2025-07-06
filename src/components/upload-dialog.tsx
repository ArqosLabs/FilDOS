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
}

export default function UploadDialog({ children }: UploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();

  const { uploadFileMutation, uploadedInfo, handleReset, status, progress } =
    useFileUpload();

  const { isPending: isLoading, mutateAsync: uploadFile } = uploadFileMutation;

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
              disabled={!file || isLoading || !!uploadedInfo}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : !uploadedInfo ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Uploaded
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                handleReset();
                setFile(null);
              }}
              disabled={!file || isLoading}
              size="lg"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Status and Progress */}
          {status && (
            <Card className={
              status.includes("❌")
                ? "border-red-200 bg-red-50"
                : status.includes("✅") || status.includes("🎉")
                  ? "border-green-200 bg-green-50"
                  : "border-blue-200 bg-blue-50"
            }>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {status.includes("❌") ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : status.includes("✅") || status.includes("🎉") ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  <p className={`text-sm font-medium ${
                    status.includes("❌")
                      ? "text-red-700"
                      : status.includes("✅") || status.includes("🎉")
                        ? "text-green-700"
                        : "text-blue-700"
                  }`}>
                    {status}
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
          {uploadedInfo && !isLoading && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h4 className="text-lg font-semibold text-green-800">
                    Upload Successful!
                  </h4>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">File Name</p>
                        <p className="text-sm text-muted-foreground break-all">
                          {uploadedInfo.fileName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">File Size</p>
                        <p className="text-sm text-muted-foreground">
                          {uploadedInfo.fileSize?.toLocaleString() || "N/A"} bytes
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">CommP</p>
                        <p className="text-xs text-muted-foreground break-all font-mono">
                          {uploadedInfo.commp}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Transaction Hash</p>
                        <p className="text-xs text-muted-foreground break-all font-mono">
                          {uploadedInfo.txHash?.slice(0, 10)}...
                        </p>
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


