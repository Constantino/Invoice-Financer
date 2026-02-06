// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {
    ERC4626
} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vault is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    address public immutable BORROWER;
    uint256 public immutable MAX_CAPACITY;
    uint256 public immutable MATURITY_DATE;

    enum State {
        FUNDING,
        ACTIVE,
        REPAID
    }

    State public state;

    constructor(
        string memory name,
        string memory symbol,
        IERC20 asset_,
        address _borrower,
        uint256 _maxCapacity,
        uint256 _maturityDate,
        address _owner
    ) ERC4626(asset_) ERC20(name, symbol) Ownable(_owner) {
        BORROWER = _borrower;
        MAX_CAPACITY = _maxCapacity;
        MATURITY_DATE = _maturityDate;
        state = State.FUNDING;
    }

    function deposit(
        uint256 assets,
        address receiver
    ) public override returns (uint256) {
        require(state == State.FUNDING, "Not funding");
        require(totalAssets() + assets <= MAX_CAPACITY, "Exceeds capacity");
        return super.deposit(assets, receiver);
    }

    function releaseFunds() external onlyOwner {
        require(state == State.FUNDING, "Not funding");
        require(totalAssets() >= MAX_CAPACITY, "Not fully funded");

        state = State.ACTIVE;
        IERC20(asset()).safeTransfer(BORROWER, totalAssets());
    }

    function repay(uint256 amount) external {
        require(msg.sender == BORROWER, "Not borrower");
        require(state == State.ACTIVE, "Not active");

        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);
        if (totalAssets() >= MAX_CAPACITY) {
            state = State.REPAID;
        }
    }

    function markAsRepaid() external {
        require(state == State.ACTIVE, "Not active");
        state = State.REPAID;
    }

    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public override returns (uint256) {
        require(state == State.REPAID, "Not repaid");
        return super.withdraw(assets, receiver, owner);
    }

    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public override returns (uint256) {
        require(state == State.REPAID, "Not repaid");
        return super.redeem(shares, receiver, owner);
    }
}
