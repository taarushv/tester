
const HDWalletProvider = require('truffle-hdwallet-provider');
// const infuraKey = "fj4jll3k.....";
//
// const fs = require('fs');
//const mnemonic = fs.readFileSync(".secret").toString().trim();
require('dotenv').config()  

const mnemonic = process.env.MNENOMIC;


module.exports = {
  // Uncommenting the defaults below 
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  



  networks: {
    
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    /*
    development2: {
      host: "127.0.0.1",
      port: 9545,
      network_id: 5778
    },
    */
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/8b2161bf6ae042ffaad23504623dd0f5`,1),
      network_id: 3,       // Ropsten's id
      gas: 5500000,
      timeoutBlocks: 200,
      skipDryRun: true     // Ropsten has a lower block limit than mainnet
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/v3/8b2161bf6ae042ffaad23504623dd0f5',1),
      network_id: 4,       // Ropsten's id
      gas: 5500000,
      timeoutBlocks: 200,
      skipDryRun: true     // Ropsten has a lower block limit than mainnet
    },
    main: {
      provider: () => new HDWalletProvider(mnemonic, 'https://mainnet.infura.io/v3/8b2161bf6ae042ffaad23504623dd0f5'),
      network_id: 1,       // Ropsten's id
      gas: 5500000,
      timeoutBlocks: 200,
      skipDryRun: false        // Ropsten has a lower block limit than mainnet
    }
  },
  compilers: {
    solc: {
      version: "0.5.8",    // Fetch exact version from solc-bin (default: truffle's version)  
      settings: {          // See the solidity docs for advice about optimization and evmVersion
       optimizer: {
         enabled: false,
         runs: 200
       }
      }
    }
  },
  plugins: [
    "solidity-coverage" //https://github.com/sablierhq/sablier/pull/8/files
  ]
  
};
