"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Upload, Loader2 } from "lucide-react";
import { useAI } from "@/hooks/useAI";
import { FileItem } from "@/types";

interface EmbeddingDialogProps {
  children: React.ReactNode;
  folderId: string;
  files: FileItem[];
}

export default function EmbeddingDialog({ children, folderId, files }: EmbeddingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'check' | 'preparing' | 'embedding' | 'saving' | 'complete' | 'error'>('check');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    createEmbeddings,
    isCreatingEmbeddings,
    embeddingsProgress,
    embeddingsStatus,
    embedResult,
    embeddingsError,
    resetEmbeddings,
    isServerHealthy
  } = useAI();

  // Filter files that can be embedded (images and documents)
  const embeddableFiles = files.filter(file =>
    (file.type === 'image' || file.type === 'document' || file.type === 'pdf') && !file.encrypted
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
      createEmbeddings({
        fileUrls,
        collection_name: `Folder${folderId}`,
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
      case 'saving':
        return { color: 'blue', text: 'Saving to folder' };
      case 'complete':
        return { color: 'green', text: 'Complete' };
      case 'error':
        return { color: 'red', text: 'Error' };
      default:
        return { color: 'gray', text: 'Unknown' };
    }
  };

  // Watch for embedding completion
  useEffect(() => {
    if (step === 'embedding') {
      if (embedResult) {
        setStep('complete');
      } else if (embeddingsError) {
        setStep('error');
        setErrorMessage(embeddingsError.message);
      }
    }
  }, [step, embedResult, isCreatingEmbeddings, embeddingsError]);

  // Watch for embedding errors
  useEffect(() => {
    if (embeddingsError) {
      setStep('error');
      setErrorMessage(embeddingsError.message);
    }
  }, [embeddingsError]);

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

          {/* Files Summary */}
          <div className="p-3 rounded-md border border-border">
            <div className="text-sm font-medium mb-2">Files to embed:</div>
            <div className="text-sm text-muted-foreground">
              {embeddableFiles.length} embeddable files out of {files.length} total files
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Supported: Images, Documents, PDFs (non-encrypted files)
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
                <div className="text-xs text-muted-foreground">
                  {embeddingsStatus}
                </div>
              </div>
            )}

            {step === 'error' && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-sm text-destructive">
                  {errorMessage}
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm text-primary">
                  Embeddings created and saved successfully! You can now use semantic search on your files.
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
