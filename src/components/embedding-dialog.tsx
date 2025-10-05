"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Upload, Loader2 } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { FileItem } from "@/app/(dashboard)/page";

interface EmbeddingDialogProps {
  children: React.ReactNode;
  folderId: string;
  files: FileItem[];
}

export default function EmbeddingDialog({ children, folderId, files }: EmbeddingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'check' | 'preparing' | 'embedding' | 'complete' | 'error'>('check');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    createEmbeddings,
    isCreatingEmbeddings,
    embeddingsProgress,
    embeddingsStatus,
    embedResult,
    embeddingsError,
    resetEmbeddings,
    isServerHealthy,
    serverHealthError,
  } = useAI();

  // Filter files that can be embedded (images and documents)
  const embeddableFiles = files.filter(file => 
    file.type === 'image' || file.type === 'document' || file.type === 'pdf'
  );

  // Convert CIDs to URLs
  const fileUrls = embeddableFiles.map(file => 
    `https://${file.owner}.calibration.filcdn.io/${file.cid}`
  );

  const handleStartEmbedding = async () => {
    if (!isServerHealthy) {
      setStep('error');
      setErrorMessage('AI server is not running. Please check the server status.');
      return;
    }

    if (embeddableFiles.length === 0) {
      setStep('error');
      setErrorMessage('No embeddable files found in this folder. Please add some images or documents first.');
      return;
    }

    setStep('preparing');
    resetEmbeddings();
    
    setTimeout(() => {
      setStep('embedding');
      // Use folder ID as collection name for organization
      createEmbeddings({
        fileUrls,
        collectionName: `Folder_${folderId}`,
      });
    }, 1000);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setStep('check');
      setErrorMessage('');
      resetEmbeddings();
    }, 300);
  };

  const getStepStatus = (currentStep: typeof step) => {
    switch (currentStep) {
      case 'check':
        return { color: 'blue', text: 'Ready to start' };
      case 'preparing':
        return { color: 'yellow', text: 'Preparing files' };
      case 'embedding':
        return { color: 'blue', text: 'Creating embeddings' };
      case 'complete':
        return { color: 'green', text: 'Complete' };
      case 'error':
        return { color: 'red', text: 'Error' };
      default:
        return { color: 'gray', text: 'Unknown' };
    }
  };

  // Watch for embedding completion or errors
  useEffect(() => {
    if (step === 'embedding') {
      if (embedResult && !isCreatingEmbeddings) {
        // Embeddings created successfully
        setStep('complete');
      } else if (embeddingsError) {
        setStep('error');
        setErrorMessage(embeddingsError.message);
      }
    }
  }, [step, embedResult, isCreatingEmbeddings, embeddingsError]);

  const stepStatus = getStepStatus(step);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Create Embeddings
          </DialogTitle>
          <DialogDescription>
            Create AI embeddings for semantic search across your folder files
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Server Status */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">AI Server Status:</div>
              <Badge variant={isServerHealthy ? 'default' : 'destructive'}>
                {isServerHealthy ? 'Healthy' : 'Offline'}
              </Badge>
            </div>
            {serverHealthError && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>

          {/* Files Summary */}
          <div className="p-3 rounded-lg border">
            <div className="text-sm font-medium mb-2">Files to embed:</div>
            <div className="text-sm text-gray-600">
              {embeddableFiles.length} embeddable files out of {files.length} total files
            </div>
            {embeddableFiles.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                {embeddableFiles.map(f => f.name).join(', ')}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Supported: Images, Documents, PDFs
            </div>
          </div>

          {/* Progress Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progress:</span>
              <Badge variant={stepStatus.color === 'red' ? 'destructive' : 'default'}>
                {stepStatus.text}
              </Badge>
            </div>

            {step === 'embedding' && (
              <div className="space-y-2">
                <Progress value={embeddingsProgress} className="h-2" />
                <div className="text-xs text-gray-600">
                  {embeddingsStatus}
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  {errorMessage}
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-green-700">
                  Embeddings stored in Weaviate successfully! You can now use semantic search on your files.
                  {embedResult && (
                    <div className="mt-2 text-xs">
                      <div>Processed: {embedResult.total_processed}</div>
                      <div>Skipped: {embedResult.total_skipped}</div>
                      <div>Failed: {embedResult.total_failed}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={step === 'embedding'}
            >
              {step === 'complete' ? 'Close' : 'Cancel'}
            </Button>
            
            {step === 'check' && (
              <Button
                onClick={handleStartEmbedding}
                disabled={!isServerHealthy || embeddableFiles.length === 0}
              >
                Start Embedding
              </Button>
            )}

            {(step === 'preparing' || step === 'embedding') && (
              <Button disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {step === 'preparing' && 'Preparing...'}
                {step === 'embedding' && 'Creating...'}
              </Button>
            )}

            {step === 'error' && (
              <Button
                onClick={() => {
                  setStep('check');
                  setErrorMessage('');
                  resetEmbeddings();
                }}
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
