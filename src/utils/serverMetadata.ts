import { ethers } from 'ethers';
import { getContract } from './contracts';

// Public RPC endpoint for Filecoin Calibration testnet
const CALIBRATION_RPC = 'https://api.calibration.node.glif.io/rpc/v1';

/**
 * Fetches folder data from the contract on the server side
 * Used for generating metadata in Next.js layouts
 */
export async function getFolderDataForMetadata(tokenId: string): Promise<{ name: string } | null> {
  try {
    const provider = new ethers.JsonRpcProvider(CALIBRATION_RPC);
    const contract = getContract(provider);
    const data = await contract.getFolderData(tokenId);
    return {
      name: data.name || `Folder ${tokenId}`
    };
  } catch (error) {
    console.error('Error fetching folder data for metadata:', error);
    // Return null to fall back to default title
    return null;
  }
}
