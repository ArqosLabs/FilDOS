// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title FolderNFT — ERC‑721 for SemanticDrive folders w/ Share Tokens
contract FolderNFT is ERC721Enumerable, Ownable {
    /* ────────────── TYPES & STORAGE ────────────── */

    struct FileEntry {
        string cid;
        string filename;
        uint256 timestamp;
        address owner;
        string[] tags;
    }

    struct Share {
        uint256 folderId;
        address grantee;
        bool canRead;
        bool canWrite;
    }

    struct FolderInfo {
        string name;
        string folderType;
        bool isPublic;
        address owner;
        uint256 createdAt;
    }

    // Folder → its files
    mapping(uint256 => FileEntry[]) private _fileIndex;
    // Folder → its metadata
    mapping(uint256 => FolderInfo) private _folderInfo;

    // Share tokens
    uint256 private _nextShareId = 1;
    mapping(uint256 => Share) private _shares;
    mapping(address => uint256[]) private _sharesByGrantee;

    /* ────────────── ERRORS ────────────── */
    error NotFolderOwner(uint256 tokenId);
    error NotFolderAccess(uint256 tokenId);
    error FolderDoesNotExist(uint256 tokenId);
    error InvalidCID(string cid);
    error ShareNotFound(uint256 shareId);
    error NotShareOwner(uint256 shareId);

    /* ────────────── EVENTS ────────────── */
    event FolderMinted(uint256 indexed tokenId, address indexed owner, string name, string folderType);
    event FileAdded(
        uint256 indexed tokenId,
        string cid,
        string filename,
        address indexed owner,
        string[] tags
    );
    event FileMoved(
        uint256 indexed fromTokenId,
        uint256 indexed toTokenId,
        string cid,
        string filename,
        address indexed mover
    );
    event FolderTypeChanged(uint256 indexed tokenId, string newType);
    event FolderPublicityChanged(uint256 indexed tokenId, bool isPublic);
    event ShareCreated(
        uint256 indexed shareId,
        uint256 indexed folderId,
        address indexed grantee,
        bool canRead,
        bool canWrite
    );
    event ShareRevoked(uint256 indexed shareId);

    /* ────────────── CONSTRUCTOR ────────────── */
    constructor() ERC721("FolderNFT", "FDR") Ownable(msg.sender) {
    }

    /* ────────────── MINTING ────────────── */
    function mintFolder(string calldata name, string calldata folderType) external returns (uint256) {
        address to = msg.sender;
        uint256 newId = totalSupply() + 1;
        _safeMint(to, newId);
        
        // Set folder metadata
        _folderInfo[newId] = FolderInfo({
            name: name,
            folderType: folderType,
            isPublic: false,
            owner: to,
            createdAt: block.timestamp
        });
        
        emit FolderMinted(newId, to, name, folderType);
        return newId;
    }

    /* ────────────── INTERNAL HELPERS ────────────── */
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /* ────────────── FILE INDEXING ────────────── */
    function addFile(
        uint256 tokenId,
        string calldata cid,
        string calldata filename,
        string[] calldata tags
    ) external {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (!canWrite(tokenId, msg.sender)) revert NotFolderAccess(tokenId);
        if (bytes(cid).length == 0) revert InvalidCID(cid);

        // record file
        _fileIndex[tokenId].push(FileEntry({
            cid: cid,
            filename: filename,
            timestamp: block.timestamp,
            owner: msg.sender,
            tags: tags
        }));

        emit FileAdded(tokenId, cid, filename, msg.sender, tags);
    }

    /* ────────────── FILE MANAGEMENT ────────────── */
    function moveFile(
        uint256 fromTokenId,
        uint256 toTokenId,
        string calldata cid
    ) external {
        if (!_tokenExists(fromTokenId)) revert FolderDoesNotExist(fromTokenId);
        if (!_tokenExists(toTokenId)) revert FolderDoesNotExist(toTokenId);
        if (!canWrite(fromTokenId, msg.sender)) revert NotFolderAccess(fromTokenId);
        if (!canWrite(toTokenId, msg.sender)) revert NotFolderAccess(toTokenId);
        
        // Find and remove file from source folder
        FileEntry[] storage fromFiles = _fileIndex[fromTokenId];
        uint256 fileIndex = type(uint256).max;
        FileEntry memory fileToMove;
        
        for (uint i = 0; i < fromFiles.length; i++) {
            if (keccak256(bytes(fromFiles[i].cid)) == keccak256(bytes(cid))) {
                fileIndex = i;
                fileToMove = fromFiles[i];
                break;
            }
        }
        
        require(fileIndex != type(uint256).max, "File not found in source folder");
        
        // Remove file from source folder
        fromFiles[fileIndex] = fromFiles[fromFiles.length - 1];
        fromFiles.pop();
        
        // Add file to destination folder
        _fileIndex[toTokenId].push(fileToMove);
        
        emit FileMoved(fromTokenId, toTokenId, cid, fileToMove.filename, msg.sender);
    }

    function setFolderPublic(uint256 tokenId, bool isPublic) external {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotFolderAccess(tokenId);
        
        _folderInfo[tokenId].isPublic = isPublic;
        emit FolderPublicityChanged(tokenId, isPublic);
    }

    /* ────────────── SHARE ACCESS ────────────── */

    /// @notice Create a share token granting read/write access
    function shareFolder(
        uint256 tokenId,
        address grantee,
        bool canRead_,
        bool canWrite_
    ) external returns (uint256) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotFolderAccess(tokenId);
        require(grantee != address(0), "Invalid grantee");

        uint256 shareId = _nextShareId++;
        _shares[shareId] = Share({
            folderId: tokenId,
            grantee: grantee,
            canRead: canRead_,
            canWrite: canWrite_
        });
        _sharesByGrantee[grantee].push(shareId);

        emit ShareCreated(shareId, tokenId, grantee, canRead_, canWrite_);
        return shareId;
    }

    /// @notice Revoke an existing share immediately
    function revokeShare(uint256 shareId) external {
        Share storage s = _shares[shareId];
        if (s.folderId == 0) revert ShareNotFound(shareId);
        // only folder owner can revoke
        if (ownerOf(s.folderId) != msg.sender) revert NotShareOwner(shareId);

        // Remove from grantee's share list
        uint256[] storage granteeShares = _sharesByGrantee[s.grantee];
        for (uint i = 0; i < granteeShares.length; i++) {
            if (granteeShares[i] == shareId) {
                granteeShares[i] = granteeShares[granteeShares.length - 1];
                granteeShares.pop();
                break;
            }
        }
        
        // Delete the share
        delete _shares[shareId];
        emit ShareRevoked(shareId);
    }



    /* ────────────── GETTERS ────────────── */

    function canRead(uint256 tokenId, address user) public view returns (bool) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (_folderInfo[tokenId].isPublic) return true;
        if (ownerOf(tokenId) == user) return true;

        // check active shares
        uint256[] storage shares_ = _sharesByGrantee[user];
        for (uint i = 0; i < shares_.length; ++i) {
            Share storage s = _shares[shares_[i]];
            if (s.folderId == tokenId && s.canRead) {
                return true;
            }
        }
        return false;
    }

    function canWrite(uint256 tokenId, address user) public view returns (bool) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (ownerOf(tokenId) == user) return true;

        uint256[] storage shares_ = _sharesByGrantee[user];
        for (uint i = 0; i < shares_.length; ++i) {
            Share storage s = _shares[shares_[i]];
            if (s.folderId == tokenId && s.canWrite) {
                return true;
            }
        }
        return false;
    }

    /// @notice Retrieve folder info
    function getFolderData(uint256 tokenId) external view returns (FolderInfo memory data_) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        else data_ = _folderInfo[tokenId];
    }

    /// @notice Retrieve all files if caller can read
    function getFiles(uint256 tokenId) external view returns (FileEntry[] memory) {
        require(canRead(tokenId, msg.sender) || _folderInfo[tokenId].isPublic, "Unauthorized");
        return _fileIndex[tokenId];
    }

    /// @notice Get folder access details for a user
    function getFolderAccess(uint256 tokenId, address user) external view returns (bool canRead_, bool canWrite_, bool isOwner) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        
        isOwner = ownerOf(tokenId) == user;
        canRead_ = canRead(tokenId, user);
        canWrite_ = canWrite(tokenId, user);
        
        return (canRead_, canWrite_, isOwner);
    }

    /// @notice Get all folders owned by a specific address
    function getFoldersOwnedBy(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory ownedFolders = new uint256[](balance);
        
        for (uint256 i = 0; i < balance; i++) {
            ownedFolders[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return ownedFolders;
    }

    /// @notice Get all public folders
    function getPublicFolders() external view returns (uint256[] memory) {
        uint256[] memory publicFolders = new uint256[](totalSupply());
        uint256 publicCount = 0;
        
        for (uint256 i = 1; i <= totalSupply(); i++) {
            if (_folderInfo[i].isPublic) {
                publicFolders[publicCount++] = i;
            }
        }
        
        assembly {
            mstore(publicFolders, publicCount)
        }
        
        return publicFolders;
    }

    /// @notice Get all folders shared to a specific user
    function getFoldersSharedTo(address user) external view returns (uint256[] memory) {
        uint256[] storage userShares = _sharesByGrantee[user];
        uint256[] memory sharedFolders = new uint256[](userShares.length);
        uint256 folderCount = 0;
        
        for (uint256 i = 0; i < userShares.length; i++) {
            Share storage s = _shares[userShares[i]];
            if (s.folderId != 0) {
                // Check if folder is already in the list (avoid duplicates)
                bool exists = false;
                for (uint256 j = 0; j < folderCount; j++) {
                    if (sharedFolders[j] == s.folderId) {
                        exists = true;
                        break;
                    }
                }
                if (!exists) {
                    sharedFolders[folderCount++] = s.folderId;
                }
            }
        }
        
        // Resize array to exact size
        assembly {
            mstore(sharedFolders, folderCount)
        }
        
        return sharedFolders;
    }

}
