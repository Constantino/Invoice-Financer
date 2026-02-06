// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Example} from "../src/Example.sol";

contract DeployExample is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        Example example = new Example("Hello from deployment!");

        console.log("Example deployed at:", address(example));
        console.log("Greeting:", example.greeting());

        vm.stopBroadcast();
    }
}
