// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FILDOSModule = buildModule("FILDOSModule", (m) => {

  // Deploy the FILDOS contract
  const fildos = m.contract("FolderNFT");

  return { fildos };
});

export default FILDOSModule;
