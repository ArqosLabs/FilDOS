import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  SPRegistryService,
  type PDPOffering,
  type ProviderRegistrationInfo,
  type ProductType
} from "@filoz/synapse-sdk/sp-registry";
import { useSynapse } from "@/providers/SynapseProvider";
import { useAccount } from "wagmi";

/**
 * Hook to get all active storage providers
 * @returns Query with all active providers
 */
export const useActiveProviders = () => {
  const { synapse, warmStorageService } = useSynapse();

  return useQuery({
    queryKey: ["sp-registry", "active-providers"],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      return await spRegistry.getAllActiveProviders();
    },
    enabled: !!synapse && !!warmStorageService,
  });
};

/**
 * Hook to get a specific provider by ID
 * @param providerId - The provider ID to fetch
 * @returns Query with provider details
 */
export const useProvider = (providerId?: number) => {
  const { synapse, warmStorageService } = useSynapse();

  return useQuery({
    queryKey: ["sp-registry", "provider", providerId],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (providerId === undefined) throw new Error("Provider ID not provided");
      
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      return await spRegistry.getProvider(providerId);
    },
    enabled: !!synapse && !!warmStorageService && providerId !== undefined,
  });
};

/**
 * Hook to get a provider by wallet address
 * @param address - The wallet address to look up
 * @returns Query with provider details
 */
export const useProviderByAddress = (address?: string) => {
  const { synapse, warmStorageService } = useSynapse();

  return useQuery({
    queryKey: ["sp-registry", "provider-by-address", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Address not provided");
      
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      return await spRegistry.getProviderByAddress(address);
    },
    enabled: !!synapse && !!warmStorageService && !!address,
  });
};

/**
 * Hook to check if an address is a registered provider
 * @param address - The wallet address to check
 * @returns Query with registration status
 */
export const useIsRegisteredProvider = (address?: string) => {
  const { synapse, warmStorageService } = useSynapse();

  return useQuery({
    queryKey: ["sp-registry", "is-registered", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Address not provided");
      
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      return await spRegistry.isRegisteredProvider(address);
    },
    enabled: !!synapse && !!warmStorageService && !!address,
  });
};

/**
 * Hook to get provider ID by address
 * @param address - The wallet address to look up
 * @returns Query with provider ID
 */
export const useProviderIdByAddress = (address?: string) => {
  const { synapse, warmStorageService } = useSynapse();

  return useQuery({
    queryKey: ["sp-registry", "provider-id", address],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Address not provided");
      
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      return await spRegistry.getProviderIdByAddress(address);
    },
    enabled: !!synapse && !!warmStorageService && !!address,
  });
};

/**
 * Hook to check if a provider is active
 * @param providerId - The provider ID to check
 * @returns Query with active status
 */
export const useIsProviderActive = (providerId?: number) => {
  const { synapse, warmStorageService } = useSynapse();

  return useQuery({
    queryKey: ["sp-registry", "is-active", providerId],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (providerId === undefined) throw new Error("Provider ID not provided");
      
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      return await spRegistry.isProviderActive(providerId);
    },
    enabled: !!synapse && !!warmStorageService && providerId !== undefined,
  });
};

/**
 * Hook to get PDP service details for a provider
 * @param providerId - The provider ID to fetch service details for
 * @returns Query with PDP service details
 */
export const usePDPService = (providerId?: number) => {
  const { synapse, warmStorageService } = useSynapse();

  return useQuery({
    queryKey: ["sp-registry", "pdp-service", providerId],
    queryFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (providerId === undefined) throw new Error("Provider ID not provided");
      
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      return await spRegistry.getPDPService(providerId);
    },
    enabled: !!synapse && !!warmStorageService && providerId !== undefined,
  });
};

/**
 * Hook to register a new storage provider
 * @returns Mutation and status
 */
export const useRegisterProvider = () => {
  const [status, setStatus] = useState<string>("");
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();

  const mutation = useMutation({
    mutationFn: async (registrationInfo: ProviderRegistrationInfo) => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Wallet not connected");
      
      setStatus("Preparing registration transaction...");
      
      const signer = synapse.getSigner();
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      setStatus("Registering storage provider...");
      const transaction = await spRegistry.registerProvider(
        signer,
        registrationInfo
      );
      await transaction.wait();
      
      setStatus("Successfully registered storage provider");
    },
    onSuccess: () => {
      setStatus("Registration was successful!");
    },
    onError: (error) => {
      console.error("Registration failed:", error);
      setStatus(
        `❌ ${error.message || "Registration failed. Please try again."}`
      );
    },
  });

  return { mutation, status };
};

/**
 * Hook to update provider information
 * @returns Mutation and status
 */
