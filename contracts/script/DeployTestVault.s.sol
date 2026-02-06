// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {VaultFactory} from "../src/VaultFactory.sol";

contract DeployTestVault is Script {
    function run() external returns (address) {
        address factoryAddress = vm.envAddress("VAULT_FACTORY_ADDRESS");
        require(factoryAddress != address(0), "VAULT_FACTORY_ADDRESS not set");

        // Test parameters
        string memory invoiceName = vm.envOr("INVOICE_NAME", string("TEST"));
        string memory invoiceNumber = vm.envOr("INVOICE_NUMBER", string("001"));
        address borrower = vm.envOr(
            "BORROWER_ADDRESS",
            address(0x1234567890123456789012345678901234567890)
        );
        uint256 maxCapacity = vm.envOr("MAX_CAPACITY", uint256(10000e6)); // 10,000 USDC
        uint256 maturityDate = vm.envOr(
            "MATURITY_DATE",
            uint256(block.timestamp + 30 days)
        );

        console.log("Deploying Test Vault through Factory...");
        console.log("Factory Address:", factoryAddress);
        console.log("Invoice:", invoiceName, "_", invoiceNumber);
        console.log("Borrower:", borrower);
        console.log("Max Capacity:", maxCapacity);
        console.log("Maturity Date:", maturityDate);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        VaultFactory factory = VaultFactory(factoryAddress);
        address vaultAddress = factory.deployVault(
            invoiceName,
            invoiceNumber,
            borrower,
            maxCapacity,
            maturityDate
        );

        vm.stopBroadcast();

        console.log("Vault deployed at:", vaultAddress);

        return vaultAddress;
    }
}
