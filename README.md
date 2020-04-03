# INX Token
ERC20 Token with 1404 Restrictions

## Use Case
The INX token is an ERC20 compatible token with transfer restrictions added that follow the ERC1404 standard. The 1404 Restrictions will use whitelists to segregate groups of accounts so they are only allowed to transfer to designated destination addresses.

## Token
The following features will be determined at deploy time, locking them in place.

 - Name
 - Symbol
 - Decimals
 - Total Supply

On deployment, all tokens will be transferred to the owner account passed in during deployment.

There will be **NO** functionality for minting or burning tokens after the initial creation of the contract.

## Users
There are 5 types of roles for accounts Owner, Whitelister, Revoker, Timelocker, and Pauser, additionally all accounts can either be whitelisted or not whitelisted.

## Owners

Owner accounts can add and remove account addresses to all role types; Owner, Whitelister, Revoker, Timelocker, and Pauser. Owners can update the TransferRestrictions contract address which prevents/allows transfers.

The Owner account specified at the time of deployment will be the only owner account by default.

## Whitelisters

Whitelisters can set the whitelist status of accounts. When whitelisting an account a whitelister sets the two fields that make up a WhitelistStatus
status: boolean
data: string

## Timelockers
Timelockers can lock all are part of a users tokens until a specified time. After locking tokens Timelockers can release the timelock or update it changing the amount of locked tokens or the expiration date. Before tokens can be transferred to an address, it must be validated that the tokens to send are not locked.

## Revokers
Revoker accounts can revoke tokens from any account. Revoking tokens as no effect on the total supply, it increases the balance of the admin revoking the tokens and decreases the balance of the account the tokens are revoked from.

## Pausers
Pauser accounts can pause and unpause the contract. When paused ALL transfers are restricted.

## Whitelisted
Before tokens can be transferred to an address, it must be validated that the source and destination address are whitelisted. Whitelisted addresses have a WhitelistStatus.status of true.

## Restriction Updateability
The transfer restrictions for the tokens is determined by an external address and so can be updated to be more or less restrictive. Owners can update the TransferRestrictions contract address.

# Testing
You should be able to install dependencies and then run tests:
```
$ npm install
$ npm run test
```

For unit test code coverage metrics:
```
$ npm run coverage
```