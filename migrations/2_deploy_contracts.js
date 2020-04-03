// Config file that gets # of exchanges and # of tokens ea
const config = require('../config.json')
// contract token instance 
// says 'inx' because this is a forked repo, will replace on final deployment
const InxToken = artifacts.require('InxToken')
const TransferRestrictions = artifacts.require('TransferRestrictions')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const keysAdapter = new FileSync("keysDB.json");
const keysDB = low(keysAdapter);
// Initializing a lowdb instance to store deployed contract address and abi 
const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults({ abi: [], address: '0x0'}).write()
  // helper sleep function 
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
 // function to whitelist omnibus accounts before transferring tokens to them
const whitelistExchanges = async(inxInstance, accounts) => {
    return new Promise(async (resolve, reject) =>{
      const totalExchanges = config.totalExchanges
      for(var i=0;i<totalExchanges;i++){
        const currentExchange = keysDB.get('keys').find({id:i+23}).value()
        await inxInstance.setWhitelist(currentExchange.address, true, 'Approved as an Exchange', {from:accounts[0]})
        await sleep(1000)
        console.log((`Adding Exchange ${currentExchange.address} to whitelist`))
      }
      resolve(true)
    })
    
}
// function to transfer tokens to omnibus accounts
const fundExchanges = async(inxInstance, accounts) => {
  return new Promise(async(resolve, reject)=> {
    const totalExchanges = config.totalExchanges
      for(var i=0;i<totalExchanges;i++){
        const currentExchange = keysDB.get('keys').find({id:i+23}).value()
        await inxInstance.transfer(currentExchange.address,  config.tokensPerExchange, {from:accounts[0]});   
         await sleep(1000)
        console.log((`Funding Exchange ${currentExchange.address}`))
      }
      resolve(true)
  })
  
}

// executed upon 'truffle migrate'
module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(InxToken, accounts[0])
  await deployer.deploy(TransferRestrictions, InxToken.address)
  const inxInstance = await InxToken.deployed()
  // store contract address and abi
  db.set('address', inxInstance.address).write();
  db.set('abi', inxInstance.abi).write()
  await inxInstance.updateTransferRestrictions(TransferRestrictions.address)
  // whitelist admin account and allow whitelister priviledges
  await inxInstance.addWhitelister(accounts[0], {from:accounts[0]})
  await inxInstance.setWhitelist(accounts[0], true, 'Approved because admin', {from:accounts[0]})
  // wait for exchanges to be whitelisted before sending tokens
  await whitelistExchanges(inxInstance, accounts)
  await fundExchanges(inxInstance, accounts)
}