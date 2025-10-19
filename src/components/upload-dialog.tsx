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
import { useAccount } from "wagmi";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useAddFile } from "@/hooks/useContract";
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Lock
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
  const [encryptFile, setEncryptFile] = useState(false);
  const { isConnected } = useAccount();

  const { uploadFileMutation, uploadedInfo, handleReset, status, progress } =
    useFileUpload();
  const addFile = useAddFile();

  const { isPending: isLoading, mutateAsync: uploadFile } = uploadFileMutation;

  const classifyFile = (file: File): string[] => {
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';
    const fileType = file.type.toLowerCase();
    
    const tags: string[] = [];
    
    // Add file extension as a tag
    if (fileExtension) {
      tags.push(fileExtension);
    }
    
    // Classify by category and add category tag
    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp', 'ico', 'tiff', 'tif'].includes(fileExtension)) {
      tags.push('images');
    } else if (fileType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv'].includes(fileExtension)) {
      tags.push('videos');
    } else if (fileType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a'].includes(fileExtension)) {
      tags.push('audio');
    } else if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'cab', 'ace'].includes(fileExtension)) {
      tags.push('archives');
    } else if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'pages'].includes(fileExtension)) {
      tags.push('documents');
    } else if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(fileExtension)) {
      tags.push('spreadsheets');
      tags.push('documents');
    } else if (['ppt', 'pptx', 'odp', 'key'].includes(fileExtension)) {
      tags.push('presentations');
      tags.push('documents');
    } else if (['html', 'htm', 'js', 'css', 'json', 'xml', 'yaml', 'yml'].includes(fileExtension)) {
      tags.push('web');
      tags.push('code');
    } else if (['swf', 'fla', 'flv'].includes(fileExtension)) {
      tags.push('embeds');
    } else if (['pkl'].includes(fileExtension)) {
      tags.push('code');
    } else if (['md', 'markdown', 'rst', 'tex'].includes(fileExtension)) {
      tags.push('markup');
      tags.push('documents');
    } else if (['svg', 'ai', 'eps', 'psd', 'sketch', 'fig', 'xd'].includes(fileExtension)) {
      tags.push('design');
      tags.push('images');
    } else if (['blend', 'fbx', 'obj', 'dae', '3ds', 'max', 'maya'].includes(fileExtension)) {
      tags.push('3d-models');
    } else if (['ttf', 'otf', 'woff', 'woff2', 'eot'].includes(fileExtension)) {
      tags.push('fonts');
    } else if (['apk', 'ipa', 'exe', 'msi', 'dmg', 'deb', 'rpm', 'pkg'].includes(fileExtension)) {
      tags.push('applications');
    } else if (['ipynb', 'rmd', 'qmd'].includes(fileExtension)) {
      tags.push('notebooks');
      tags.push('code');
    } else if (['db', 'sqlite', 'sql', 'mdb'].includes(fileExtension)) {
      tags.push('databases');
    } else if (['bin', 'dat', 'dump', 'img', 'iso', 'dmg'].includes(fileExtension)) {
      tags.push('binary');
    } else {
      // If we can't classify it, mark it as 'other'
      tags.push('other');
    }
    
    // Add MIME type category if it's useful
    if (fileType.includes('application/')) {
      if (fileType.includes('pdf')) {
        // Already handled above
      } else if (fileType.includes('json')) {
        tags.push('data');
      } else if (fileType.includes('octet-stream')) {
        tags.push('binary');
      }
    }
    
    // Add file size category
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB < 1) {
      tags.push('small');
    } else if (fileSizeMB < 10) {
      tags.push('medium');
    } else if (fileSizeMB < 100) {
      tags.push('large');
    } else {
      tags.push('xlarge');
    }
    
    // Remove duplicates and return
    return [...new Set(tags)];
  };

  // Get preview tags for the current file
  const previewTags = file ? classifyFile(file) : [];

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add file to contract after upload is complete
  useEffect(() => {
    const addFileToContract = async () => {
      // Create a unique identifier for this upload to prevent duplicate processing
      const uploadId = uploadedInfo?.pieceCid || '';
      
      if (uploadedInfo && uploadedInfo.pieceCid && uploadedInfo.fileName && file && 
          !isAddingToContract && uploadId !== processedUploadId) {
        
        setProcessedUploadId(uploadId);
        setIsAddingToContract(true);
        setContractAddError(null);
        
        // Add a delay to ensure the upload transaction completes and user is ready
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          const tags = classifyFile(file);

          await addFile.mutateAsync({
            tokenId: folderId,
            cid: uploadedInfo.pieceCid,
            filename: uploadedInfo.fileName,
            tags: tags,
            encrypted: uploadedInfo.encrypted || false,
            dataToEncryptHash: uploadedInfo.encryptedMetadata?.dataToEncryptHash || "",
            fileType: uploadedInfo.encrypted && uploadedInfo.encryptedMetadata
              ? uploadedInfo.encryptedMetadata.originalFileType
              : (uploadedInfo.fileType || file.type || "application/octet-stream"),
          });
          
          console.log("File added to contract successfully!");
          console.log("File tags:", tags);
        } catch (error) {
          console.error("❌ Error adding file to contract:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to add file to folder";
          
          // Check if user rejected the transaction
          if (errorMessage.includes("user rejected") || errorMessage.includes("User denied")) {
            setContractAddError("Transaction cancelled. File uploaded but not added to folder. Please reset and try again.");
          } else {
            setContractAddError(errorMessage);
          }
          
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
      setIsAddingToContract(false);
      setContractAddError(null);
      setProcessedUploadId(null);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Upload className="h-6 w-6" />
            Upload File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className={`border-1 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-primary bg-primary/5 shadow-lg"
              : file
                ? "border-secondary bg-secondary/5"
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
                  <div className="flex items-center gap-3 p-4 bg-secondary/50 rounded-full">
                    <File className="h-8 w-8 text-primary" />
                    <CheckCircle className="h-6 w-6 text-primary" />
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
                  <p className="text-lg font-medium">
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
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                      {previewTags.length > 0 && (
                        <div className="space-y-1 mx-auto">
                          <p className="text-xs text-muted-foreground">Auto-tags:</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {previewTags.map((tag, index) => {
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
            <div className="flex items-center justify-start py-2 gap-3">
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
              <p className="text-xs text-muted-foreground font-light">
                using Lit Protocol for enhanced privacy
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={async () => {
                if (!file) return;
                await uploadFile({ file, encrypt: encryptFile });
              }}
              disabled={!file || isLoading || isAddingToContract || !!uploadedInfo}
              className="flex-1"
              size="lg"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : isAddingToContract ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                  Adding to folder...
                </>
              ) : !uploadedInfo ? (
                <>
                  <Upload className="h-3 w-3 mr-2" />
                  Upload File
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-2" />
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
                setEncryptFile(false);
              }}
              disabled={!file || isLoading || isAddingToContract}
              size="lg"
            >
              <XCircle className="h-3 w-3 mr-2" />
              Reset
            </Button>
          </div>

          {/* Status and Progress */}
          {(status || isAddingToContract || contractAddError) && (
            <div className="space-y-2">
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-3 w-3 text-primary animate-spin" />
                      <span className="text-foreground font-base">
                        {contractAddError 
                          ? contractAddError
                          : isAddingToContract 
                            ? "Adding file to folder..." 
                            : status?.replace(/[❌✅🎉]/g, '').trim()
                        }
                      </span>
                    </div>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              {!isLoading && (contractAddError || status) && (
                <div className="flex items-center gap-2 text-sm">
                  {contractAddError || status?.includes("failed") || status?.includes("error") ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-secondary" />
                  )}
                  <span className={contractAddError || status?.includes("failed") || status?.includes("error") ? "text-destructive" : "text-foreground"}>
                    {contractAddError 
                      ? contractAddError
                      : isAddingToContract 
                        ? "Adding file to folder..." 
                        : status
                    }
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Upload Success Details */}
          {uploadedInfo && !isLoading && !contractAddError && (
            <div className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-secondary" />
                <p className="text-sm font-base">
                  {isAddingToContract ? "Processing..." : "Upload Complete"}
                </p>
              </div>
              
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">File:</span>
                  <span className="font-base truncate ml-2 max-w-[200px]">{uploadedInfo.fileName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-base">{(uploadedInfo.fileSize! / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">CommP:</span>
                  <span className="font-mono text-[10px]">{uploadedInfo.pieceCid?.slice(0,16)}...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">TX Hash:</span>
                  <span className="font-mono text-[10px]">{uploadedInfo.txHash?.slice(0, 16)}...</span>
                </div>
                {uploadedInfo.encrypted && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3 text-primary" />
                      <span className="text-primary font-base">Encrypted</span>
                    </div>
                    <span className="text-muted-foreground">Lit Protocol</span>
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


