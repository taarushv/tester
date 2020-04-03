/* global artifacts contract it assert */
const BigNumber = require('bignumber.js')

const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')

contract('InxToken', (accounts) => {
  let tokenInstance, restrictionsInstance
  const owner = accounts[0]
  const acc1 = accounts[1]
  const acc2 = accounts[2]
  const acc3 = accounts[3]
  const acc4 = accounts[4]

  beforeEach(async () => {
    tokenInstance = await InxToken.new(accounts[0])
    restrictionsInstance = await TransferRestrictions.new(tokenInstance.address)
    await tokenInstance.updateTransferRestrictions(restrictionsInstance.address)
  })

  it('should deploy', async () => {
    assert.equal(tokenInstance !== null, true, 'Contract should be deployed')
  })

  it('owner owns 200,000,000 inx', async () => {
    const balance = await tokenInstance.balanceOf(owner)
    assert.equal(balance.toString(), '200000000000000000000000000', 'Owner should own 200,000,000 inx')
  })

  it('should have correct details set', async () => {
    assert.equal(await tokenInstance.name.call(), 'INX Token', 'Name should be set correctly')
    assert.equal(await tokenInstance.symbol.call(), 'INX', 'Symbol should be set correctly')
    assert.equal(await tokenInstance.decimals.call(), 18, 'Decimals should be set correctly')
  })

  it('should mint tokens to owner', async () => {
    // Expected amount is decimals of (10^18) time supply of 50 billion
    const expectedSupply = new BigNumber(10).pow(18).multipliedBy(2).multipliedBy(100000000)
    const creatorBalance = new BigNumber(await tokenInstance.balanceOf(accounts[0]))

    // Verify the creator got all the coins
    assert.equal(creatorBalance.toFixed(), expectedSupply.toFixed(), 'Creator should have 200,000,000 tokens (including decimals)')

    // Verify some other random accounts for kicks
    const bad1Balance = new BigNumber(await tokenInstance.balanceOf(accounts[1]))
    const bad2Balance = new BigNumber(await tokenInstance.balanceOf(accounts[2]))
    const bad3Balance = new BigNumber(await tokenInstance.balanceOf(accounts[3]))
    assert.equal(bad1Balance.toFixed(), '0', 'Other accounts should have 0 coins')
    assert.equal(bad2Balance.toFixed(), '0', 'Other accounts should have 0 coins')
    assert.equal(bad3Balance.toFixed(), '0', 'Other accounts should have 0 coins')
  })

  it('should mint tokens to different owner', async () => {
    // Expected amount is decimals of (10^18) time supply of 50 billion
    const expectedSupply = new BigNumber(10).pow(18).multipliedBy(2).multipliedBy(100000000)
    const creatorBalance = new BigNumber(await tokenInstance.balanceOf(owner))

    // Verify the creator got all the coins
    assert.equal(creatorBalance.toFixed(), expectedSupply.toFixed(), 'Owner should have 50 Billion tokens (including decimals)')

    // Verify some other random accounts for kicks
    const bad1Balance = new BigNumber(await tokenInstance.balanceOf(accounts[1]))
    const bad2Balance = new BigNumber(await tokenInstance.balanceOf(accounts[2]))
    const bad3Balance = new BigNumber(await tokenInstance.balanceOf(accounts[3]))
    assert.equal(bad1Balance.toFixed(), '0', 'Other accounts should have 0 coins')
    assert.equal(bad2Balance.toFixed(), '0', 'Other accounts should have 0 coins')
    assert.equal(bad3Balance.toFixed(), '0', 'Other accounts should have 0 coins')
  })
})
