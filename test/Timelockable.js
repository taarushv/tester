/* global artifacts contract it assert */
const { shouldFail, expectEvent } = require('openzeppelin-test-helpers')
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

const wait = (msWait) => new Promise((res, _) => setTimeout(() => res(), msWait))

/**
 * Sanity check for transferring ownership.  Most logic is fully tested in OpenZeppelin lib.
 */
contract('Timelockable', (accounts) => {
  let tokenInstance, restrictionsInstance
  // set up account roles
  const ownerAccount = accounts[0]
  const whitelisterAccount = accounts[1]
  const whitelistedAccount = accounts[2]
  const whitelistedLockedAccount = accounts[3]

  beforeEach(async () => {
    tokenInstance = await InxToken.new(ownerAccount)
    restrictionsInstance = await TransferRestrictions.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('Owner should be able to lock/release tokens', async () => {
    // set up test constants
    const expiration = Date.now() + 100000
    const transferAmount = 100
    const lockAmount = 50
    const failedTransferAmount = 51
    const successTransferAmount = 40
    const unlockedTransferAmount = 60

    // add owner account to timelocker role
    await tokenInstance.addTimelocker(ownerAccount, { from: ownerAccount })

    // add accounts to whitelist to bypass whitelist restriction
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(whitelistedAccount, true, 'whitelist message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(whitelistedLockedAccount, true, 'whitelist message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'whitelist message', { from: whitelisterAccount })

    // transfer tokens to be locked
    await tokenInstance.transfer(whitelistedLockedAccount, transferAmount, { from: ownerAccount })

    // lock the tokens
    await tokenInstance.lock(whitelistedLockedAccount, lockAmount, expiration, { from: ownerAccount })

    // confirm the accounts lock state
    const lockupState = await tokenInstance.checkLockup(whitelistedLockedAccount)
    assert.equal(lockupState['0'].toString(), expiration, 'User lock time should be the expiration time passed in')
    assert.equal(lockupState['1'], lockAmount, 'User lock amount should be the amount passed in')

    // transfer more than the unlocked balance - should fail
    shouldFail.reverting(tokenInstance.transfer(whitelistedAccount, failedTransferAmount, { from: whitelistedLockedAccount }))

    // transfer less than the unlocked balance = should succeed
    await tokenInstance.transfer(whitelistedAccount, successTransferAmount, { from: whitelistedLockedAccount })

    // attempt to transfer locked funds - shuold fail
    shouldFail.reverting(tokenInstance.transfer(whitelistedAccount, unlockedTransferAmount, { from: whitelistedLockedAccount }))

    // release the locked tokens
    await tokenInstance.release(whitelistedLockedAccount, lockAmount, { from: ownerAccount })

    // transfer the unlocked tokens - should succeed
    await tokenInstance.transfer(whitelistedAccount, unlockedTransferAmount, { from: whitelistedLockedAccount })
  })

  it('Owner should be able to update timelocks', async () => {
    // set up test constants
    const initialExpiration = Date.now() + 100000
    const initLockAmount = 50
    const secondExpiration = Date.now() + 564556
    const secondLockAmount = 77

    // add owner account to timelocker role
    await tokenInstance.addTimelocker(ownerAccount, { from: ownerAccount })

    // lock the tokens
    await tokenInstance.lock(whitelistedLockedAccount, initLockAmount, initialExpiration, { from: ownerAccount })

    // confirm the accounts lock state
    const lockupState = await tokenInstance.checkLockup(whitelistedLockedAccount)

    assert.equal(lockupState['0'].toString(), initialExpiration, 'User lock time should be the expiration time passed in')
    assert.equal(lockupState['1'], initLockAmount, 'User lock amount should be the amount passed in')

    // up the time lock
    await tokenInstance.lock(whitelistedLockedAccount, secondLockAmount, secondExpiration, { from: ownerAccount })

    // confirm the updated timelock
    const updatedLockupState = await tokenInstance.checkLockup(whitelistedLockedAccount)

    assert.equal(updatedLockupState['0'].toString(), secondExpiration, 'User lock time expiration should be updated')
    assert.equal(updatedLockupState['1'], secondLockAmount, 'User lock amount should updated')
  })

  it('Owner should be able to release timelocks', async () => {
    // set up test constants
    const initialExpiration = Date.now() + 100000
    const initLockAmount = 100
    const releaseAmount = 77
    const postReleaseAmount = initLockAmount - releaseAmount

    // add owner account to timelocker role
    await tokenInstance.addTimelocker(ownerAccount, { from: ownerAccount })

    // lock the tokens
    await tokenInstance.lock(whitelistedLockedAccount, initLockAmount, initialExpiration, { from: ownerAccount })

    // confirm the accounts lock state
    const lockupState = await tokenInstance.checkLockup(whitelistedLockedAccount)

    assert.equal(lockupState['0'].toString(), initialExpiration, 'User lock time should be the expiration time passed in')
    assert.equal(lockupState['1'], initLockAmount, 'User lock amount should be the amount passed in')

    // up the time lock
    await tokenInstance.release(whitelistedLockedAccount, releaseAmount, { from: ownerAccount })

    // confirm the updated timelock
    const updatedLockupState = await tokenInstance.checkLockup(whitelistedLockedAccount)

    assert.equal(updatedLockupState['0'].toString(), initialExpiration, 'User lock time should be the initial expiration time passed in')
    assert.equal(updatedLockupState['1'], postReleaseAmount, 'User lock amount should updated')
  })

  it('Expired timelocks should not prevent transfers', async () => {
    // set up test constants
    const transferAmount = 100

    // add owner account to timelocker role
    await tokenInstance.addTimelocker(ownerAccount, { from: ownerAccount })

    // add accounts to whitelist to bypass whitelist restriction
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(whitelistedAccount, true, 'whitelist message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(whitelistedLockedAccount, true, 'whitelist message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'whitelist message', { from: whitelisterAccount })

    // transfer tokens to be locked
    await tokenInstance.transfer(whitelistedLockedAccount, transferAmount, { from: ownerAccount })

    // get current time in seconds and add 3 seconds because timelocks must have an expiration set in the future
    const expiration = Math.floor(Date.now() / 1000) + 2

    // lock the tokens
    await tokenInstance.lock(whitelistedLockedAccount, transferAmount, expiration, { from: ownerAccount })

    // wait for the expiration on the timelock to pass
    await wait(3000)

    // transfer locked tokens, timelock is expired - should succeed
    await tokenInstance.transfer(whitelistedAccount, transferAmount, { from: whitelistedLockedAccount })
  })

  it('Non owners should not be able to lock/release tokens', async () => {
    // set up test constants
    const expiration = Date.now() + 100000
    const transferAmount = 100
    const lockAmount = 50
    const releaseAmount = 20

    // add owner account to timelocker role
    await tokenInstance.addTimelocker(ownerAccount, { from: ownerAccount })

    // add accounts to whitelist to bypass whitelist restriction
    await tokenInstance.addWhitelister(whitelisterAccount, { from: ownerAccount })
    await tokenInstance.setWhitelist(whitelistedAccount, true, 'whitelist message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(whitelistedLockedAccount, true, 'whitelist message', { from: whitelisterAccount })
    await tokenInstance.setWhitelist(ownerAccount, true, 'whitelist message', { from: whitelisterAccount })

    // transfer tokens to be locked
    await tokenInstance.transfer(whitelistedLockedAccount, transferAmount, { from: ownerAccount })

    // lock the tokens from non owners - should fail
    await shouldFail.reverting(tokenInstance.lock(whitelistedLockedAccount, lockAmount, expiration, { from: whitelisterAccount }))
    await shouldFail.reverting(tokenInstance.lock(whitelistedLockedAccount, lockAmount, expiration, { from: whitelistedAccount }))

    // lock the tokens to attempt lock release
    await tokenInstance.lock(whitelistedLockedAccount, lockAmount, expiration, { from: ownerAccount })

    // release the timelock from non owners - should fail
    await shouldFail.reverting(tokenInstance.release(whitelistedLockedAccount, releaseAmount, { from: whitelisterAccount }))
    await shouldFail.reverting(tokenInstance.release(whitelistedLockedAccount, releaseAmount, { from: whitelistedAccount }))
  })

  it('should emit event when tokens are locked', async () => {
    // set up test constants
    const expiration = Date.now() + 100000
    const lockAmount = '50'

    // add owner account to timelocker role
    await tokenInstance.addTimelocker(ownerAccount, { from: ownerAccount })

    // lock the tokens
    const { logs } = await tokenInstance.lock(whitelistedLockedAccount, lockAmount, expiration, { from: ownerAccount })

    expectEvent.inLogs(logs, 'AccountLock', { _address: whitelistedLockedAccount, amount: lockAmount, releaseTime: expiration.toString() })
  })

  it('should emit event when tokens are released', async () => {
    // set up test constants
    const expiration = Date.now() + 100000
    const lockAmount = '50'
    const releaseAmount = '30'
    const lockReleaseDifference = lockAmount - releaseAmount

    // add owner account to timelocker role
    await tokenInstance.addTimelocker(ownerAccount, { from: ownerAccount })

    // lock the tokens
    await tokenInstance.lock(whitelistedLockedAccount, lockAmount, expiration, { from: ownerAccount })

    // release amount less than time lock amount
    const release1 = await tokenInstance.release(whitelistedLockedAccount, releaseAmount, { from: ownerAccount })

    // confirm the released amount is in the log
    expectEvent.inLogs(release1.logs, 'AccountRelease', { _address: whitelistedLockedAccount, amount: releaseAmount })

    // release amount greater than time lock amount
    const release2 = await tokenInstance.release(whitelistedLockedAccount, releaseAmount, { from: ownerAccount })

    expectEvent.inLogs(release2.logs, 'AccountRelease', { _address: whitelistedLockedAccount, amount: lockReleaseDifference.toString() })

    // release amount from timelock with no locked tokens
    const release3 = await tokenInstance.release(whitelistedLockedAccount, releaseAmount, { from: ownerAccount })

    expectEvent.inLogs(release3.logs, 'AccountRelease', { _address: whitelistedLockedAccount, amount: '0' })
  })
})
