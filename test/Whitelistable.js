/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

contract('Whitelistable', (accounts) => {
  let InxTokenInstance, restrictionsInstance
  const owner = accounts[0]
  const acc1 = accounts[1]
  const acc2 = accounts[2]
  const acc3 = accounts[3]

  beforeEach(async () => {
    InxTokenInstance = await InxToken.new(accounts[0])
    restrictionsInstance = await TransferRestrictions.new(InxTokenInstance.address)
    await InxTokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('Whitelister should be able to set whitelist', async () => {
    await InxTokenInstance.addWhitelister(owner, { from: owner })
    const { logs } = await InxTokenInstance.setWhitelist(acc1, true, 'a', { from: owner })
    const status = await InxTokenInstance.getWhitelistStatus(acc1)
    const data = await InxTokenInstance.getWhitelistData(acc1)

    expectEvent.inLogs(logs, 'WhitelistUpdate', { _address: acc1, status: true, data: 'a' })

    assert.equal(status, true, 'whitelist acc2 status should be true')
    assert.equal(data, 'a', "whitelist acc2 data should be 'a'")
  })

  it('Only transfer between whitelisted accounts should succeed', async () => {
    await InxTokenInstance.addWhitelister(owner, { from: owner })
    await InxTokenInstance.setWhitelist(acc1, true, 'a', { from: owner })

    // transfer funds from non whitelisted owner account - should fail
    shouldFail.reverting(InxTokenInstance.transfer(acc1, 100, { from: owner }))

    await InxTokenInstance.setWhitelist(owner, true, 'a', { from: owner })

    // transfer funds from whitelisted owner account - should suceed
    InxTokenInstance.transfer(acc1, 100, { from: owner })
  })
})
