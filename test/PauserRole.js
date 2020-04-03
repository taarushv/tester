/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

/**
 * Sanity check for transferring ownership.  Most logic is fully tested in OpenZeppelin lib.
 */
contract('PauserRole', (accounts) => {
  let InxTokenInstance, restrictionsInstance
  const owner = accounts[0]
  const pauserAccount = accounts[1]
  const whitelistedAccount = accounts[2]
  const nonWhitelistedAccount = accounts[3]
  const whitelisterAccount = accounts[4]
  const timelockerAccount = accounts[5]
  const revokerAccount = accounts[6]

  beforeEach(async () => {
    InxTokenInstance = await InxToken.new(owner)
    restrictionsInstance = await TransferRestrictions.new(InxTokenInstance.address)
    await InxTokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('Owner should be able to add/remove pauser', async () => {
    const initialStatus = await InxTokenInstance.isPauser(pauserAccount)
    assert.equal(initialStatus, false, 'should not initially be pauser')
    await InxTokenInstance.addPauser(pauserAccount, { from: owner })

    const postStatus = await InxTokenInstance.isPauser(pauserAccount)

    assert.equal(postStatus, true, 'should be pauser')

    await InxTokenInstance.removePauser(pauserAccount, { from: owner })
    const postPostStatus = await InxTokenInstance.isPauser(pauserAccount)
    assert.equal(postPostStatus, false, 'should not be pauser')
  })

  it('Non owner should not be able to add/remove pauser', async () => {
    InxTokenInstance.addPauser(pauserAccount, { from: owner })
    InxTokenInstance.addWhitelister(whitelisterAccount, { from: owner })
    InxTokenInstance.addTimelocker(timelockerAccount, { from: owner })
    InxTokenInstance.addRevoker(revokerAccount, { from: owner })
    InxTokenInstance.setWhitelist(whitelistedAccount, true, 'a', { from: whitelisterAccount })
    shouldFail.reverting(InxTokenInstance.addPauser(nonWhitelistedAccount, { from: whitelistedAccount }))
    shouldFail.reverting(InxTokenInstance.addPauser(nonWhitelistedAccount, { from: timelockerAccount }))
    shouldFail.reverting(InxTokenInstance.addPauser(nonWhitelistedAccount, { from: whitelisterAccount }))
    shouldFail.reverting(InxTokenInstance.addPauser(nonWhitelistedAccount, { from: pauserAccount }))
    shouldFail.reverting(InxTokenInstance.addPauser(nonWhitelistedAccount, { from: revokerAccount }))
    shouldFail.reverting(InxTokenInstance.addPauser(nonWhitelistedAccount, { from: nonWhitelistedAccount }))

    shouldFail.reverting(InxTokenInstance.removePauser(pauserAccount, { from: whitelistedAccount }))
    shouldFail.reverting(InxTokenInstance.removePauser(pauserAccount, { from: timelockerAccount }))
    shouldFail.reverting(InxTokenInstance.removePauser(pauserAccount, { from: whitelisterAccount }))
    shouldFail.reverting(InxTokenInstance.removePauser(pauserAccount, { from: pauserAccount }))
    shouldFail.reverting(InxTokenInstance.removePauser(pauserAccount, { from: revokerAccount }))
    shouldFail.reverting(InxTokenInstance.removePauser(pauserAccount, { from: nonWhitelistedAccount }))

  })

  it('Add pauser should fire event', async () => {
    const { logs } = await InxTokenInstance.addPauser(pauserAccount, { from: owner })
    expectEvent.inLogs(logs, 'PauserAdded', { addedPauser: pauserAccount, addedBy: owner })
  })

  it('Remove pauser should fire event', async () => {
    await InxTokenInstance.addPauser(pauserAccount, { from: owner })
    const { logs } = await InxTokenInstance.removePauser(pauserAccount, { from: owner })
    expectEvent.inLogs(logs, 'PauserRemoved', { removedPauser: pauserAccount, removedBy: owner })
  })
})