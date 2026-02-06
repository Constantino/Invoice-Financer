// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing with 6 decimals (like real USDC)
 * @notice This token allows anyone to mint tokens for testing purposes
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;

    constructor() ERC20("Mock USDC", "mUSDC") Ownable(msg.sender) {
        // Mint initial supply to deployer (100M USDC for testing)
        _mint(msg.sender, 1_000_000_000 * 10 ** DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Allows anyone to mint tokens for testing
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint (in smallest unit)
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    /**
     * @dev Convenient function to mint with normal USDC amounts
     * @param to Address to mint tokens to
     * @param amount Amount in USDC (will be multiplied by 10^6)
     */
    function mintUsdc(address to, uint256 amount) external {
        _mint(to, amount * 10 ** DECIMALS);
    }
}
