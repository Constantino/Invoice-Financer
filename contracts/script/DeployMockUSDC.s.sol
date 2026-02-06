// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract DeployMockUSDC is Script {
    function run() external returns (MockUSDC) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== Mock USDC Deployment Starting ===");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockUSDC
        MockUSDC mockUsdc = new MockUSDC();
        require(address(mockUsdc) != address(0), "MockUSDC deployment failed");
        require(mockUsdc.owner() == deployer, "MockUSDC owner mismatch");
        require(mockUsdc.decimals() == 6, "MockUSDC decimals mismatch");

        // Verify initial mint
        uint256 deployerBalance = mockUsdc.balanceOf(deployer);
        console.log("Deployer initial balance:", deployerBalance / 1e6, "USDC");

        vm.stopBroadcast();

        console.log("\n=== Deployment Successful ===");
        console.log("MockUSDC Address:", address(mockUsdc));
        console.log("Name:", mockUsdc.name());
        console.log("Symbol:", mockUsdc.symbol());
        console.log("Decimals:", mockUsdc.decimals());
        console.log("\nTo use this in your tests, add to .env:");
        console.log("USDC_ADDRESS=", address(mockUsdc));

        return mockUsdc;
    }
}
