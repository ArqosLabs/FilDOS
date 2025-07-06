import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { config } from "@/config";

// Types for AI endpoints
export type EmbedRequest = {
  file_urls: string[];
};

export type EmbedResponse = {
  success: boolean;
  error?: string;
  processed_files?: number;
  failed_files?: number;
  total_embeddings?: number;
};

export type SearchRequest = {
  query: string;
  embed_file_url: string;
};

export type SearchResult = {
  score: number;
  type: "image" | "text";
  filename: string;
  url: string;
  excerpt?: string;
};

export type SearchResponse = {
  query: string;
  results: SearchResult[];
  total_embeddings: number;
  message?: string;
  error?: string;
};

/**
 * Hook to create embeddings from multiple file URLs
 */
export const useCreateEmbeddings = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [embedFileUrl, setEmbedFileUrl] = useState<string | null>(null);

  const mutation = useMutation({
    mutationKey: ["create-embeddings"],
    mutationFn: async (fileUrls: string[]): Promise<string> => {
      if (!fileUrls || fileUrls.length === 0) {
        throw new Error("File URLs are required");
      }

      setProgress(0);
      setStatus("🔄 Creating embeddings...");
      setEmbedFileUrl(null);

      const formData = new FormData();
      fileUrls.forEach((url) => {
        formData.append('file_urls', url);
      });

      const response = await fetch(`${config.aiServerUrl}/embed`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      setProgress(50);
      setStatus("🔄 Processing embeddings...");

      // Get the blob and create a URL for it
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Get metadata from headers
      const processedFiles = response.headers.get('X-Processed-Files');
      const failedFiles = response.headers.get('X-Failed-Files');
      const totalEmbeddings = response.headers.get('X-Total-Embeddings');

      setProgress(100);
      setStatus(`✅ Embeddings created! Processed: ${processedFiles}, Failed: ${failedFiles}, Total: ${totalEmbeddings}`);
      setEmbedFileUrl(url);

      return url;
    },
    onError: (error) => {
      setStatus(`❌ Error creating embeddings: ${error.message}`);
      setProgress(0);
    },
  });

  return {
    createEmbeddings: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
    progress,
    status,
    embedFileUrl,
    reset: () => {
      mutation.reset();
      setProgress(0);
      setStatus("");
      setEmbedFileUrl(null);
    },
  };
};

/**
 * Hook to search through embeddings
 */
export const useSearchEmbeddings = () => {
  const [status, setStatus] = useState("");

  const mutation = useMutation({
    mutationKey: ["search-embeddings"],
    mutationFn: async ({ query, embed_file_url}: SearchRequest): Promise<SearchResponse> => {
      if (!query) {
        throw new Error("Query is required");
      }
      if (!embed_file_url) {
        throw new Error("Embed file URL is required");
      }

      setStatus("🔍 Searching embeddings...");

      const formData = new FormData();
      formData.append('query', query);
      formData.append('embed_file_url', embed_file_url);

      const response = await fetch(`${config.aiServerUrl}/search`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      console.log("Search results:", data);
      setStatus(`✅ Search completed! Found ${data.results.length} results`);

      return data;
    },
    onError: (error) => {
      setStatus(`❌ Error searching: ${error.message}`);
    },
  });

  return {
    searchEmbeddings: mutation.mutate,
    isSearching: mutation.isPending,
    searchResults: mutation.data,
    error: mutation.error,
    status,
    reset: () => {
      mutation.reset();
      setStatus("");
    },
  };
};


/**
 * Hook to get AI server health status
 */
export const useAIServerHealth = () => {
  return useQuery({
    queryKey: ["ai-server-health"],
    queryFn: async (): Promise<{ status: string; timestamp: string }> => {
      const response = await fetch(`${config.aiServerUrl}/health`);
      
      if (!response.ok) {
        throw new Error(`AI server is not responding: ${response.status}`);
      }

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
      };
    },
    refetchInterval: 30000, // Check every 30 seconds
    retry: 3,
  });
};

/**
 * Combined hook for AI operations
 */
export const useAI = () => {
  const embeddings = useCreateEmbeddings();
  const search = useSearchEmbeddings();
  const serverHealth = useAIServerHealth();

  return {
    // Embeddings operations
    createEmbeddings: embeddings.createEmbeddings,
    isCreatingEmbeddings: embeddings.isCreating,
    embeddingsProgress: embeddings.progress,
    embeddingsStatus: embeddings.status,
    embedFileUrl: embeddings.embedFileUrl,
    embeddingsError: embeddings.error,
    resetEmbeddings: embeddings.reset,

    // Search operations
    searchEmbeddings: search.searchEmbeddings,
    isSearching: search.isSearching,
    searchResults: search.searchResults,
    searchStatus: search.status,
    searchError: search.error,
    resetSearch: search.reset,

    // Server health
    serverHealth: serverHealth.data,
    isServerHealthy: serverHealth.isSuccess,
    serverHealthError: serverHealth.error,
  };
};
