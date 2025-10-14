"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { 
  Download, 
  Eye, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Shield,
  Unlock
} from 'lucide-react';
import { useFileDecryption } from '@/hooks/useFileDecryption';
import { FileItem } from '@/types';

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
  const hasLoadedRef = useRef<string | null>(null); // Track which file has been loaded
  
  const { decryptFileMutation, progress: decryptProgress, status: decryptStatus } = useFileDecryption();

  // Reset state when file changes
  useEffect(() => {
    if (file) {
      setFileContent(null);
      setPreviewUrl(null);
      setError(null);
      setIsLoading(false);
      setFileType('');
      setIsDecrypting(false);
      setDecryptedFile(null);
      hasLoadedRef.current = null; // Reset loaded state
    }
  }, [file]);

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
    if (!file?.encrypted || !file?.encryptedMetadata || !address) return;
    
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
      
      // Clear timeout on successful fetch
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get the ciphertext (encrypted content)
      const ciphertext = await response.text();
      
      // Decrypt the file
      const decrypted = await decryptFileMutation.mutateAsync({
        ciphertext,
        dataToEncryptHash: file.encryptedMetadata.dataToEncryptHash,
        metadata: {
          originalFileName: file.encryptedMetadata.originalFileName,
          originalFileSize: file.encryptedMetadata.originalFileSize,
          originalFileType: file.encryptedMetadata.originalFileType,
        },
      });
      
      setDecryptedFile(decrypted);
      
      // Generate preview for decrypted file
      const contentType = file.encryptedMetadata.originalFileType;
      setFileType(contentType);
      
      if (contentType.startsWith('text/') || contentType === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          setFileContent(text);
        };
        reader.readAsText(decrypted);
      } else if (contentType.startsWith('image/') || contentType.startsWith('video/')) {
        const url = URL.createObjectURL(decrypted);
        setPreviewUrl(url);
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
  }, [file, address, decryptFileMutation]);

  const handleRetry = useCallback(() => {
    setError(null);
    if (file?.encrypted && file?.encryptedMetadata) {
      handleDecryptAndPreview();
    } else {
      fetchAndProcessFile();
    }
  }, [fetchAndProcessFile, handleDecryptAndPreview, file]);

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

  // Load file when modal opens
  useEffect(() => {
    // Create a unique identifier for this file
    const fileId = file?.cid || file?.id || '';
    
    // Only load if modal is open, file exists, not a folder, and we haven't loaded this file yet
    if (isOpen && file && file.type !== 'folder' && hasLoadedRef.current !== fileId) {
      hasLoadedRef.current = fileId; // Mark this file as being loaded
      
      // If file is encrypted, decrypt it
      if (file.encrypted && file.encryptedMetadata) {
        handleDecryptAndPreview();
      } else {
        // Otherwise, fetch normally
        fetchAndProcessFile();
      }
    }
    
    // Reset when modal closes
    if (!isOpen) {
      hasLoadedRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, file?.cid, file?.id, file?.type, file?.encrypted]);

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
          {/* Encryption Indicator */}
          {file.encrypted && (
            <Card className="p-3 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Encrypted with Lit Protocol
                  </p>
                  <p className="text-xs text-blue-700">
                    This file is encrypted and will be decrypted automatically if you have access.
                  </p>
                </div>
                {decryptedFile && (
                  <Badge variant="default" className="bg-green-500">
                    <Unlock className="h-3 w-3 mr-1" />
                    Decrypted
                  </Badge>
                )}
              </div>
            </Card>
          )}

          {/* Decryption Progress */}
          {isDecrypting && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Unlock className="h-5 w-5 text-blue-600 animate-pulse" />
                <span className="font-medium text-blue-900">Decrypting file...</span>
              </div>
              <Progress value={decryptProgress} className="h-2 mb-2" />
              <p className="text-sm text-blue-700">{decryptStatus}</p>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Loading file...</p>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Error Loading File</h4>
                    <p className="text-sm mt-1">{error}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button 
                    onClick={handleRetry} 
                    variant="outline" 
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Retry
                  </Button>
                  <Button 
                    onClick={handleOpenExternal} 
                    variant="outline" 
                    size="sm"
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* File Preview */}
          {!isLoading && !error && !isDecrypting && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {file.encrypted && decryptedFile && (
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <Unlock className="h-3 w-3 mr-1" />
                      Decrypted
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    {decryptedFile ? 'Download Decrypted' : 'Download'}
                  </Button>
                  {!file.encrypted && (
                    <Button onClick={handleOpenExternal} variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open
                    </Button>
                  )}
                </div>
              </div>

              {/* Text Content */}
              {fileContent && (
                <div className="bg-background p-4 rounded border max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words ">
                    {fileContent}
                  </pre>
                </div>
              )}

              {/* Image Preview */}
              {previewUrl && fileType.startsWith('image/') && (
                <div className="bg-background p-4 rounded border">
                  <div className="relative w-full flex justify-center">
                    <Image
                      src={previewUrl}
                      alt={file.name}
                      width={800}
                      height={600}
                      className="object-contain rounded max-h-96"
                      style={{ maxHeight: '24rem' }}
                    />
                  </div>
                </div>
              )}

              {/* Video Preview */}
              {previewUrl && fileType.startsWith('video/') && (
                <div className="bg-background p-4 rounded border">
                  <video 
                    controls 
                    className="max-w-full max-h-96 rounded mx-auto"
                    src={previewUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              )}

              {/* No Preview Available */}
              {!fileContent && !previewUrl && !isLoading && !isDecrypting && (
                <div className="bg-background p-8 rounded border text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">
                    Preview not available for this file type.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleDownload} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      {decryptedFile ? 'Download Decrypted' : 'Download'}
                    </Button>
                    {!file.encrypted && (
                      <Button onClick={handleOpenExternal} variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open in Browser
                      </Button>
                    )}
                  </div>
                </div>
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
