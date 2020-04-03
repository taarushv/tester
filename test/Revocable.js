/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

/**
 * Sanity check for transferring ownership.  Most logic is fully tested in OpenZeppelin lib.
 */
contract('Revocable', (accounts) => {
  let tokenInstance, restrictionsInstance
  // set up account roles
  const ownerAccount = accounts[0]
  const whitelisterAccount = accounts[1]
  const whitelistedAccount = accounts[2]
  const nonWhitelistedAccount = accounts[3]
  const revokeeAccount = accounts[4]

  beforeEach(async () => {
    tokenInstance = await InxToken.new(ownerAccount)
    restrictionsInstance = await TransferRestrictions.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('Revoker should be able to revoke tokens from any account', async () => {
    // set up the amounts to test
    const transferAmount = 100
    const revokeAmount = 25
    const afterRevokeAmount = transferAmount - revokeAmount

    // add the owner account to the revoker role
    await tokenInstance.addRevoker(ownerAccount, { from: ownerAccount })

    // add account2 to admin role
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(revokeeAccount, true, 'message', { from: whitelisterAccount })

    // transfer tokens from owner account to revokee accounts
    await tokenInstance.transfer(revokeeAccount, transferAmount, { from: ownerAccount })

    // get the initial balances of the user and owner account and confirm user balance
    const revokeeBalance = await tokenInstance.balanceOf(revokeeAccount)
    const ownerBalance = await tokenInstance.balanceOf(ownerAccount)
    assert.equal(revokeeBalance, transferAmount, 'User balance should intially be equal to the transfer amount')

    // revoke tokens from the user
    await tokenInstance.revoke(revokeeAccount, revokeAmount, { from: ownerAccount })

    // get the updated balances for admin and user and confirm they are updated
    const revokeeBalanceRevoked = await tokenInstance.balanceOf(revokeeAccount)
    const ownerBalanceRevoked = await tokenInstance.balanceOf(ownerAccount)
    assert.equal(revokeeBalanceRevoked, afterRevokeAmount, 'User balance should be reduced after tokens are revoked')
    assert.notEqual(ownerBalanceRevoked, ownerBalance, 'Admin balance should be increased after tokens are revoked')
  })

  it('Non revokers should not be able to revoke tokens', async () => {
    // set up the amounts to test
    const transferAmount = 100
    const revokeAmount = 25

    // add account2 to admin role
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(revokeeAccount, true, 'message', { from: whitelisterAccount })

    // transfer tokens from owner account to revokee accounts
    await tokenInstance.transfer(revokeeAccount, transferAmount, { from: ownerAccount })

    // attempt to revoke tokens from owner, whitelisted, and non whitelisted accounts; should all fail
    await shouldFail.reverting(tokenInstance.revoke(revokeeAccount, revokeAmount, { from: whitelisterAccount }))
    await shouldFail.reverting(tokenInstance.revoke(revokeeAccount, revokeAmount, { from: whitelistedAccount }))
    await shouldFail.reverting(tokenInstance.revoke(revokeeAccount, revokeAmount, { from: nonWhitelistedAccount }))
  })

  it('should emit event when tokens are revoked', async () => {
    // set up the amounts to test
    const transferAmount = 100
    const revokeAmount = '25'

    // add the owner account to the revoker role
    await tokenInstance.addRevoker(ownerAccount, { from: ownerAccount })

    // add account2 to admin role
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(revokeeAccount, true, 'message', { from: whitelisterAccount })

    // transfer tokens from owner account to revokee accounts
    await tokenInstance.transfer(revokeeAccount, transferAmount, { from: ownerAccount })

    // revoke tokens from the user
    const { logs } = await tokenInstance.revoke(revokeeAccount, revokeAmount, { from: ownerAccount })

    expectEvent.inLogs(logs, 'Revoke', { revoker: ownerAccount, from: revokeeAccount, amount: revokeAmount })
  })
})
