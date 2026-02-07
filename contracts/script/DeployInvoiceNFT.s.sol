// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {InvoiceNFT} from "../src/InvoiceNFT.sol";

contract DeployInvoiceNFT is Script {
    function run() external returns (InvoiceNFT) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get deployment parameters from environment or use defaults
        string memory name = vm.envOr(
            "INVOICE_NFT_NAME",
            string("Invoice NFT")
        );
        string memory symbol = vm.envOr(
            "INVOICE_NFT_SYMBOL",
            string("INVOICE")
        );
        address initialOwner = vm.envOr("INVOICE_NFT_OWNER", deployer);

        console.log("=== InvoiceNFT Deployment Starting ===");
        console.log("Deployer:", deployer);
        console.log("Name:", name);
        console.log("Symbol:", symbol);
        console.log("Initial Owner:", initialOwner);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy InvoiceNFT
        InvoiceNFT invoiceNFT = new InvoiceNFT(name, symbol, initialOwner);
        require(
            address(invoiceNFT) != address(0),
            "InvoiceNFT deployment failed"
        );
        require(
            invoiceNFT.owner() == initialOwner,
            "InvoiceNFT owner mismatch"
        );

        // Verify initial state
        uint256 nextTokenId = invoiceNFT.nextTokenId();
        require(nextTokenId == 1, "InvoiceNFT nextTokenId mismatch");

        vm.stopBroadcast();

        console.log("\n=== Deployment Successful ===");
        console.log("InvoiceNFT Address:", address(invoiceNFT));
        console.log("Name:", invoiceNFT.name());
        console.log("Symbol:", invoiceNFT.symbol());
        console.log("Owner:", invoiceNFT.owner());
        console.log("Next Token ID:", nextTokenId);
        console.log("\nTo use this in your tests, add to .env:");
        console.log("INVOICE_NFT_ADDRESS=", address(invoiceNFT));

        return invoiceNFT;
    }
}
