/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

/**
 * Sanity check for transferring ownership.  Most logic is fully tested in OpenZeppelin lib.
 */
contract('RevokerRole', (accounts) => {
  let InxTokenInstance, restrictionsInstance
  const owner = accounts[0]
  const revokerAccount = accounts[1]
  const whitelistedAccount = accounts[2]
  const nonWhitelistedAccount = accounts[3]
  const whitelisterAccount = accounts[4]
  const timelockerAccount = accounts[5]

  beforeEach(async () => {
    InxTokenInstance = await InxToken.new(owner)
    restrictionsInstance = await TransferRestrictions.new(InxTokenInstance.address)
    await InxTokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('Owner should be able to add/remove revoker', async () => {
    const initialStatus = await InxTokenInstance.isRevoker(revokerAccount)
    assert.equal(initialStatus, false, 'should not initially be revoker')
    await InxTokenInstance.addRevoker(revokerAccount, { from: owner })

    const postStatus = await InxTokenInstance.isRevoker(revokerAccount)

    assert.equal(postStatus, true, 'should be revoker')

    await InxTokenInstance.removeRevoker(revokerAccount, { from: owner })
    const postPostStatus = await InxTokenInstance.isRevoker(revokerAccount)
    assert.equal(postPostStatus, false, 'should not be revoker')
  })

  it('Non owner should not be able to add/remove revoker', async () => {
    InxTokenInstance.addRevoker(revokerAccount, { from: owner })
    InxTokenInstance.addWhitelister(whitelisterAccount, { from: owner })
    InxTokenInstance.addTimelocker(timelockerAccount, { from: owner })
    InxTokenInstance.setWhitelist(whitelistedAccount, true, 'a', { from: whitelisterAccount })
    shouldFail.reverting(InxTokenInstance.addRevoker(nonWhitelistedAccount, { from: whitelistedAccount }))
    shouldFail.reverting(InxTokenInstance.addRevoker(nonWhitelistedAccount, { from: timelockerAccount }))
    shouldFail.reverting(InxTokenInstance.addRevoker(nonWhitelistedAccount, { from: whitelisterAccount }))
    shouldFail.reverting(InxTokenInstance.addRevoker(nonWhitelistedAccount, { from: revokerAccount }))
    shouldFail.reverting(InxTokenInstance.addRevoker(nonWhitelistedAccount, { from: nonWhitelistedAccount }))

    shouldFail.reverting(InxTokenInstance.removeRevoker(revokerAccount, { from: whitelistedAccount }))
    shouldFail.reverting(InxTokenInstance.removeRevoker(revokerAccount, { from: timelockerAccount }))
    shouldFail.reverting(InxTokenInstance.removeRevoker(revokerAccount, { from: whitelisterAccount }))
    shouldFail.reverting(InxTokenInstance.removeRevoker(revokerAccount, { from: revokerAccount }))
    shouldFail.reverting(InxTokenInstance.removeRevoker(revokerAccount, { from: nonWhitelistedAccount }))

  })

  it('Add revoker should fire event', async () => {
    const { logs } = await InxTokenInstance.addRevoker(revokerAccount, { from: owner })
    expectEvent.inLogs(logs, 'RevokerAdded', { addedRevoker: revokerAccount, addedBy: owner })
  })

  it('Remove revoker should fire event', async () => {
    await InxTokenInstance.addRevoker(revokerAccount, { from: owner })
    const { logs } = await InxTokenInstance.removeRevoker(revokerAccount, { from: owner })
    expectEvent.inLogs(logs, 'RevokerRemoved', { removedRevoker: revokerAccount, removedBy: owner })
  })
})