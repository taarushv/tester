/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

/**
 * Sanity check for transferring ownership.  Most logic is fully tested in OpenZeppelin lib.
 */
contract('OwnerRole', (accounts) => {
  let tokenInstance, restrictionsInstance

  beforeEach(async () => {
    tokenInstance = await InxToken.new(accounts[0])
    restrictionsInstance = await TransferRestrictions.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('should deploy and set owner', async () => {
    assert.equal(tokenInstance !== null, true, 'Contract should be deployed')

    // Should have been updated
    const isOwner = await tokenInstance.isOwner(accounts[0])
    assert.equal(isOwner, true, 'Account 0 should be an owner')
  })

  it('should allow an owner to add/remove owners', async () => {
    // Should have been updated
    await tokenInstance.addOwner(accounts[1], { from: accounts[0] })
    let isOwner1 = await tokenInstance.isOwner(accounts[1])
    assert.equal(isOwner1, true, 'Account 1 should be an owner')

    await tokenInstance.removeOwner(accounts[1], { from: accounts[0] })
    isOwner1 = await tokenInstance.isOwner(accounts[1])
    assert.equal(isOwner1, false, 'Account 1 should not be an owner')
  })

  it('should not allow a non owner to add/remove owners', async () => {
    const whitelisterAccount = accounts[1]
    const whitelistedAccount = accounts[2]
    const nonWhitelistedAccount = accounts[3]

    // set up account roles
    await tokenInstance.addWhitelister(whitelisterAccount, { from: accounts[0] })
    await tokenInstance.setWhitelist(whitelistedAccount, true, 'whitelist message', { from: whitelisterAccount })

    await shouldFail.reverting(tokenInstance.addOwner(accounts[4], { from: whitelisterAccount }))
    await shouldFail.reverting(tokenInstance.addOwner(accounts[4], { from: whitelistedAccount }))
    await shouldFail.reverting(tokenInstance.addOwner(accounts[4], { from: nonWhitelistedAccount }))
    await tokenInstance.addOwner(accounts[4], { from: accounts[0] })
    await shouldFail.reverting(tokenInstance.removeOwner(accounts[4], { from: whitelisterAccount }))
    await shouldFail.reverting(tokenInstance.removeOwner(accounts[4], { from: whitelistedAccount }))
    await shouldFail.reverting(tokenInstance.removeOwner(accounts[4], { from: nonWhitelistedAccount }))
  })

  it('should not allow an owner to add 0x0 owner', async () => {
    await shouldFail.reverting(tokenInstance.addOwner('0x0000000000000000000000000000000000000000', { from: accounts[0] }))
  })

  it('should emit events for adding owners', async () => {
    const { logs } = await tokenInstance.addOwner(accounts[3], { from: accounts[0] })
    expectEvent.inLogs(logs, 'OwnerAdded', { addedOwner: accounts[3], addedBy: accounts[0] })
  })

  it('should emit events for removing owners', async () => {
    await tokenInstance.addOwner(accounts[3], { from: accounts[0] })
    const { logs } = await tokenInstance.removeOwner(accounts[3], { from: accounts[0] })

    expectEvent.inLogs(logs, 'OwnerRemoved', { removedOwner: accounts[3], removedBy: accounts[0] })
  })
})
