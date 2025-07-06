/*
    This is the configuration for the upload dApp using Synapse.
    It is used to configure the storage capacity, the persistence period, and the minimum number of days of lockup needed so the app can notify to pay for more storage.
*/

export const config = {
  // The number of GB of storage capacity needed to be sufficient
  storageCapacity: 10,
  // The number of days of lockup needed to be sufficient
  persistencePeriod: 30,
  // The minimum number of days of lockup needed to be sufficient
  minDaysThreshold: 10,
  // Whether to use CDN for the storage for faster retrieval
  withCDN: true,
  // AI server URL for embeddings and search
  aiServerUrl: process.env.NEXT_PUBLIC_AI_SERVER_URL || "http://localhost:5001",
} satisfies {
  storageCapacity: number;
  persistencePeriod: number;
  minDaysThreshold: number;
  withCDN: boolean;
  aiServerUrl: string;
};
