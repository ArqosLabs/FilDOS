"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAccount } from 'wagmi';
import Image from 'next/image';
import { 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  AlertCircle, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { FileItem } from '@/app/(dashboard)/page';

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

  // Reset state when file changes
  useEffect(() => {
    if (file) {
      setFileContent(null);
      setPreviewUrl(null);
      setError(null);
      setIsLoading(false);
      setFileType('');
    }
  }, [file]);

  const getFileIcon = useCallback((fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) return ImageIcon;
    if (['mp4', 'webm', 'avi', 'mov'].includes(extension)) return Video;
    return FileText;
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

    try {
      const fileUrl = `https://${file.owner}.calibration.filbeam.io/${file.cid}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(fileUrl, {
        method: 'GET',
        cache: 'no-cache',
        headers: { 'Accept': '*/*' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

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
      setIsLoading(false);
    }
  }, [file, address, getContentType]);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchAndProcessFile();
  }, [fetchAndProcessFile]);

  const handleDownload = useCallback(() => {
    if (file?.cid) {
      const fileUrl = `https://${file.owner}.calibration.filbeam.io/${file.cid}`;
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [file]);

  const handleOpenExternal = useCallback(() => {
    if (file?.cid) {
      const fileUrl = `https://${file.owner}.calibration.filcdn.io/${file.cid}`;
      window.open(fileUrl, '_blank');
    }
  }, [file]);

  // Load file when modal opens
  useEffect(() => {
    if (isOpen && file && file.type !== 'folder') {
      fetchAndProcessFile();
    }
  }, [isOpen, file, fetchAndProcessFile]);

  if (!file) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {React.createElement(getFileIcon(file.name), {
              className: "w-5 h-5 text-gray-600"
            })}
            <span className="truncate">{file.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                    <h4 className="font-semibold">Error Loading File</h4>
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
          {!isLoading && !error && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {React.createElement(getFileIcon(file.name), {
                    className: "w-5 h-5 text-gray-600 mr-2"
                  })}
                  <h4 className="text-lg font-semibold">File Preview</h4>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button onClick={handleOpenExternal} variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open
                  </Button>
                </div>
              </div>

              {/* Text Content */}
              {fileContent && (
                <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">
                    {fileContent}
                  </pre>
                </div>
              )}

              {/* Image Preview */}
              {previewUrl && fileType.startsWith('image/') && (
                <div className="bg-white p-4 rounded border">
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
                <div className="bg-white p-4 rounded border">
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
              {!fileContent && !previewUrl && !isLoading && (
                <div className="bg-white p-8 rounded border text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">
                    Preview not available for this file type.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleDownload} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={handleOpenExternal} variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Browser
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Connect Wallet Prompt */}
          {!address && (
            <Card className="p-6 text-center bg-amber-50 border-amber-200">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <h4 className="font-semibold text-amber-800">Wallet Required</h4>
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
