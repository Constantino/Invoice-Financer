// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Example} from "../src/Example.sol";

contract ExampleTest is Test {
    Example public example;

    function setUp() public {
        example = new Example("Hello, Foundry!");
    }

    function testGreeting() public {
        assertEq(example.greeting(), "Hello, Foundry!");
    }

    function testSetGreeting() public {
        example.setGreeting("Hello, World!");
        assertEq(example.greeting(), "Hello, World!");
    }
}
