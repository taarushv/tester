/* global artifacts contract it assert */
const { shouldFail } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

contract('Transfers', (accounts) => {
  let tokenInstance, restrictionsInstance
  // set up account roles
  const ownerAccount = accounts[0]
  const whitelisterAccount = accounts[1]
  const whitelistedAccount = accounts[2]
  const nonWhitelistedAccount = accounts[3]

  beforeEach(async () => {
    tokenInstance = await InxToken.new(ownerAccount)
    restrictionsInstance = await TransferRestrictions.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })
  it('should deploy', async () => {
    assert.equal(tokenInstance !== null, true, 'Contract should be deployed')
  })

  it('All users should be blocked from sending to non whitelisted non role-assigned accounts', async () => {
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(whitelistedAccount, true, 'message', { from: whitelisterAccount })

    // Sending to non whitelisted account should fail regardless of sender
    await shouldFail.reverting(tokenInstance.transfer(accounts[7], 100, { from: ownerAccount }))
    await shouldFail.reverting(tokenInstance.transfer(accounts[7], 100, { from: whitelisterAccount }))
    await shouldFail.reverting(tokenInstance.transfer(accounts[7], 100, { from: whitelistedAccount }))
    await shouldFail.reverting(tokenInstance.transfer(accounts[7], 100, { from: nonWhitelistedAccount }))
  })

  it('Initial transfers should fail but succeed after white listing', async () => {
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'message', { from: whitelisterAccount })

    // Try to send before whitelisting destination
    await shouldFail.reverting(tokenInstance.transfer(whitelistedAccount, 100, { from: ownerAccount }))

    await tokenInstance.setWhitelist(whitelistedAccount, true, 'message', { from: whitelisterAccount })

    // transfer should now succeed
    await tokenInstance.transfer(whitelistedAccount, 100, { from: ownerAccount })

    // set the whitelist for destination to be false
    await tokenInstance.setWhitelist(whitelistedAccount, false, 'message', { from: whitelisterAccount })

    // transfer should fail again
    await shouldFail.reverting(tokenInstance.transfer(whitelistedAccount, 100, { from: ownerAccount }))
  })

  it('Initial transferFroms should fail but succeed after white listing', async () => {
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'message', { from: whitelisterAccount })
    await tokenInstance.approve(whitelistedAccount, 200, { from: ownerAccount })

    // Try to send before whitelisting destination
    await shouldFail.reverting(tokenInstance.transferFrom(ownerAccount, whitelistedAccount, 100, { from: whitelistedAccount }))

    await tokenInstance.setWhitelist(whitelistedAccount, true, 'message', { from: whitelisterAccount })

    // transfer should now succeed
    await tokenInstance.transferFrom(ownerAccount, whitelistedAccount, 100, { from: whitelistedAccount })

    // set the whitelist for destination to be false
    await tokenInstance.setWhitelist(whitelistedAccount, false, 'message', { from: whitelisterAccount })

    // transfer should fail again
    await shouldFail.reverting(tokenInstance.transferFrom(ownerAccount, whitelistedAccount, 100, { from: whitelistedAccount }))
  })
})
