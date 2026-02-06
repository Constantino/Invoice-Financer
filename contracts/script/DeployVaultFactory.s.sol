// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VaultFactory} from "../src/VaultFactory.sol";
import {Vault} from "../src/Vault.sol";

contract DeployVaultFactory is Script {
    function run() external returns (VaultFactory, address) {
        // Get USDC address from environment variable
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        require(usdcAddress != address(0), "USDC_ADDRESS not set");

        // Test vault parameters
        string memory invoiceName = "TEST";
        string memory invoiceNumber = "001";
        address borrower = vm.envOr(
            "BORROWER_ADDRESS",
            address(0x1234567890123456789012345678901234567890)
        );
        uint256 maxCapacity = 10000e6; // 10,000 USDC
        uint256 maturityDate = block.timestamp + 30 days;

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Deployment Starting ===");
        console.log("Deployer:", deployer);
        console.log("USDC Address:", usdcAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy VaultFactory
        VaultFactory factory = new VaultFactory(usdcAddress);
        require(address(factory) != address(0), "Factory deployment failed");
        require(factory.OWNER() == deployer, "Factory owner mismatch");
        require(
            address(factory.ASSET()) == usdcAddress,
            "Factory asset mismatch"
        );

        // Deploy test Vault through Factory
        address vaultAddress = factory.deployVault(
            invoiceName,
            invoiceNumber,
            borrower,
            maxCapacity,
            maturityDate
        );
        require(vaultAddress != address(0), "Vault deployment failed");

        // Validate Vault
        Vault vault = Vault(vaultAddress);
        require(vault.BORROWER() == borrower, "Vault borrower mismatch");
        require(vault.MAX_CAPACITY() == maxCapacity, "Vault capacity mismatch");
        require(
            vault.MATURITY_DATE() == maturityDate,
            "Vault maturity mismatch"
        );
        require(vault.owner() == deployer, "Vault owner mismatch");

        vm.stopBroadcast();

        console.log("\n=== Deployment Successful ===");
        console.log("VaultFactory:", address(factory));
        console.log("Test Vault:", vaultAddress);
        console.log(
            "Vault Name:",
            string(abi.encodePacked(invoiceName, "_", invoiceNumber, "_Vault"))
        );
        console.log(
            "Vault Symbol:",
            string(abi.encodePacked(invoiceName, "_", invoiceNumber))
        );

        return (factory, vaultAddress);
    }
}
