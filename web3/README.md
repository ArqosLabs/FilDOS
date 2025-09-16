# FilDOS Smart Contracts

Smart contracts for the FilDOS decentralized storage platform, built on Filecoin FEVM (Filecoin Ethereum Virtual Machine).

## 🏗️ Overview

FilDOS uses ERC-721 NFTs to represent folders in the decentralized storage system. Each folder NFT contains metadata, access controls, and embedding indexes, enabling true ownership and programmable access to decentralized storage.

## 📄 Contracts

### FILDOS.sol
The main contract implementing folder NFTs with the following features:

- **ERC-721 Compliance**: Standard NFT functionality
- **Folder Management**: Create, manage, and transfer folder ownership
- **Access Control**: Permission-based file access
- **Metadata Storage**: On-chain folder metadata and indexes
- **Programmable Sharing**: Smart contract-based sharing logic

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Hardhat development environment

### Installation

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test
```

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.js --network localhost
```

## 🌐 Network Configuration

### Filecoin Calibration Testnet

- **Network Name**: Filecoin Calibration
- **RPC URL**: https://api.calibration.node.glif.io/rpc/v1
- **Chain ID**: 314159
- **Currency**: tFIL
- **Block Explorer**: https://calibration.filfox.info/

### Hardhat Configuration

```javascript
// hardhat.config.ts
networks: {
  calibration: {
    url: "https://api.calibration.node.glif.io/rpc/v1",
    chainId: 314159,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

## 🚀 Deployment

### Deploy to Calibration Testnet

```bash
# Deploy contracts
npx hardhat run scripts/deploy.js --network calibration

# Verify contracts
npx hardhat verify --network calibration DEPLOYED_CONTRACT_ADDRESS
```

### Environment Variables

Create a `.env` file:
```env
PRIVATE_KEY=your_private_key_here
CALIBRATION_RPC_URL=https://api.calibration.node.glif.io/rpc/v1
```

## 📊 Contract Features

### Folder NFT Structure

```solidity
struct Folder {
    uint256 id;
    string name;
    string description;
    string metadataURI;
    address owner;
    uint256 createdAt;
    uint256 updatedAt;
    bool isPublic;
    mapping(address => bool) accessList;
}
```

### Key Functions

- `createFolder(string name, string description)`: Create a new folder NFT
- `setFolderMetadata(uint256 tokenId, string uri)`: Update folder metadata
- `grantAccess(uint256 tokenId, address user)`: Grant access to a user
- `revokeAccess(uint256 tokenId, address user)`: Revoke user access
- `setPublic(uint256 tokenId, bool isPublic)`: Make folder public/private

## 🔐 Access Control

### Permission Levels

1. **Owner**: Full control over the folder
2. **Granted Users**: Read/write access as determined by owner
3. **Public**: Read-only access if folder is set to public

### Access Patterns

```solidity
// Check if user has access to folder
function hasAccess(uint256 tokenId, address user) public view returns (bool) {
    return ownerOf(tokenId) == user || 
           folders[tokenId].accessList[user] || 
           folders[tokenId].isPublic;
}
```

## 📁 Metadata Schema

### Folder Metadata JSON
```json
{
  "name": "My Documents",
  "description": "Personal document storage",
  "image": "ipfs://QmHash/folder-icon.png",
  "attributes": [
    {
      "trait_type": "File Count",
      "value": 42
    },
    {
      "trait_type": "Size",
      "value": "1.2 GB"
    },
    {
      "trait_type": "Created",
      "value": "2025-01-15"
    }
  ],
  "external_url": "https://fildos.io/folder/123",
  "animation_url": "ipfs://QmHash/embedding-index.pkl"
}
```

## 🧪 Testing

### Test Structure

```
test/
├── FILDOS.test.ts       # Main contract tests
├── access-control.test.ts # Permission testing
├── metadata.test.ts     # Metadata handling
└── integration.test.ts  # Full workflow tests
```

### Running Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/FILDOS.test.ts

# Run tests with coverage
npx hardhat coverage
```