export const useUpdateProviderInfo = () => {
  const [status, setStatus] = useState<string>("");
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();

  const mutation = useMutation({
    mutationFn: async ({
      name,
      description,
    }: {
      name: string;
      description: string;
    }) => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Wallet not connected");
      
      setStatus("Preparing update transaction...");
      
      const signer = synapse.getSigner();
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      setStatus("Updating provider information...");
      const transaction = await spRegistry.updateProviderInfo(
        signer,
        name,
        description
      );
      await transaction.wait();
      
      setStatus("Successfully updated provider information");
    },
    onSuccess: () => {
      setStatus("Update was successful!");
    },
    onError: (error) => {
      console.error("Update failed:", error);
      setStatus(
        `❌ ${error.message || "Update failed. Please try again."}`
      );
    },
  });

  return { mutation, status };
};

/**
 * Hook to remove a provider registration
 * @returns Mutation and status
 */
export const useRemoveProvider = () => {
  const [status, setStatus] = useState<string>("");
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Wallet not connected");
      
      setStatus("Preparing removal transaction...");
      
      const signer = synapse.getSigner();
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      setStatus("Removing provider registration...");
      const transaction = await spRegistry.removeProvider(signer);
      await transaction.wait();
      
      setStatus("Successfully removed provider registration");
    },
    onSuccess: () => {
      setStatus("Removal was successful!");
    },
    onError: (error) => {
      console.error("Removal failed:", error);
      setStatus(
        `❌ ${error.message || "Removal failed. Please try again."}`
      );
    },
  });

  return { mutation, status };
};

/**
 * Hook to add a PDP product
 * @returns Mutation and status
 */
export const useAddPDPProduct = () => {
  const [status, setStatus] = useState<string>("");
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();

  const mutation = useMutation({
    mutationFn: async ({
      pdpOffering,
      capabilities,
    }: {
      pdpOffering: PDPOffering;
      capabilities?: Record<string, string>;
    }) => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Wallet not connected");
      
      setStatus("Preparing transaction...");
      
      const signer = synapse.getSigner();
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      setStatus("Adding PDP product...");
      const transaction = await spRegistry.addPDPProduct(
        signer,
        pdpOffering,
        capabilities
      );
      await transaction.wait();
      
      setStatus("Successfully added PDP product");
    },
    onSuccess: () => {
      setStatus("PDP product added successfully!");
    },
    onError: (error) => {
      console.error("Add PDP product failed:", error);
      setStatus(
        `❌ ${error.message || "Failed to add PDP product. Please try again."}`
      );
    },
  });

  return { mutation, status };
};

/**
 * Hook to update a PDP product
 * @returns Mutation and status
 */
export const useUpdatePDPProduct = () => {
  const [status, setStatus] = useState<string>("");
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();

  const mutation = useMutation({
    mutationFn: async ({
      pdpOffering,
      capabilities,
    }: {
      pdpOffering: PDPOffering;
      capabilities?: Record<string, string>;
    }) => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Wallet not connected");
      
      setStatus("Preparing update transaction...");
      
      const signer = synapse.getSigner();
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      setStatus("Updating PDP product...");
      const transaction = await spRegistry.updatePDPProduct(
        signer,
        pdpOffering,
        capabilities
      );
      await transaction.wait();
      
      setStatus("Successfully updated PDP product");
    },
    onSuccess: () => {
      setStatus("PDP product updated successfully!");
    },
    onError: (error) => {
      console.error("Update PDP product failed:", error);
      setStatus(
        `❌ ${error.message || "Failed to update PDP product. Please try again."}`
      );
    },
  });

  return { mutation, status };
};

/**
 * Hook to remove a product
 * @returns Mutation and status
 */
export const useRemoveProduct = () => {
  const [status, setStatus] = useState<string>("");
  const { synapse, warmStorageService } = useSynapse();
  const { address } = useAccount();

  const mutation = useMutation({
    mutationFn: async ({ productType }: { productType: ProductType }) => {
      if (!synapse) throw new Error("Synapse not ready");
      if (!warmStorageService) throw new Error("Warm storage service not ready");
      if (!address) throw new Error("Wallet not connected");
      
      setStatus("Preparing removal transaction...");
      
      const signer = synapse.getSigner();
      const provider = synapse.getProvider();
      const registryAddress = warmStorageService.getServiceProviderRegistryAddress();
      const spRegistry = new SPRegistryService(provider, registryAddress);
      
      setStatus("Removing product...");
      const transaction = await spRegistry.removeProduct(
        signer,
        productType
      );
      await transaction.wait();
      
      setStatus("Successfully removed product");
    },
    onSuccess: () => {
      setStatus("Product removed successfully!");
    },
    onError: (error) => {
      console.error("Removal failed:", error);
      setStatus(
        `❌ ${error.message || "Removal failed. Please try again."}`
      );
    },
  });

  return { mutation, status };
};
