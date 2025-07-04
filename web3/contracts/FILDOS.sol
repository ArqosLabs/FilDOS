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
        string[] semanticTags;
    }

    struct Share {
        uint256 folderId;   // which folder this share refers to
        address grantee;    // who received the share
        bool canRead;
        bool canWrite;
        uint256 expiresAt;  // UNIX timestamp when share expires
    }

    // Folder → its files
    mapping(uint256 => FileEntry[]) private _fileIndex;
    // tag (lowercase) → all CIDs
    mapping(string => string[]) private _tagIndex;
    // Folder → explicit read access grants
    mapping(uint256 => mapping(address => bool)) private _readAccess;

    // Share tokens
    uint256 private _nextShareId = 1;
    mapping(uint256 => Share) private _shares;
    mapping(address => uint256[]) private _sharesByGrantee;

    string private _baseTokenURI;

    /* ────────────── ERRORS ────────────── */
    error NotFolderOwner(uint256 tokenId);
    error FolderDoesNotExist(uint256 tokenId);
    error InvalidCID(string cid);
    error ShareNotFound(uint256 shareId);
    error NotShareOwner(uint256 shareId);

    /* ────────────── EVENTS ────────────── */
    event FolderMinted(uint256 indexed tokenId, address indexed owner);
    event FileAdded(
        uint256 indexed tokenId,
        string cid,
        string filename,
        string[] semanticTags
    );
    event ReadAccessSet(uint256 indexed tokenId, address indexed user, bool allowed);
    event ShareCreated(
        uint256 indexed shareId,
        uint256 indexed folderId,
        address indexed grantee,
        bool canRead,
        bool canWrite,
        uint256 expiresAt
    );
    event ShareRevoked(uint256 indexed shareId);

    /* ────────────── CONSTRUCTOR ────────────── */
    constructor(string memory baseURI_) ERC721("FolderNFT", "FDR") Ownable(msg.sender) {
        _baseTokenURI = baseURI_;
    }

    /* ────────────── METADATA ────────────── */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    /* ────────────── MINTING ────────────── */
    function mintFolder(address to) external onlyOwner returns (uint256) {
        uint256 newId = totalSupply() + 1;
        _safeMint(to, newId);
        _readAccess[newId][to] = true;
        emit FolderMinted(newId, to);
        return newId;
    }

    /* ────────────── INTERNAL HELPERS ────────────── */
    function _tokenExists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
    }

    /* ────────────── FILE INDEXING ────────────── */
    function addFile(
        uint256 tokenId,
        string calldata cid,
        string calldata filename,
        string[] calldata semanticTags
    ) external {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotFolderOwner(tokenId);
        if (bytes(cid).length == 0) revert InvalidCID(cid);

        // record file
        _fileIndex[tokenId].push(FileEntry({
            cid: cid,
            filename: filename,
            timestamp: block.timestamp,
            semanticTags: semanticTags
        }));

        // global tag index
        for (uint i = 0; i < semanticTags.length; ++i) {
            string memory tag = _toLower(semanticTags[i]);
            _tagIndex[tag].push(cid);
        }

        emit FileAdded(tokenId, cid, filename, semanticTags);
    }

    /* ────────────── READ ACCESS CONTROL ────────────── */
    function setReadAccess(
        uint256 tokenId,
        address user,
        bool allowed
    ) external {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotFolderOwner(tokenId);
        _readAccess[tokenId][user] = allowed;
        emit ReadAccessSet(tokenId, user, allowed);
    }

    /* ────────────── SHARE ACCESS ────────────── */

    /// @notice Create a share token granting read/write until `expiresAt`
    function shareFolder(
        uint256 tokenId,
        address grantee,
        bool canRead_,
        bool canWrite_,
        uint256 expiresAt
    ) external returns (uint256) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotFolderOwner(tokenId);
        require(grantee != address(0), "Invalid grantee");
        require(expiresAt > block.timestamp, "Invalid expiry");

        uint256 shareId = _nextShareId++;
        _shares[shareId] = Share({
            folderId: tokenId,
            grantee: grantee,
            canRead: canRead_,
            canWrite: canWrite_,
            expiresAt: expiresAt
        });
        _sharesByGrantee[grantee].push(shareId);

        emit ShareCreated(shareId, tokenId, grantee, canRead_, canWrite_, expiresAt);
        return shareId;
    }

    /// @notice Revoke an existing share immediately
    function revokeShare(uint256 shareId) external {
        Share storage s = _shares[shareId];
        if (s.folderId == 0) revert ShareNotFound(shareId);
        // only folder owner can revoke
        if (!_isApprovedOrOwner(msg.sender, s.folderId)) revert NotShareOwner(shareId);

        s.expiresAt = block.timestamp;
        emit ShareRevoked(shareId);
    }

    /* ────────────── GETTERS ────────────── */

    function canRead(uint256 tokenId, address user) public view returns (bool) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (_readAccess[tokenId][user] || ownerOf(tokenId) == user) return true;

        // check active shares
        uint256[] storage shares_ = _sharesByGrantee[user];
        for (uint i = 0; i < shares_.length; ++i) {
            Share storage s = _shares[shares_[i]];
            if (s.folderId == tokenId && s.canRead && s.expiresAt > block.timestamp) {
                return true;
            }
        }
        return false;
    }

    function canWrite(uint256 tokenId, address user) public view returns (bool) {
        if (!_tokenExists(tokenId)) revert FolderDoesNotExist(tokenId);
        if (_isApprovedOrOwner(user, tokenId)) return true;

        uint256[] storage shares_ = _sharesByGrantee[user];
        for (uint i = 0; i < shares_.length; ++i) {
            Share storage s = _shares[shares_[i]];
            if (s.folderId == tokenId && s.canWrite && s.expiresAt > block.timestamp) {
                return true;
            }
        }
        return false;
    }

    /// @notice Retrieve all files if caller can read
    function getFiles(uint256 tokenId) external view returns (FileEntry[] memory) {
        require(canRead(tokenId, msg.sender), "Unauthorized");
        return _fileIndex[tokenId];
    }

    /// @notice Global CIDs for a semantic tag
    function getFilesBySemanticTag(string calldata tag) external view returns (string[] memory) {
        return _tagIndex[_toLower(tag)];
    }

    /* ────────────── HELPERS ────────────── */

    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory b = bytes(str);
        for (uint i = 0; i < b.length; ++i) {
            if (b[i] >= 0x41 && b[i] <= 0x5A) {
                b[i] = bytes1(uint8(b[i]) + 32);
            }
        }
        return string(b);
    }
}
