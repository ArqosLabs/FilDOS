import { useSynapse } from "@/providers/SynapseProvider";
import { useMutation } from "@tanstack/react-query";

/**
 * Hook to download a root from the Filecoin network using Synapse.
 */
export const useDownloadRoot = (commp: string, filename: string) => {
  const { synapse } = useSynapse();

  const mutation = useMutation({
    mutationKey: ["download-piece", commp, filename],
    mutationFn: async () => {
      if (!synapse) throw new Error("Synapse not found");

      // Download file
      const uint8ArrayBytes = await synapse.storage.download(commp);

      const file = new File([uint8ArrayBytes as BlobPart], filename);

      // Download file to browser
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      return file;
    },
  });

  return {
    downloadMutation: mutation,
  };
};
