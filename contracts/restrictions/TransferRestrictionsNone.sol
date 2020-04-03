pragma solidity 0.5.8;

import "../1404/IERC1404.sol";
import "../1404/IERC1404Validators.sol";
import "./RestrictionMessages.sol";

/**
 * @title TransferRestrictionsNone
 * @dev Defines no restrictions on transfers, any transfer is valid if this contract is used to validate
 *      This essentially turns off all restrictions and allows transfers to behave like a standard ERC20
 */
contract TransferRestrictionsNone is IERC1404, RestrictionMessages, IERC1404Success {

    /**
    This function detects whether a transfer should be restricted and not allowed.
    If the function returns SUCCESS_CODE (0) then it should be allowed.
    */
    function detectTransferRestriction (address, address, uint256)
        external
        view
        returns (uint8)
    {
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

        return UNKNOWN_ERROR;
    }

    function getSuccessCode() external view returns (uint256) {
      return SUCCESS_CODE;
    }
}