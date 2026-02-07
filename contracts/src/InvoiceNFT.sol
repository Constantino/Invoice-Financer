// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {
    ERC721URIStorage
} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InvoiceNFT
 * @dev ERC721 NFT contract for representing invoices on-chain
 * @notice Each NFT represents a unique invoice with associated metadata
 */
contract InvoiceNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    event InvoiceMinted(
        uint256 indexed tokenId,
        address indexed to,
        string uri
    );

    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        _nextTokenId = 1;
    }

    /**
     * @dev Mints a new invoice NFT to the specified address
     * @param to The address to mint the NFT to
     * @param uri The URI pointing to the invoice metadata
     * @return tokenId The ID of the newly minted token
     */
    function mint(
        address to,
        string memory uri
    ) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit InvoiceMinted(tokenId, to, uri);
        return tokenId;
    }

    /**
     * @dev Burns an invoice NFT
     * @param tokenId The ID of the token to burn
     */
    function burn(uint256 tokenId) external {
        require(
            _isAuthorized(_ownerOf(tokenId), msg.sender, tokenId),
            "ERC721: caller is not token owner or approved"
        );
        _burn(tokenId);
    }

    /**
     * @dev Updates the token URI for an existing invoice NFT
     * @param tokenId The ID of the token to update
     * @param uri The new URI pointing to the invoice metadata
     */
    function updateTokenURI(
        uint256 tokenId,
        string memory uri
    ) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "ERC721: invalid token ID");
        _setTokenURI(tokenId, uri);
    }

    /**
     * @dev Returns the next token ID that will be minted
     * @return The next token ID
     */
    function nextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Override required by Solidity
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
