// const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider")
require("dotenv").config()

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration> to customize your Truffle configuration!
  // contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      // gas: 20000000,
      network_id: "*",
      skipDryRun: true
    },
    ropsten: {
      provider: new HDWalletProvider("enter your key", "wss://ropsten.infura.io/ws/v3/8008f1ed67da46b895a65f1200933ff9"),
      network_id: 3,
      gas: 5000000,
    gasPrice: 5000000000, // 5 Gwei
    skipDryRun: true,
    timeoutBlocks: 50000

    },
    kovan: {
      provider: new HDWalletProvider("enter your key", "https://kovan.infura.io/v3/8008f1ed67da46b895a65f1200933ff9"),
      network_id: 42,
      gas: 5000000,
    gasPrice: 5000000000, // 5 Gwei
    skipDryRun: true
    },
    mainnet: {
      provider: new HDWalletProvider("enter your key", "ws://54.251.233.167:8546"),
      network_id: 1,
      gas: 5000000,
      gasPrice: 85000000000,
      skipDryRun: true
 // 5 Gwei
    }
  },
  compilers: {
    solc: {
      version: "0.7.1",
    },
  },
  plugins: ["truffle-plugin-verify"],
  api_keys: {
    etherscan: "enter your etherscan key",
  },

};
