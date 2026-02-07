// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Treasury} from "../src/Treasury.sol";

contract DeployTreasury is Script {
    function run() external returns (Treasury) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Get deployment parameters from environment or use defaults
        // Default fee is 10% (1000 basis points)
        // Pass 0 to use default, or specify custom fee percentage
        uint256 feePercentage = vm.envOr("TREASURY_FEE_PERCENTAGE", uint256(1000));

        // If 0 is provided, use default of 10% (1000 basis points)
        if (feePercentage == 0) {
            feePercentage = 1000; // 10% default
        }

        console.log("=== Treasury Deployment Starting ===");
        console.log("Deployer:", deployer);
        console.log("Fee Percentage (basis points):", feePercentage);
        console.log("Fee Percentage (%):", feePercentage / 100);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy Treasury
        Treasury treasury = new Treasury(feePercentage);
        require(address(treasury) != address(0), "Treasury deployment failed");
        require(treasury.owner() == deployer, "Treasury owner mismatch");
        require(treasury.feePercentage() == feePercentage, "Treasury fee percentage mismatch");

        vm.stopBroadcast();

        console.log("\n=== Deployment Successful ===");
        console.log("Treasury Address:", address(treasury));
        console.log("Owner:", treasury.owner());
        console.log("Fee Percentage:", treasury.feePercentage(), "basis points");
        console.log("Fee Percentage:", treasury.feePercentage() / 100, "%");
        console.log("\nTo use this in your tests, add to .env:");
        console.log("TREASURY_ADDRESS=", address(treasury));

        return treasury;
    }
}
