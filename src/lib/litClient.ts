import { disconnectWeb3, LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptFile, decryptToFile } from "@lit-protocol/encryption";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS } from "@/utils/contracts";

let litNodeClient: LitNodeClient | null = null;

function getAccessControlConditions(tokenId: string) {
  return [
    {
      contractAddress: CONTRACT_ADDRESS,
      functionName: "canRead",
      functionParams: [tokenId, ":userAddress"],
      functionAbi: {
        type: "function",
        stateMutability: "view",
        outputs: [
          { type: "bool", name: "", internalType: "bool" }
        ],
        name: "canRead",
        inputs: [
          { type: "uint256", name: "tokenId", internalType: "uint256" },
          { type: "address", name: "user", internalType: "address" }
        ]
      },
      chain: "filecoinCalibrationTestnet",
      returnValueTest: {
        key: "",
        comparator: "=",
        value: "true"
      }
    }
  ];
}


// Initialize Lit client
export async function initLitClient(): Promise<LitNodeClient> {
  disconnectWeb3();
  if (litNodeClient && litNodeClient.ready) {
    return litNodeClient;
  }

  litNodeClient = new LitNodeClient({
    litNetwork: "datil-dev",
  });

  await litNodeClient.connect();
  return litNodeClient;
}

// Get Lit client instance
export function getLitClient(): LitNodeClient | null {
  return litNodeClient;
}

// Encrypt file function
export async function encryptFileWithLit(
  file: File,
  walletAddress: string,
  tokenId: string
): Promise<{
  ciphertext: string;
  dataToEncryptHash: string;
  originalFileName: string;
  originalFileSize: number;
  originalFileType: string;
  encryptedAt: number;
}> {
  await initLitClient();

  // Get access control conditions
  const accessControlConditionsList = getAccessControlConditions(tokenId);

  // Encrypt the file
  const result = await encryptFile(
    {
      file,
      chain: "filecoinCalibrationTestnet",
      evmContractConditions: accessControlConditionsList,
    },
    litNodeClient!
  );

  return {
    ciphertext: result.ciphertext,
    dataToEncryptHash: result.dataToEncryptHash,
    originalFileName: file.name,
    originalFileSize: file.size,
    originalFileType: file.type,
    encryptedAt: Date.now(),
  };
}

// Get auth signature with proper SIWE format
export async function getAuthSig(provider?: ethers.BrowserProvider) {
  // Use provided provider or fall back to window.ethereum
  let ethProvider: ethers.BrowserProvider;
  
  if (provider) {
    ethProvider = provider;
  } else if (window.ethereum) {
    ethProvider = new ethers.BrowserProvider(window.ethereum);
  } else {
    throw new Error("No Ethereum provider found");
  }

  const signer = await ethProvider.getSigner();
  const address = await signer.getAddress();

  // Create a proper SIWE (Sign-In with Ethereum) message
  const domain = window.location.host;
  const origin = window.location.origin;
  const statement = "Sign in with Ethereum to the app.";
  
  // Generate current timestamp and expiration (24 hours from now)
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  // SIWE message format
  const siweMessage = `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: 314159
Nonce: ${Math.random().toString(36).substring(2, 15)}
Issued At: ${issuedAt}
Expiration Time: ${expirationTime}`;

  const signature = await signer.signMessage(siweMessage);

  return {
    sig: signature,
    derivedVia: "web3.eth.personal.sign",
    signedMessage: siweMessage,
    address: address,
  };
}

// Decrypt file function
export async function decryptFileWithLit(
  ciphertext: string,
  dataToEncryptHash: string,
  metadata: {
    originalFileName: string;
    originalFileSize: number;
    originalFileType: string;
  },
  walletAddress: string,
  tokenId: string,
  provider?: ethers.BrowserProvider
): Promise<File> {
  await initLitClient();

  // Get auth signature with the provided provider
  const authSig = await getAuthSig(provider);

  // Simple access control
  const accessControlConditions = getAccessControlConditions(tokenId);

  // Decrypt the file
  const decryptedFile = await decryptToFile(
    {
      ciphertext,
      dataToEncryptHash,
      evmContractConditions: accessControlConditions,
      authSig,
      chain: "filecoinCalibrationTestnet",
    },
    litNodeClient!
  );

  // Return as File object with original name
  const blob = new Blob([new Uint8Array(decryptedFile)]);
  return new File([blob], metadata.originalFileName, {
    type: metadata.originalFileType,
  });
}



