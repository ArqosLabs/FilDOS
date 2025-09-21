// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title FolderNFT — ERC‑721 for SemanticDrive folders w/ Share Tokens
contract FolderNFT is ERC721Enumerable, Ownable {
    /* ────────────── TYPES & STORAGE ────────────── */

    using EnumerableSet for EnumerableSet.Bytes32Set;

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

    // Folder → set of file CIDs (using bytes32 hashes for EnumerableSet)
    mapping(uint256 => EnumerableSet.Bytes32Set) private _folderFileCIDs;
    // CID hash → file details
    mapping(bytes32 => FileEntry) private _fileDetails;
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
    event FileRemoved(
        uint256 indexed tokenId,
        string cid,
        string filename,
        address indexed remover
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
    event FilesSearched(
        address indexed searcher,
        uint256 indexed folderId,
        string tag,
        uint256 resultsCount
    );

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

    /// @notice Check if a file contains a specific tag
    function _fileHasTag(FileEntry memory file, string memory targetTag) internal pure returns (bool) {
        bytes32 targetTagHash = keccak256(bytes(targetTag));
        for (uint256 i = 0; i < file.tags.length; i++) {
            if (keccak256(bytes(file.tags[i])) == targetTagHash) {
                return true;
            }
        }
        return false;
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

        // Create hash of CID for EnumerableSet
        bytes32 cidHash = keccak256(bytes(cid));
        
        // Check if file already exists in this folder
        require(!_folderFileCIDs[tokenId].contains(cidHash), "File already exists in folder");

        // Store file details
        _fileDetails[cidHash] = FileEntry({
            cid: cid,
            filename: filename,
            timestamp: block.timestamp,
            owner: msg.sender,
            tags: tags
        });

        // Add to folder's file set
        _folderFileCIDs[tokenId].add(cidHash);

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
        
        // Create hash of CID for EnumerableSet lookup
        bytes32 cidHash = keccak256(bytes(cid));
        
        // Check if file exists in source folder
        require(_folderFileCIDs[fromTokenId].contains(cidHash), "File not found in source folder");
        
        // Check if file already exists in destination folder
        require(!_folderFileCIDs[toTokenId].contains(cidHash), "File already exists in destination folder");
        
        // Get file details for the event
        FileEntry memory fileToMove = _fileDetails[cidHash];
        
        // Remove file from source folder
        _folderFileCIDs[fromTokenId].remove(cidHash);
        
        // Add file to destination folder
        _folderFileCIDs[toTokenId].add(cidHash);
        
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
        
        // Get the number of files in the folder
        uint256 fileCount = _folderFileCIDs[tokenId].length();
        FileEntry[] memory files = new FileEntry[](fileCount);
        
        // Iterate through the set and populate the array
        for (uint256 i = 0; i < fileCount; i++) {
            bytes32 cidHash = _folderFileCIDs[tokenId].at(i);
            files[i] = _fileDetails[cidHash];
        }
        
        return files;
    }

    /// @notice Get the number of files in a folder
    function getFileCount(uint256 tokenId) external view returns (uint256) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        require(canRead(tokenId, msg.sender) || _folderInfo[tokenId].isPublic, "Unauthorized");
        return _folderFileCIDs[tokenId].length();
    }

    /// @notice Check if a file exists in a folder
    function fileExists(uint256 tokenId, string calldata cid) external view returns (bool) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        require(canRead(tokenId, msg.sender) || _folderInfo[tokenId].isPublic, "Unauthorized");
        bytes32 cidHash = keccak256(bytes(cid));
        return _folderFileCIDs[tokenId].contains(cidHash);
    }

    /// @notice Remove a file from a folder
    function removeFile(uint256 tokenId, string calldata cid) external {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (!canWrite(tokenId, msg.sender)) revert NotFolderAccess(tokenId);
        
        bytes32 cidHash = keccak256(bytes(cid));
        require(_folderFileCIDs[tokenId].contains(cidHash), "File not found in folder");
        
        // Get file details for the event before deletion
        FileEntry memory fileToRemove = _fileDetails[cidHash];
        
        // Remove from folder
        _folderFileCIDs[tokenId].remove(cidHash);
        
        // Clean up file details if not referenced by any other folder
        delete _fileDetails[cidHash];
        
        emit FileRemoved(tokenId, cid, fileToRemove.filename, msg.sender);
    }

    /// @notice Search files by tag within a specific folder
    function searchFilesByTag(uint256 tokenId, string calldata tag) external returns (FileEntry[] memory) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        require(canRead(tokenId, msg.sender) || _folderInfo[tokenId].isPublic, "Unauthorized");
        
        // Get all files in the folder first
        uint256 fileCount = _folderFileCIDs[tokenId].length();
        FileEntry[] memory matchingFiles = new FileEntry[](fileCount);
        uint256 matchCount = 0;
        
        // Search through files for the tag
        for (uint256 i = 0; i < fileCount; i++) {
            bytes32 cidHash = _folderFileCIDs[tokenId].at(i);
            FileEntry memory file = _fileDetails[cidHash];
            
            if (_fileHasTag(file, tag)) {
                matchingFiles[matchCount] = file;
                matchCount++;
            }
        }
        
        // Resize array to exact match count
        FileEntry[] memory results = new FileEntry[](matchCount);
        for (uint256 i = 0; i < matchCount; i++) {
            results[i] = matchingFiles[i];
        }
        
        emit FilesSearched(msg.sender, tokenId, tag, matchCount);
        return results;
    }

    /// @notice Search files by tag across multiple folders that the user has access to
    function searchFilesByTagAcrossFolders(
        uint256[] calldata folderIds, 
        string calldata tag
    ) external view returns (FileEntry[] memory) {
        // Estimate maximum possible results
        uint256 maxResults = 0;
        for (uint256 f = 0; f < folderIds.length; f++) {
            uint256 tokenId = folderIds[f];
            if (_tokenExists(tokenId) && (canRead(tokenId, msg.sender) || _folderInfo[tokenId].isPublic)) {
                maxResults += _folderFileCIDs[tokenId].length();
            }
        }
        
        FileEntry[] memory allMatches = new FileEntry[](maxResults);
        uint256 totalMatches = 0;
        
        // Search through each folder
        for (uint256 f = 0; f < folderIds.length; f++) {
            uint256 tokenId = folderIds[f];
            
            // Skip if folder doesn't exist or user can't read
            if (!_tokenExists(tokenId) || (!canRead(tokenId, msg.sender) && !_folderInfo[tokenId].isPublic)) {
                continue;
            }
            
            uint256 fileCount = _folderFileCIDs[tokenId].length();
            
            // Search files in this folder
            for (uint256 i = 0; i < fileCount; i++) {
                bytes32 cidHash = _folderFileCIDs[tokenId].at(i);
                FileEntry memory file = _fileDetails[cidHash];
                
                if (_fileHasTag(file, tag)) {
                    // Check for duplicates (same CID might be in multiple folders)
                    bool isDuplicate = false;
                    for (uint256 d = 0; d < totalMatches; d++) {
                        if (keccak256(bytes(allMatches[d].cid)) == keccak256(bytes(file.cid))) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    
                    if (!isDuplicate) {
                        allMatches[totalMatches] = file;
                        totalMatches++;
                    }
                }
            }
        }
        
        // Resize to exact results
        FileEntry[] memory results = new FileEntry[](totalMatches);
        for (uint256 i = 0; i < totalMatches; i++) {
            results[i] = allMatches[i];
        }
        
        return results;
    }

    /// @notice Search files by tag across all folders owned by the caller
    function searchMyFilesByTag(string calldata tag) external view returns (FileEntry[] memory) {
        uint256 balance = balanceOf(msg.sender);
        uint256[] memory ownedFolders = new uint256[](balance);
        
        // Get all owned folders
        for (uint256 i = 0; i < balance; i++) {
            ownedFolders[i] = tokenOfOwnerByIndex(msg.sender, i);
        }
        
        // Manually search without emitting events (view function)
        uint256 maxResults = 0;
        for (uint256 f = 0; f < ownedFolders.length; f++) {
            uint256 tokenId = ownedFolders[f];
            if (_tokenExists(tokenId)) {
                maxResults += _folderFileCIDs[tokenId].length();
            }
        }
        
        FileEntry[] memory allMatches = new FileEntry[](maxResults);
        uint256 totalMatches = 0;
        
        // Search through each owned folder
        for (uint256 f = 0; f < ownedFolders.length; f++) {
            uint256 tokenId = ownedFolders[f];
            
            if (!_tokenExists(tokenId)) continue;
            
            uint256 fileCount = _folderFileCIDs[tokenId].length();
            
            // Search files in this folder
            for (uint256 i = 0; i < fileCount; i++) {
                bytes32 cidHash = _folderFileCIDs[tokenId].at(i);
                FileEntry memory file = _fileDetails[cidHash];
                
                if (_fileHasTag(file, tag)) {
                    // Check for duplicates
                    bool isDuplicate = false;
                    for (uint256 d = 0; d < totalMatches; d++) {
                        if (keccak256(bytes(allMatches[d].cid)) == keccak256(bytes(file.cid))) {
                            isDuplicate = true;
                            break;
                        }
                    }
                    
                    if (!isDuplicate) {
                        allMatches[totalMatches] = file;
                        totalMatches++;
                    }
                }
            }
        }
        
        // Resize to exact results
        FileEntry[] memory results = new FileEntry[](totalMatches);
        for (uint256 i = 0; i < totalMatches; i++) {
            results[i] = allMatches[i];
        }
        
        return results;
    }

    /// @notice Get all unique tags from files in a specific folder
    function getFolderTags(uint256 tokenId) external view returns (string[] memory) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        require(canRead(tokenId, msg.sender) || _folderInfo[tokenId].isPublic, "Unauthorized");
        
        uint256 fileCount = _folderFileCIDs[tokenId].length();
        string[] memory allTags = new string[](fileCount * 10); // Estimate max tags
        uint256 uniqueTagCount = 0;
        
        // Collect all tags
        for (uint256 i = 0; i < fileCount; i++) {
            bytes32 cidHash = _folderFileCIDs[tokenId].at(i);
            FileEntry memory file = _fileDetails[cidHash];
            
            for (uint256 j = 0; j < file.tags.length; j++) {
                string memory tag = file.tags[j];
                
                // Check if tag is already in the list
                bool exists = false;
                for (uint256 k = 0; k < uniqueTagCount; k++) {
                    if (keccak256(bytes(allTags[k])) == keccak256(bytes(tag))) {
                        exists = true;
                        break;
                    }
                }
                
                if (!exists) {
                    allTags[uniqueTagCount] = tag;
                    uniqueTagCount++;
                }
            }
        }
        
        // Return array with exact size
        string[] memory uniqueTags = new string[](uniqueTagCount);
        for (uint256 i = 0; i < uniqueTagCount; i++) {
            uniqueTags[i] = allTags[i];
        }
        
        return uniqueTags;
    }

    /// @notice Search files that contain ALL specified tags within a folder
    function searchFilesByMultipleTags(
        uint256 tokenId, 
        string[] calldata tags
    ) external returns (FileEntry[] memory) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        require(canRead(tokenId, msg.sender) || _folderInfo[tokenId].isPublic, "Unauthorized");
        
        uint256 fileCount = _folderFileCIDs[tokenId].length();
        FileEntry[] memory matchingFiles = new FileEntry[](fileCount);
        uint256 matchCount = 0;
        
        // Search through files
        for (uint256 i = 0; i < fileCount; i++) {
            bytes32 cidHash = _folderFileCIDs[tokenId].at(i);
            FileEntry memory file = _fileDetails[cidHash];
            
            // Check if file has ALL specified tags
            bool hasAllTags = true;
            for (uint256 j = 0; j < tags.length; j++) {
                if (!_fileHasTag(file, tags[j])) {
                    hasAllTags = false;
                    break;
                }
            }
            
            if (hasAllTags) {
                matchingFiles[matchCount] = file;
                matchCount++;
            }
        }
        
        // Resize array to exact match count
        FileEntry[] memory results = new FileEntry[](matchCount);
        for (uint256 i = 0; i < matchCount; i++) {
            results[i] = matchingFiles[i];
        }
        
        // Emit event with tag count
        emit FilesSearched(msg.sender, tokenId, "multiple-tags", matchCount);
        return results;
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
