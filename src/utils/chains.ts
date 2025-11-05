import { defineChain } from "thirdweb/chains";

/**
 * Filecoin Calibration Testnet
 * Chain ID: 314159
 */
export const filecoinCalibration = defineChain({
  id: 314159,
  name: "Filecoin Calibration",
  nativeCurrency: {
    name: "Filecoin",
    symbol: "tFIL",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Filscan",
      url: "https://calibration.filscan.io/en",
      apiUrl: "https://calibration.filscan.io/api",
    },
  ],
  rpc: "https://api.calibration.node.glif.io/rpc/v1",
});

/**
 * Filecoin Mainnet
 * Chain ID: 314
 */
export const filecoinMainnet = defineChain({
  id: 314,
  name: "Filecoin Mainnet",
  nativeCurrency: {
    name: "Filecoin",
    symbol: "FIL",
    decimals: 18,
  },
  blockExplorers: [
    {
      name: "Filfox",
      url: "https://filfox.info",
      apiUrl: "https://filfox.info/api",
    },
  ],
  rpc: "https://api.node.glif.io/rpc/v1",
});


export const supportedChains = [filecoinCalibration, filecoinMainnet];
export const defaultChain = filecoinCalibration;
