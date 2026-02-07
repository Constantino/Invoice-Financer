// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Vault} from "./Vault.sol";

/**
 * @title Treasury
 * @dev Contract for managing treasury funds and tracking debt
 * @notice Manages deposits, calculates interest, and distributes funds to vaults
 */
contract Treasury is Ownable {
    using SafeERC20 for IERC20;

    // Fee percentage in basis points (10000 = 100%, 1000 = 10%)
    uint256 public feePercentage;

    event FundsDeposited(
        address indexed from, uint256 originalDebt, uint256 totalDebt, address vault, address currency
    );
    event FundsWithdrawn(address indexed to, uint256 value);
    event DebtUpdated(uint256 oldDebt, uint256 newDebt);
    event InterestProcessed(uint256 interest, uint256 fee, uint256 sentToVault);
    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);

    constructor(uint256 _feePercentage) Ownable(msg.sender) {
        require(_feePercentage <= 10000, "Treasury: fee percentage cannot exceed 100%");
        feePercentage = _feePercentage;
    }

    /**
     * @dev Get the current balance of the treasury in the currency token
     * @param currencyAddress The currency token address
     * @return The current balance
     */
    function getBalance(address currencyAddress) external view returns (uint256) {
        return IERC20(currencyAddress).balanceOf(address(this));
    }

    /**
     * @dev Deposit funds into the treasury
     * @param originalDebt The original debt value
     * @param totalDebt The total debt value
     * @param vault The vault address
     * @param currency The currency token address
     */
    function deposit(uint256 originalDebt, uint256 totalDebt, address vault, address currency) external {
        require(originalDebt > 0, "Treasury: original debt must be greater than 0");
        require(vault != address(0), "Treasury: invalid vault address");
        require(currency != address(0), "Treasury: invalid currency address");
        require(totalDebt >= originalDebt, "Treasury: totalDebt must be >= originalDebt");

        IERC20(currency).safeTransferFrom(msg.sender, address(this), totalDebt);

        // Calculate interest = totalDebt - originalDebt
        uint256 interest = totalDebt - originalDebt;

        if (interest > 0) {
            // Calculate fee based on feePercentage (in basis points)
            uint256 fee = (interest * feePercentage) / 10000;
            // Calculate remaining amount to send to vault
            uint256 sentToVault = totalDebt - fee;

            // Send rest payment minus fee to vault using internal transfer function
            _transferToVault(sentToVault, vault, currency);

            // Instantiate Vault and mark as repaid if conditions are met
            Vault vaultInstance = Vault(vault);
            // Check if vault is in ACTIVE state (enum value 1) and has enough assets
            if (uint8(vaultInstance.state()) == 1 && vaultInstance.totalAssets() >= vaultInstance.MAX_CAPACITY()) {
                vaultInstance.markAsRepaid();
            }

            emit InterestProcessed(interest, fee, sentToVault);
        }

        emit FundsDeposited(msg.sender, originalDebt, totalDebt, vault, currency);
    }

    /**
     * @dev Withdraw funds from the treasury (owner only)
     * @param to The address to withdraw to
     * @param value The amount to withdraw
     * @param currency The currency token address
     */
    function withdraw(address to, uint256 value, address currency) external onlyOwner {
        require(to != address(0), "Treasury: invalid recipient address");
        require(currency != address(0), "Treasury: invalid currency address");
        require(value > 0, "Treasury: withdraw amount must be greater than 0");
        IERC20(currency).safeTransfer(to, value);
        emit FundsWithdrawn(to, value);
    }

    /**
     * @dev Internal function to transfer funds to the vault
     * @param value The amount to transfer
     * @param vault The vault address
     * @param currency The currency token address
     */
    function _transferToVault(uint256 value, address vault, address currency) internal {
        require(vault != address(0), "Treasury: invalid vault address");
        require(currency != address(0), "Treasury: invalid currency address");
        require(value > 0, "Treasury: transfer amount must be greater than 0");
        IERC20(currency).safeTransfer(vault, value);
        emit FundsWithdrawn(vault, value);
    }

    /**
     * @dev Transfer funds to the vault (owner only)
     * @param value The amount to transfer
     * @param vault The vault address
     * @param currency The currency token address
     */
    function transferToVault(uint256 value, address vault, address currency) external onlyOwner {
        _transferToVault(value, vault, currency);
    }

    /**
     * @dev Update the fee percentage (owner only)
     * @param _feePercentage The new fee percentage in basis points (10000 = 100%, 1000 = 10%)
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10000, "Treasury: fee percentage cannot exceed 100%");
        uint256 oldFee = feePercentage;
        feePercentage = _feePercentage;
        emit FeePercentageUpdated(oldFee, _feePercentage);
    }
}
