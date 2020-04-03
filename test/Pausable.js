/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

contract('Pausable', (accounts) => {
  let tokenInstance, restrictionsInstance
  // set up account roles
  const ownerAccount = accounts[0]
  const whitelisterAccount = accounts[1]
  const whitelistedAccount = accounts[2]
  const nonWhitelistedAccount = accounts[3]
  const revokerAccount = accounts[4]
  const timelockerAccount = accounts[5]
  const pauserAccount = accounts[6]

  beforeEach(async () => {
    tokenInstance = await InxToken.new(ownerAccount)
    restrictionsInstance = await TransferRestrictions.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('should allow the pauser to pause/unpause', async () => {

    // Check initial value
    const initial = await tokenInstance.paused.call()
    assert.equal(initial, false, 'Should not be paused by default')

    // add the owner account to the revoker role
    await tokenInstance.addPauser(pauserAccount, { from: ownerAccount })

    // Let the owner pause
    await tokenInstance.pause({ from: pauserAccount })

    // check the value after pausing
    const afterPausing = await tokenInstance.paused.call()
    assert.equal(afterPausing, true, 'Should be paused after pausing')

    // Let the owner pause
    await tokenInstance.unpause({ from: pauserAccount })

    // check the value afterun pausing
    const afterUnpausing = await tokenInstance.paused.call()
    assert.equal(afterUnpausing, false, 'Should be unpaused after unpausing')
  })

  it('should not allow non pausers to pause/unpause', async () => {

    // Check initial value
    const initial = await tokenInstance.paused.call()
    assert.equal(initial, false, 'Should not be paused by default')

    // add the owner account to the revoker role
    await tokenInstance.addPauser(pauserAccount, { from: ownerAccount })
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.addRevoker(revokerAccount, { from: ownerAccount })

    // attempt to pause with non owner accounts - should all fail
    await shouldFail.reverting(tokenInstance.pause({ from: ownerAccount }))
    await shouldFail.reverting(tokenInstance.pause({ from: revokerAccount }))
    await shouldFail.reverting(tokenInstance.pause({ from: whitelisterAccount }))


    // pause with pauser account
    await tokenInstance.pause({ from: pauserAccount })

    // attempt to unpause with non owner accounts - should all fail
    await shouldFail.reverting(tokenInstance.unpause({ from: ownerAccount }))
    await shouldFail.reverting(tokenInstance.unpause({ from: revokerAccount }))
    await shouldFail.reverting(tokenInstance.unpause({ from: whitelisterAccount }))
  })

  it('should block transfers when paused and allow transfers when unpaused', async () => {

    const transferAmt = 100
    // create a pauser account
    await tokenInstance.addPauser(pauserAccount, { from: ownerAccount })

    // create a whitelister account
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })

    // configure accounts and whitelist to allow transfers
    await tokenInstance.setWhitelist(ownerAccount, true, 'a', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(whitelistedAccount, true, 'a', { from: whitelisterAccount })

    // send intial funds to account from owner
    await tokenInstance.transfer(whitelistedAccount, transferAmt, { from: ownerAccount })

    // Let the owner pause
    await tokenInstance.pause({ from: pauserAccount })
    // attempt to transfer while contract is paused, should fail
    await shouldFail.reverting(tokenInstance.transfer(ownerAccount, transferAmt / 2, { from: whitelistedAccount }))

    // Let the owner pause
    await tokenInstance.unpause({ from: pauserAccount })

    // transfer tokens - should succeed
    await tokenInstance.transfer(ownerAccount, transferAmt / 2, { from: whitelistedAccount })

  })
})