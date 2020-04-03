/* global artifacts contract it assert */
const { shouldFail } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

const SUCCESS_CODE = 0
const FAILURE_NON_WHITELIST = 1
const FAILURE_TIMELOCK = 2
const FAILURE_CONTRACT_PAUSED = 3
const SUCCESS_MESSAGE = 'SUCCESS'
const FAILURE_NON_WHITELIST_MESSAGE = 'The transfer was restricted due to white list configuration.'
const FAILURE_TIMELOCK_MESSAGE = 'The transfer was restricted due to timelocked tokens.'
const FAILURE_CONTRACT_PAUSED_MESSAGE = 'The transfer was restricted due to the contract being paused.'
const UNKNOWN_ERROR = 'Unknown Error Code'

contract('1404 Restrictions', (accounts) => {
  let tokenInstance, restrictionsInstance
  beforeEach(async () => {
    tokenInstance = await InxToken.new(accounts[0])
    restrictionsInstance = await TransferRestrictions.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })
  it('should deploy', async () => {
    assert.equal(tokenInstance !== null, true, 'Contract should be deployed')
  })

  it('should fail if TransferRestrictions are not set', async () => {
    tokenInstance = await InxToken.new(accounts[0])
    // Both not on white list - should fail
    await shouldFail.reverting(tokenInstance.detectTransferRestriction.call(accounts[5], accounts[6], 100))
  })

  it('should fail with non whitelisted accounts', async () => {
    // Both not on white list - should fail
    let failureCode = await tokenInstance.detectTransferRestriction.call(accounts[5], accounts[6], 100)
    let failureMessage = await tokenInstance.messageForTransferRestriction(failureCode)
    assert.equal(failureCode, FAILURE_NON_WHITELIST, 'Both Non-whitelisted should get failure code')
    assert.equal(failureMessage, FAILURE_NON_WHITELIST_MESSAGE, 'Failure message should be valid for restriction')

    await tokenInstance.addWhitelister(accounts[1], { from: accounts[0] })
    // Only one added to white list 20 - should fail
    await tokenInstance.setWhitelist(accounts[5], true, 'whitelist message', { from: accounts[1] })
    failureCode = await tokenInstance.detectTransferRestriction.call(accounts[5], accounts[6], 100)
    failureMessage = await tokenInstance.messageForTransferRestriction(failureCode)
    assert.equal(failureCode, FAILURE_NON_WHITELIST, 'One Non-whitelisted should get failure code')
    assert.equal(failureMessage, FAILURE_NON_WHITELIST_MESSAGE, 'Failure message should be valid for restriction')

    // Second added to white list 20 - should still fail
    await tokenInstance.setWhitelist(accounts[6], true, 'whitelist message', { from: accounts[1] })

    // Should now succeed
    failureCode = await tokenInstance.detectTransferRestriction.call(accounts[5], accounts[6], 100)
    failureMessage = await tokenInstance.messageForTransferRestriction(failureCode)
    assert.equal(failureCode, SUCCESS_CODE, 'Both in same whitelist should pass')
    assert.equal(failureMessage, SUCCESS_MESSAGE, 'Should be success')
  })

  it('should fail if tokens are timelocked', async () => {

    // add accounts to whitelist to bypass whitelist restriction
    await tokenInstance.addTimelocker(accounts[0], { from: accounts[0] })
    await tokenInstance.addWhitelister(accounts[1], { from: accounts[0] })
    await tokenInstance.setWhitelist(accounts[5], true, 'whitelist message', { from: accounts[1] })
    await tokenInstance.setWhitelist(accounts[6], true, 'whitelist message', { from: accounts[1] })
    await tokenInstance.setWhitelist(accounts[0], true, 'whitelist message', { from: accounts[1] })
    await tokenInstance.transfer(accounts[5], 100, { from: accounts[0] })
    const expiration = Date.now() + 500000
    await tokenInstance.lock(accounts[5], 50, expiration, { from: accounts[0] })

    const failureCode = await tokenInstance.detectTransferRestriction.call(accounts[5], accounts[6], 75)
    const failureMessage = await tokenInstance.messageForTransferRestriction(failureCode)
    assert.equal(failureCode, FAILURE_TIMELOCK, 'Sending locked funds should get failure code')
    assert.equal(failureMessage, FAILURE_TIMELOCK_MESSAGE, 'Failure message should be valid for restriction')
  })

  it('should fail if contract is paused', async () => {

    // add account to pauser role
    await tokenInstance.addPauser(accounts[1], { from: accounts[0] })

    // add account to whitelister role
    await tokenInstance.addWhitelister(accounts[2], { from: accounts[0] })
    await tokenInstance.setWhitelist(accounts[5], true, 'whitelist message', { from: accounts[2] })
    await tokenInstance.setWhitelist(accounts[0], true, 'whitelist message', { from: accounts[2] })
    await tokenInstance.pause({ from: accounts[1] })

    const failureCode = await tokenInstance.detectTransferRestriction.call(accounts[5], accounts[0], 75)
    const failureMessage = await tokenInstance.messageForTransferRestriction(failureCode)
    assert.equal(failureCode, FAILURE_CONTRACT_PAUSED, 'Sending funds while paused should get failure code')
    assert.equal(failureMessage, FAILURE_CONTRACT_PAUSED_MESSAGE, 'Failure message should be valid for paused contract')
  })

  it('should handle unknown error codes', async () => {

    const failureMessage = await tokenInstance.messageForTransferRestriction(1001)
    assert.equal(failureMessage, UNKNOWN_ERROR, 'Should be unknown error code for restriction')
  })
})
