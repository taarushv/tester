const Web3 = require('web3')

// Web3 configured to Ropsten test network
var web3 = new Web3('http://127.0.0.1:8545')
const pKey = '8f649dc789f06b34ae6de8a4fabd680408877699593603b3123bad1e5514572b'
const account = web3.eth.accounts.privateKeyToAccount('0x' + pKey);
web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;
web3.eth.getBalance('0x71A8203FC0b43B19De06c0FFE701C9F3DC1c225d').then(console.log)


//console.log()

// // Distribute Ether
// async function distribute () {
//   // Retrieve params of main account that funds all new wallets. 
  

 
//   // send each Tx
//   web3.eth.getTransactionCount(account).then(async (_nonce) => {
//       // Create TX data
//       const txObject = {
//         nonce: web3.utils.toHex(_nonce + i),
//         to: '0x08b3A1817b57b759B61e7358Fa1264D280FeD731',
//         value: web3.utils.toHex(web3.utils.toWei('0.1', 'ether')),
//         gasLimit: web3.utils.toHex(21000),
//         gasPrice: web3.utils.toHex(web3.utils.toWei('20', 'gwei'))
//       }

//       // Sign the transaction

//       const tx = new Tx(txObject)
//       tx.sign('0x'+ pKey)

//       const serializedTx = tx.serialize()
//       const raw = '0x' + serializedTx.toString('hex')

//       // Broadcast the transaction

//       web3.eth.sendSignedTransaction(raw, (err, txHash) => {
//         if (err) {
//           return (err)
//         }
//         console.log('txHash:', txHash)
//       })
//   })
//   return ('OK')
// }



// distribute()