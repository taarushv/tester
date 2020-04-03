/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')
const TransferRestrictionsNone = artifacts.require('TransferRestrictionsNone')

contract('Upgrade Restrictions', (accounts) => {
  let tokenInstance, restrictionsInstance, restrictionsInstanceNone
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
  it('should deploy', async () => {
    assert.equal(tokenInstance !== null, true, 'Contract should be deployed')
  })

  it('The TransferRestrictions address should be updateable by owners', async () => {
    const initialRestrictionsAddress = await tokenInstance.getRestrictionsAddress();
    restrictionsInstanceNone = await TransferRestrictionsNone.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address)

    const updatedRestrictionsAddress = await tokenInstance.getRestrictionsAddress();
    assert.notEqual(initialRestrictionsAddress, updatedRestrictionsAddress, 'Restrictions Address should be updated')
    assert.equal(restrictionsInstanceNone.address, updatedRestrictionsAddress, 'Restrictions Address should be the latest address set')
  })

  it('The TransferRestrictions address should no be updateable by non owners', async () => {
    const initialRestrictionsAddress = await tokenInstance.getRestrictionsAddress();
    restrictionsInstanceNone = await TransferRestrictionsNone.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address)

    // assign roles
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.addTimelocker(timelockerAccount, { from: ownerAccount })
    await tokenInstance.addRevoker(revokerAccount, { from: ownerAccount })
    await tokenInstance.addPauser(pauserAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(whitelistedAccount, true, 'a', { from: whitelisterAccount })

    // Update restrictions address from non owner accounts - should fail
    await shouldFail.reverting(tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address, { from: whitelisterAccount }))
    await shouldFail.reverting(tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address, { from: whitelistedAccount }))
    await shouldFail.reverting(tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address, { from: nonWhitelistedAccount }))
    await shouldFail.reverting(tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address, { from: timelockerAccount }))
    await shouldFail.reverting(tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address, { from: revokerAccount }))
    await shouldFail.reverting(tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address, { from: pauserAccount }))

  })

  it('Restricted transfers should succeed after removing restrictions', async () => {
    // initial transfer should fail
    await shouldFail.reverting(tokenInstance.transfer(nonWhitelistedAccount, 10, { from: ownerAccount }))

    // update the restriction contract to no restrictions
    restrictionsInstanceNone = await TransferRestrictionsNone.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address)

    // transfer should succeed
    await tokenInstance.transfer(nonWhitelistedAccount, 10, { from: ownerAccount })
  })

  it('Updating restriction should fire event', async () => {
    // update the restriction contract to no restrictions
    restrictionsInstanceNone = await TransferRestrictionsNone.new(tokenInstance.address)
    const { logs } = await tokenInstance.updateTransferRestrictions(restrictionsInstanceNone.address)

    expectEvent.inLogs( logs, 'RestrictionsUpdated', { newRestrictionsAddress: restrictionsInstanceNone.address, updatedBy: ownerAccount })
  })
})