"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { 
  Download, 
  Eye, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Unlock,
  LockKeyhole,
  Key
} from 'lucide-react';
import { useFileDecryption } from '@/hooks/useFileDecryption';
import { useFiles } from '@/hooks/useContract';
import { FileItem, FileEntry } from '@/types';
import { Badge } from './ui/badge';
import { useAccount } from '@/hooks/useAccount';

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreviewModal({ isOpen, onClose, file }: FilePreviewModalProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedFile, setDecryptedFile] = useState<File | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileEntry | null>(null);
  
  const { decryptFileMutation, progress: decryptProgress } = useFileDecryption();
  const { data: folderFiles } = useFiles(
    file?.tokenId || "",
    !!file?.tokenId && isOpen
  );

  useEffect(() => {
    if (folderFiles && file?.cid) {
      const metadata = folderFiles.find((f: FileEntry) => f.cid === file.cid);
      if (metadata) {
        setFileMetadata(metadata);
      } else {
        setFileMetadata(null);
      }
    } else if (!folderFiles) {
      setFileMetadata(null);
    }
  }, [folderFiles, file?.cid]);

  const lastLoadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const currentCid = file?.cid;
    if (currentCid) {
      setFileContent(null);
      setPreviewUrl(null);
      setError(null);
      setIsLoading(false);
      setFileType('');
      setIsDecrypting(false);
      setDecryptedFile(null);
      setImageLoadError(false);
      lastLoadKeyRef.current = null;
    }
  }, [file?.cid]);

  useEffect(() => {
    if (!isOpen) {
      setFileContent(null);
      setPreviewUrl(null);
      setError(null);
      setIsLoading(false);
      setFileType('');
      setIsDecrypting(false);
      setDecryptedFile(null);
      setImageLoadError(false);
      setFileMetadata(null);
      lastLoadKeyRef.current = null;
    }
  }, [isOpen]);

  const getFileLogo = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return '/logos/image.png';
    if (['mp4', 'webm', 'avi', 'mov'].includes(extension)) return '/logos/video.png';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(extension)) return '/logos/audio.png';
    if (['pdf'].includes(extension)) return '/logos/pdf.png';
    if (['doc', 'docx', 'txt', 'md'].includes(extension)) return '/logos/document.png';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return '/logos/excel.png';
    if (['ppt', 'pptx'].includes(extension)) return '/logos/ppt.png';
    return '/logos/other.png';
  }, []);

  const getContentType = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const extensionMap: Record<string, string> = {
      txt: 'text/plain',
      json: 'application/json',
      md: 'text/markdown',
      csv: 'text/csv',
      js: 'text/javascript',
      ts: 'text/typescript',
      html: 'text/html',
      css: 'text/css',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/avi',
      mov: 'video/quicktime',
      pdf: 'application/pdf'
    };
    return extensionMap[extension] || 'application/octet-stream';
  }, []);

  const fetchAndProcessFile = useCallback(async () => {
    if (!file?.cid || !address) return;

    setIsLoading(true);
    setError(null);

    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const fileUrl = `https://${file.owner}.calibration.filbeam.io/${file.cid}`;
      
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30s
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: { 'Accept': '*/*' },
        signal: controller.signal
      });

      // Clear timeout on successful fetch
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = getContentType(file.name);
      setFileType(contentType);

      if (contentType.startsWith('text/') || contentType === 'application/json') {
        const text = await response.text();
        setFileContent(text);
      } else if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
        setPreviewUrl(fileUrl);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      
      let errorMessage = 'Failed to load file';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('fetch') || error.message.includes('CORS')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      // Clean up timeout if it still exists
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsLoading(false);
    }
  }, [file, address, getContentType]);

  const handleDecryptAndPreview = useCallback(async () => {
    if (!file?.encrypted) return;
    if (!address) {
      setError('Please connect your wallet to decrypt this file.');
      return;
    }
    
    // Check if we have metadata from contract
    if (!fileMetadata) {
      setError('File metadata not available. Unable to decrypt.');
      return;
    }
    
    if (!fileMetadata.dataToEncryptHash) {
      setError('File encryption data missing. Unable to decrypt.');
      return;
    }
    
    setIsDecrypting(true);
    setError(null);
    
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Fetch encrypted file from Filecoin
      const fileUrl = `https://${file.owner}.calibration.filbeam.io/${file.cid}`;
      
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30s
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: { 'Accept': '*/*' },
        signal: controller.signal
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Fetch the raw ciphertext directly from the endpoint
      const ciphertext = await response.text();
      
      // Use metadata from contract for decryption
      const originalFileName = fileMetadata.filename;
      const originalFileType = fileMetadata.fileType || 'application/octet-stream';
      
      // Decrypt the file using contract metadata
      const decrypted = await decryptFileMutation.mutateAsync({
        ciphertext: ciphertext,
        dataToEncryptHash: fileMetadata.dataToEncryptHash,
        metadata: {
          originalFileName: originalFileName,
          originalFileSize: 0, // We don't have this in contract
          originalFileType: originalFileType,
        },
      });
      
      setDecryptedFile(decrypted);
      
      // Generate preview for decrypted file
      const contentType = originalFileType;
      setFileType(contentType);
      
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setFileContent(text);
        };
        reader.onerror = (e) => {
          console.error('FileReader error:', e);
        };
        reader.readAsText(decrypted);
      } else if (contentType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setPreviewUrl(dataUrl);
        };
        reader.onerror = (e) => {
          console.error('FileReader error:', e);
        };
        reader.readAsDataURL(decrypted);
      } else if (contentType.startsWith('video/')) {
        const url = URL.createObjectURL(decrypted);
        setPreviewUrl(url);
      } else {
        console.log('No preview handler for content type:', contentType);
      }
      
    } catch (error) {
      console.error('Decryption error:', error);
      
      let errorMessage = 'Failed to decrypt file';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('not authorized') || error.message.includes('access')) {
          errorMessage = 'You do not have permission to decrypt this file.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      // Clean up timeout if it still exists
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsDecrypting(false);
    }
  }, [file, address, decryptFileMutation, fileMetadata]);

  const handleRetry = useCallback(() => {
    setError(null);
    if (file?.encrypted && fileMetadata) {
      handleDecryptAndPreview();
    } else {
      fetchAndProcessFile();
    }
  }, [fetchAndProcessFile, handleDecryptAndPreview, file, fileMetadata]);

  const handleDownload = useCallback(() => {
    if (file?.cid) {
      // If file is decrypted, download the decrypted version
      if (decryptedFile) {
        const url = URL.createObjectURL(decryptedFile);
        const link = document.createElement('a');
        link.href = url;
        link.download = decryptedFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Download original file
        const fileUrl = `https://${file.owner}.calibration.filbeam.io/${file.cid}`;
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }, [file, decryptedFile]);

  const handleOpenExternal = useCallback(() => {
    if (file?.cid) {
      const fileUrl = `https://${file.owner}.calibration.filcdn.io/${file.cid}`;
      window.open(fileUrl, '_blank');
    }
  }, [file]);

  // Cleanup any blob URLs when preview changes/unmounts
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset guard when modal closes
  useEffect(() => {
    if (!isOpen) {
      lastLoadKeyRef.current = null;
    }
  }, [isOpen]);

  // Derive a stable key for the current load intent
  const loadKey = useMemo(() => {
    if (!file) return null;
    return `${file.cid}:${file.encrypted ? 'enc' : 'plain'}:${address || 'noaddr'}:${file.type}`;
  }, [file, address]);

  // Stable trigger that uses latest handlers without violating exhaustive-deps
  const triggerLoadRef = useRef<() => void>(() => {});
  useEffect(() => {
    triggerLoadRef.current = () => {
      if (!file) return;
      // Only auto-load non-encrypted files
      // For encrypted files, user must click decrypt button
      if (!file.encrypted) {
        fetchAndProcessFile();
      }
    };
  }, [file, fetchAndProcessFile]);

  // Load file when modal opens (avoid loops by keying the action)
  useEffect(() => {
    if (!isOpen || !file || file.type === 'folder' || !loadKey) return;
    if (lastLoadKeyRef.current === loadKey) return; // already attempted for this key
    lastLoadKeyRef.current = loadKey;
    triggerLoadRef.current();
  }, [isOpen, loadKey, file]);

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image 
              src={getFileLogo(file.name)} 
              alt="file icon" 
              width={20} 
              height={20}
              className="text-gray-600"
            />
            <span className="truncate">{file.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Decryption Progress */}
          {isDecrypting && (
            <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-foreground">Decrypting file...</span>
              </div>
              <Progress value={decryptProgress} className="h-1" />
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Loading file...</p>
            </Card>
          )}

          {/* Error State - Compact */}
          {error && (
            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button 
                    onClick={handleRetry} 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2 text-xs"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* File Preview - Only show when content is available */}
          {!isLoading && !error && !isDecrypting && (fileContent || previewUrl || decryptedFile) && (
            <Card className="p-0 overflow-hidden">
              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/30">
                {/* Decrypted Badge */}
                {decryptedFile && (
                  <Badge variant="outline">
                    <Key className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Decrypted</span>
                  </Badge>
                )}
                {!decryptedFile && <div />}
                
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button onClick={handleDownload} variant="ghost" size="sm" className="h-8">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                  {!file.encrypted && (
                    <Button onClick={handleOpenExternal} variant="ghost" size="sm" className="h-8">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Open
                    </Button>
                  )}
                </div>
              </div>

              {/* Text Content */}
              {fileContent && (
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words font-mono">
                    {fileContent}
                  </pre>
                </div>
              )}

              {/* Image Preview */}
              {previewUrl && fileType.startsWith('image/') && !imageLoadError && (
                <div className="p-4 bg-gray-50">
                  <div className="relative w-full flex justify-center">
                    <Image
                      src={previewUrl}
                      alt={file.name}
                      width={800}
                      height={600}
                      className="object-contain rounded max-h-[500px]"
                      style={{ maxHeight: '500px' }}
                      unoptimized
                      onError={() => setImageLoadError(true)}
                      loader={previewUrl.startsWith('blob:') || previewUrl.startsWith('data:') ? ({ src }) => src : undefined}
                    />
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {previewUrl && fileType.startsWith('video/') && (
                <div className="p-4 bg-gray-50">
                  <video 
                    controls 
                    className="max-w-full max-h-[500px] rounded mx-auto"
                    src={previewUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {/* Audio Preview */}
              {previewUrl && fileType.startsWith('audio/') && (
                <div className="p-4">
                  <audio 
                    controls 
                    className="w-full"
                    src={previewUrl}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {/* PDF Preview */}
              {previewUrl && fileType === 'application/pdf' && (
                <div className="p-4 bg-gray-50">
                  <iframe
                    src={previewUrl}
                    className="w-full h-[500px] rounded border"
                    title={file.name}
                  />
                </div>
              )}
            </Card>
          )}

          {/* No Preview Available - Only show when decrypted but no preview */}
          {!isLoading && !error && !isDecrypting && decryptedFile && !fileContent && !previewUrl && (
            <div className="p-8 border rounded-lg text-center bg-gray-50">
              <Eye className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-3">Preview not available</p>
              <Button onClick={handleDownload} size="sm">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          )}

          {/* Waiting for Decrypt - Show when encrypted and not decrypted yet */}
          {!isLoading && !error && !isDecrypting && file.encrypted && !decryptedFile && (
            <Card className="p-12 text-center border-primary/20 bg-primary/5">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <LockKeyhole className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-base mb-2">Encrypted File</h3>
              <p className="text-xs font-light text-muted-foreground mb-6 max-w-md mx-auto">
                This file is encrypted with Lit Protocol. Decrypt it to view the contents.
              </p>
              <Button 
                onClick={handleDecryptAndPreview} 
                disabled={!address}
                size="lg"
                className="gap-2"
              >
                <Unlock className="w-4 h-4" />
                Decrypt & Preview
              </Button>
              {!address && (
                <p className="text-xs text-muted-foreground mt-3">
                  Please connect your wallet to decrypt
                </p>
              )}
            </Card>
          )}

          {/* Connect Wallet Prompt */}
          {!address && (
            <Card className="p-6 text-center bg-amber-50 border-amber-200">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="font-medium text-amber-800">Wallet Required</h4>
              <p className="text-sm text-amber-700 mt-1">
                Please connect your wallet to view files.
              </p>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default FilePreviewModal;