## 📊 Gas Optimization

### Efficient Operations

- **Batch Operations**: Multiple actions in single transaction
- **Packed Storage**: Efficient storage layout
- **Event Logging**: Minimal on-chain data with events

### Gas Costs (Estimated)

- Create Folder: ~200,000 gas
- Grant Access: ~50,000 gas
- Update Metadata: ~80,000 gas
- Transfer Ownership: ~100,000 gas

## 🔧 Integration

### Frontend Integration

```typescript
// Using wagmi/viem
import { useContract, useContractWrite } from 'wagmi'

const contract = useContract({
  address: '0x...',
  abi: FILDOS_ABI,
})

const { write: createFolder } = useContractWrite({
  ...contract,
  functionName: 'createFolder',
})
```

### Backend Integration

```javascript
// Using ethers.js
const contract = new ethers.Contract(
  CONTRACT_ADDRESS,
  FILDOS_ABI,
  signer
)

const tx = await contract.createFolder("My Folder", "Description")
await tx.wait()
```

## 🌟 Advanced Features

### Programmable Sharing

```solidity
// Time-limited access
function grantTemporaryAccess(
    uint256 tokenId, 
    address user, 
    uint256 duration
) external onlyOwner {
    // Implementation
}

// Conditional access
function grantConditionalAccess(
    uint256 tokenId, 
    address user, 
    bytes32 condition
) external onlyOwner {
    // Implementation
}
```

### Delegation & Proxy Access

```solidity
// Delegate folder management
function delegateFolder(uint256 tokenId, address delegate) external onlyOwner {
    // Allow delegate to manage folder on behalf of owner
}
```

## 🔄 Upgrade Path

### Contract Upgrades

- Proxy pattern for upgradeable contracts
- Migration scripts for data transfer
- Backward compatibility maintenance

### Version Management

```bash
# Deploy new version
npx hardhat run scripts/deploy-v2.js --network calibration

# Migrate data
npx hardhat run scripts/migrate-data.js --network calibration
```

## 📈 Monitoring

### Contract Events

```solidity
event FolderCreated(uint256 indexed tokenId, address indexed owner, string name);
event AccessGranted(uint256 indexed tokenId, address indexed user);
event MetadataUpdated(uint256 indexed tokenId, string newURI);
```

### Indexing & Queries

```javascript
// Listen to events
contract.on('FolderCreated', (tokenId, owner, name) => {
    console.log(`New folder created: ${name} by ${owner}`)
})

// Query historical events
const events = await contract.queryFilter('FolderCreated', fromBlock, toBlock)
```

## 🛡️ Security

### Security Considerations

- **Access Control**: Proper permission checking
- **Reentrancy Protection**: SafeMath and checks-effects-interactions
- **Input Validation**: Comprehensive input sanitization
- **Gas Limits**: Protection against gas limit attacks

### Audit Checklist

- [ ] Access control implemented correctly
- [ ] No reentrancy vulnerabilities
- [ ] Proper event emission
- [ ] Gas optimization
- [ ] Error handling
- [ ] Upgrade safety

## 🚀 Production Deployment

### Deployment Checklist

- [ ] Contracts compiled and tested
- [ ] Environment variables configured
- [ ] Network configuration verified
- [ ] Gas price settings optimized
- [ ] Deployment scripts tested
- [ ] Verification scripts prepared

### Post-Deployment

```bash
# Verify contracts on block explorer
npx hardhat verify --network calibration DEPLOYED_ADDRESS

# Set up monitoring
npx hardhat run scripts/setup-monitoring.js --network calibration
```

## 📚 References

- [Hardhat Documentation](https://hardhat.org/docs)
- [Filecoin FEVM Documentation](https://docs.filecoin.io/smart-contracts/fundamentals/the-fevm)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Building the future of decentralized storage with smart contracts! 🚀**
