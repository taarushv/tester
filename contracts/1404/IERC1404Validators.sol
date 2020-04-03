pragma solidity 0.5.8;

/**
 * @title IERC1404Validators
 * @dev Interfaces implemented by the token contract to be called by the TransferRestrictions contract
 */
interface IERC1404Validators {
    /// @notice Returns the token balance for an account
    /// @param account The address to get the token balance of
    /// @return uint256 representing the token balance for the account
    function balanceOf (address account) external view returns (uint256);

    /// @notice Returns a boolean indicating the paused state of the contract
    /// @return true if contract is paused, false if unpaused
    function paused () external view returns (bool);

    /// @notice Determine if sender and receiver are whitelisted, return true if both accounts are whitelisted
    /// @param from The address sending tokens.
    /// @param to The address receiving tokens.
    /// @return true if both accounts are whitelisted, false if not
    function checkWhitelists (address from, address to) external view returns (bool);

    /// @notice Determine if a users tokens are locked preventing a transfer
    /// @param _address the address to retrieve the data from
    /// @param amount the amount to send
    /// @param balance the token balance of the sending account
    /// @return true if user has sufficient unlocked token to transfer the requested amount, false if not
    function checkTimelock (address _address, uint256 amount, uint256 balance) external view returns (bool);
}

