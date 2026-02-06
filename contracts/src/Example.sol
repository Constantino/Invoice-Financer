// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Example
 * @dev A simple example contract to demonstrate the project setup
 */
contract Example {
    string public greeting;

    constructor(string memory _greeting) {
        greeting = _greeting;
    }

    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
    }
}
