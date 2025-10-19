import { ethers } from 'ethers';
import ContractABI from '../../web3/ignition/deployments/chain-314159/artifacts/FILDOSModule#FolderNFT.json';
import ContractAddress from '../../web3/ignition/deployments/chain-314159/deployed_addresses.json';

export const CONTRACT_ADDRESS = ContractAddress["FILDOSModule#FolderNFT"];

type ContractSigner = 
    | ethers.Provider 
    | ethers.Signer 
    | ethers.JsonRpcSigner;

export const getContract = (signer: ContractSigner): ethers.Contract => {
    return new ethers.Contract(
        CONTRACT_ADDRESS,
        ContractABI.abi,
        signer
    );
};