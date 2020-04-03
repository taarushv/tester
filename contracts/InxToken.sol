pragma solidity 0.5.8;

import "./1404/IERC1404.sol";
import "./1404/IERC1404Validators.sol";
import "./roles/OwnerRole.sol";
import "./capabilities/Revocable.sol";
import "./capabilities/Whitelistable.sol";
import "./capabilities/Timelockable.sol";
import "./capabilities/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";


contract InxToken is IERC1404, IERC1404Validators, IERC20, ERC20Detailed, OwnerRole, Revocable, Whitelistable, Timelockable, Pausable {

    // Token Details
    string constant TOKEN_NAME = "Tokensoft";
    string constant TOKEN_SYMBOL = "TSFT";
    uint8 constant TOKEN_DECIMALS = 0;

    // Token supply - 2 Hundred Million Tokens, with 0 decimal precision
    uint256 constant HUNDRED_MILLION = 100000000;
    uint256 constant TOKEN_SUPPLY = 2 * HUNDRED_MILLION * (10 ** uint256(TOKEN_DECIMALS));

    // This tracks the external contract where restriction logic is executed
    IERC1404Success private transferRestrictions;

    // Event tracking when restriction logic contract is updated
    event RestrictionsUpdated (address newRestrictionsAddress, address updatedBy);

    /**
    Constructor for the token to set readable details and mint all tokens
    to the specified owner.
    */
    constructor(address owner) public
        ERC20Detailed(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS)
    {
        _mint(owner, TOKEN_SUPPLY);
        _addOwner(owner);
    }

    /**
    Function that can only be called by an owner that updates the address
    with the ERC1404 Transfer Restrictions defined
    */
    function updateTransferRestrictions(address _newRestrictionsAddress)
        public
        onlyOwner
        returns (bool)
    {
        transferRestrictions = IERC1404Success(_newRestrictionsAddress);
        emit RestrictionsUpdated(address(transferRestrictions), msg.sender);
        return true;
    }

    /**
    The address with the Transfer Restrictions contract
    */
    function getRestrictionsAddress () public view returns (address) {
        return address(transferRestrictions);
    }


    /**
    This function detects whether a transfer should be restricted and not allowed.
    If the function returns SUCCESS_CODE (0) then it should be allowed.
    */
    function detectTransferRestriction (address from, address to, uint256 amount)
        external
        view
        returns (uint8)
    {
        // Verify the external contract is valid
        require(address(transferRestrictions) != address(0), 'TransferRestrictions contract must be set');

        // call detectTransferRestriction on the current transferRestrictions contract
        return transferRestrictions.detectTransferRestriction(from, to, amount);
    }

    /**
    This function allows a wallet or other client to get a human readable string to show
    a user if a transfer was restricted.  It should return enough information for the user
    to know why it failed.
    */
    function messageForTransferRestriction (uint8 restrictionCode)
        external
        view
        returns (string memory)
    {
        // call messageForTransferRestriction on the current transferRestrictions contract
        return transferRestrictions.messageForTransferRestriction(restrictionCode);
    }

    /**
    Evaluates whether a transfer should be allowed or not.
    */
    modifier notRestricted (address from, address to, uint256 value) {
        uint8 restrictionCode = transferRestrictions.detectTransferRestriction(from, to, value);
        require(restrictionCode == transferRestrictions.getSuccessCode(), transferRestrictions.messageForTransferRestriction(restrictionCode));
        _;
    }

    /**
    Overrides the parent class token transfer function to enforce restrictions.
    */
    function transfer (address to, uint256 value)
        public
        notRestricted(msg.sender, to, value)
        returns (bool success)
    {
        success = ERC20.transfer(to, value);
    }

    /**
    Overrides the parent class token transferFrom function to enforce restrictions.
    */
    function transferFrom (address from, address to, uint256 value)
        public
        notRestricted(from, to, value)
        returns (bool success)
    {
        success = ERC20.transferFrom(from, to, value);
    }
}