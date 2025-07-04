// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FILDOSModule = buildModule("FILDOSModule", (m) => {
  // Base URI for the NFT metadata
  const baseURI = m.getParameter("baseURI", "https://api.fildos.io/metadata/");

  // Deploy the FILDOS contract
  const fildos = m.contract("FolderNFT", [baseURI]);

  return { fildos };
});

export default FILDOSModule;
