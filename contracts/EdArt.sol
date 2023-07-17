// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract EdArt is ERC721, ERC721Enumerable, ERC721Burnable, Ownable {
    string public PROVENANCE;
    bool public saleIsActive = false;
    string private _baseURIextended;
    address payable public immutable shareholderAddress;
    
    uint256 public cost;
    uint256 public maxTokenSupply;
    uint256 public maxTokenPurchase;

    mapping(uint256 => bool) private _redeemed;

    event Mint(address indexed to, uint256 indexed tokenId);
    event Redeem(address indexed to, uint256 indexed tokenId);
    event Reserve(address indexed to);
    event Burn(address indexed to, uint256 indexed tokenId);
    event Withdraw(address indexed to);

    constructor(address payable shareholderAddress_, string memory baseURI_, uint256 cost_, uint256 maxSupply, uint256 maxPurchase) ERC721("Ed in Between Lines", "EdArt") {
        require(shareholderAddress_ != address(0));
        shareholderAddress = shareholderAddress_;
        _baseURIextended = baseURI_;
        cost = cost_;
        maxTokenSupply = maxSupply;
        maxTokenPurchase = maxPurchase;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function setBaseURI(string memory baseURI_) external onlyOwner() {
        _baseURIextended = baseURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function setProvenance(string memory provenance) public onlyOwner {
        PROVENANCE = provenance;
    }

    function reserve() public onlyOwner {
        uint256 supply = totalSupply();
        uint256 i;
        for (i = 0; i < 41; i++) {
            _safeMint(msg.sender, supply + i);
        }
    }

    function setSaleState(bool newState) public onlyOwner {
        saleIsActive = newState;
    }

    function mint(uint256 numberOfTokens) public payable {
        require(saleIsActive, "Sale must be active to mint Tokens");
        require(numberOfTokens <= maxTokenPurchase, "Exceeded max token purchase");
        require(totalSupply() + numberOfTokens <= maxTokenSupply, "Purchase would exceed max supply of tokens");
        require(cost * numberOfTokens <= msg.value, "Ether value sent is not correct");

        for(uint256 i = 0; i < numberOfTokens; i++) {
            uint256 mintIndex = totalSupply();
            if (totalSupply() < maxTokenSupply) {
                _safeMint(msg.sender, mintIndex);
                emit Mint(msg.sender, mintIndex);
            }
        }
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        shareholderAddress.transfer(balance);
        emit Withdraw(shareholderAddress);
    }

    function burn(uint256 tokenId) public override(ERC721Burnable) {
        require(_exists(tokenId), "Token does not exist"); // Add this check
        require(ownerOf(tokenId) == msg.sender, "Only the owner of the token can burn it");
        super.burn(tokenId);
        delete _redeemed[tokenId]; // Remove redeemed flag for burned token
        emit Burn(msg.sender, tokenId);
    }

    function redeem(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) == msg.sender, "Only the owner of the token can redeem it");
        require(!_redeemed[tokenId], "Token has already been redeemed");
        _redeemed[tokenId] = true; // Set redeemed flag to true
        emit Redeem(msg.sender, tokenId);
    }

    function isRedeemed(uint256 tokenId) public view returns (bool) {
        return _redeemed[tokenId];
    }
}
