/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

/**
 * Sanity check for transferring ownership.  Most logic is fully tested in OpenZeppelin lib.
 */
contract('WhitelisterRole', (accounts) => {
  let InxTokenInstance, restrictionsInstance
  const owner = accounts[0]
  const whitelisterAccount = accounts[1]
  const whitelistedAccount = accounts[2]
  const nonWhitelistedAccount = accounts[3]
  const revokerAccount = accounts[4]
  const timelockerAccount = accounts[5]

  beforeEach(async () => {
    InxTokenInstance = await InxToken.new(owner)
    restrictionsInstance = await TransferRestrictions.new(InxTokenInstance.address)
    await InxTokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('Owner should be able to add/remove whitelister', async () => {
    const initialStatus = await InxTokenInstance.isWhitelister(whitelisterAccount)

    assert.equal(initialStatus, false, 'should not intially be whitelister')
    await InxTokenInstance.addWhitelister(whitelisterAccount, { from: owner })

    const postStatus = await InxTokenInstance.isWhitelister(whitelisterAccount)

    assert.equal(postStatus, true, 'should be whitelister')

    await InxTokenInstance.removeWhitelister(whitelisterAccount, { from: owner })
    const postPostStatus = await InxTokenInstance.isWhitelister(whitelisterAccount)
    assert.equal(postPostStatus, false, 'should not be whitelister')
  })

  it('Non owner should not be able to add/remove whitelister', async () => {
    InxTokenInstance.addWhitelister(whitelisterAccount, { from: owner })
    InxTokenInstance.addRevoker(revokerAccount, { from: owner })
    InxTokenInstance.addTimelocker(timelockerAccount, { from: owner })
    InxTokenInstance.setWhitelist(whitelistedAccount, true, 'a', { from: whitelisterAccount })
    shouldFail.reverting(InxTokenInstance.addWhitelister(nonWhitelistedAccount, { from: whitelistedAccount }))
    shouldFail.reverting(InxTokenInstance.addWhitelister(nonWhitelistedAccount, { from: whitelisterAccount }))
    shouldFail.reverting(InxTokenInstance.addWhitelister(nonWhitelistedAccount, { from: revokerAccount }))
    shouldFail.reverting(InxTokenInstance.addWhitelister(nonWhitelistedAccount, { from: timelockerAccount }))
    shouldFail.reverting(InxTokenInstance.addWhitelister(nonWhitelistedAccount, { from: nonWhitelistedAccount }))

    shouldFail.reverting(InxTokenInstance.removeWhitelister(whitelisterAccount, { from: whitelistedAccount }))
    shouldFail.reverting(InxTokenInstance.removeWhitelister(whitelisterAccount, { from: whitelisterAccount }))
    shouldFail.reverting(InxTokenInstance.removeWhitelister(whitelisterAccount, { from: revokerAccount }))
    shouldFail.reverting(InxTokenInstance.removeWhitelister(whitelisterAccount, { from: timelockerAccount }))
    shouldFail.reverting(InxTokenInstance.removeWhitelister(whitelisterAccount, { from: nonWhitelistedAccount }))

  })

  it('Add whitelister should fire event', async () => {
    const { logs } = await InxTokenInstance.addWhitelister(whitelisterAccount, { from: owner })
    expectEvent.inLogs(logs, 'WhitelisterAdded', { addedWhitelister: whitelisterAccount, addedBy: owner })
  })


  it('Remove whitelister should fire event', async () => {
    await InxTokenInstance.addWhitelister(whitelisterAccount, { from: owner })
    const { logs } = await InxTokenInstance.removeWhitelister(whitelisterAccount, { from: owner })
    expectEvent.inLogs(logs, 'WhitelisterRemoved', { removedWhitelister: whitelisterAccount, removedBy: owner })
  })
})