pragma solidity 0.5.8;

import "../roles/WhitelisterRole.sol";

/**
 * @title Whitelistable
 * @dev Allows tracking whether addressess are allowed to hold tokens.
 */
contract Whitelistable is WhitelisterRole {

    event WhitelistUpdate(address _address, bool status, string data);

    // Tracks whether an address is whitelisted
    // data field can track any external field (like a hash of personal details)
    struct whiteListItem {
        bool status;
        string data;
    }

    // white list status
    mapping (address => whiteListItem) public whitelist;

    /**
    * @dev Set a white list address
    * @param to the address to be set
    * @param status the whitelisting status (true for yes, false for no)
    * @param data a string with data about the whitelisted address
    */
    function setWhitelist(address to, bool status, string memory data)  public onlyWhitelister returns(bool){
        whitelist[to] = whiteListItem(status, data);
        emit WhitelistUpdate(to, status, data);
        return true;
    }

    /**
    * @dev Get the status of the whitelist
    * @param _address the address to be check
    */
    function getWhitelistStatus(address _address) public view returns(bool){
        return whitelist[_address].status;
    }

    /**
    * @dev Get the data of and address in the whitelist
    * @param _address the address to retrieve the data from
    */
    function getWhitelistData(address _address) public view returns(string memory){
        return whitelist[_address].data;
    }

    /**
    * @dev Determine if sender and receiver are whitelisted, return true if both accounts are whitelisted
    * @param from The address sending tokens.
    * @param to The address receiving tokens.
    */
    function checkWhitelists(address from, address to) external view returns (bool) {
        return whitelist[from].status && whitelist[to].status;
    }
}
