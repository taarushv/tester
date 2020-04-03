pragma solidity 0.5.8;

import "../1404/IERC1404.sol";
import "../1404/IERC1404Validators.sol";
import "./RestrictionMessages.sol";


/**
 * @title TransferRestrictions
 * @dev Defines the rules the validate transfers and the error messages
 */
contract TransferRestrictions is IERC1404, RestrictionMessages, IERC1404Success {

    IERC1404Validators validators;

    /**
    Constructor sets the address the validators contract which should be the token contract
    */
    constructor(address _validators) public
    {
        validators = IERC1404Validators(_validators);
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
        // Confirm that that addresses are whitelisted
        if(!validators.checkWhitelists(from,to)) {
            return FAILURE_NON_WHITELIST;
        }

        // If the from account is locked up, then don't allow the transfer
        if(!validators.checkTimelock(from, amount, validators.balanceOf(from))) {
            return FAILURE_TIMELOCK;
        }

        // If the entire contract is paused, then the transfer should be prevented
        if(validators.paused()) {
            return FAILURE_CONTRACT_PAUSED;
        }

        // If no restrictions were triggered return success
        return SUCCESS_CODE;
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
        if (restrictionCode == SUCCESS_CODE) {
            return SUCCESS_MESSAGE;
        }

        if (restrictionCode == FAILURE_NON_WHITELIST) {
            return FAILURE_NON_WHITELIST_MESSAGE;
        }

        if (restrictionCode == FAILURE_TIMELOCK) {
            return FAILURE_TIMELOCK_MESSAGE;
        }

        if (restrictionCode == FAILURE_CONTRACT_PAUSED) {
            return FAILURE_CONTRACT_PAUSED_MESSAGE;
        }

        return UNKNOWN_ERROR;
    }

    function getSuccessCode() external view returns (uint256) {
      return SUCCESS_CODE;
    }
}