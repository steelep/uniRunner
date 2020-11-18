///INX, Add/Update Ethereum MainNet WSS Endpoint to line 17
//Line 44 & 43 add private key.

var InputDataDecoder = require( "ethereum-input-data-decoder");
var Web3 = require(  "web3");
var pkg = require(  '@uniswap/sdk');
var ethers = require(  'ethers');
var ganacheCLI = require(  'ganache-cli');
var fs = require('fs');
const getRevertReason = require('eth-revert-reason')
var Tx = require('ethereumjs-tx').Transaction


const { ChainId, JSBI, BigintIsh, Fetcher, WETH, Route, Token, Pair, Price, Trade, Fractions, TokenAmount, TradeType, Percent } = pkg;
const chainId = ChainId.MAINNET;

var productionServer = "ws://18.141.143.98:8546"; //My Amazon  AWSprivate GETH MainNet Node
var web3 = new Web3(productionServer); // same output as with option below
web3.eth.handleRevert = true
let wsProvider = new ethers.providers.WebSocketProvider(productionServer, chainId); //Needed for uniswapV2 JS SDK, not compatible with Web3


var BN = web3.utils.BN
let approvedContracts = require('./approvedERC20.json');
let bannedContracts = require('./bannedERC20.json');

const { resolve } = require("path");

var txCount = 0;
var hashesSeen = {};
var ethValue = 477
var approvalGasPrice = '180000000000'


//Risk Parameters
var minTradeAmount = 30 //USD
var minProfitAmount = 15 //USD
var minGasPrice = 10 //GWEI - Make sure we wont bid a trade that is super slow
var maxGasPrice = 120 //GWEI - Make sure we wont be totally out of contention
var minGasLimit = 135000 //WEI - Stop TX reverting due to out of gas
var maxTradeRiskSize = 305 //USD - may do in eth?

const PRIV_KEY = Buffer.from(' ADD PRIVATE KEY HERE ', 'hex') //for account: 
const PRIV_ACC = "ADD ACCOUNT ADDRESS HERE "
var openBalanceMyETH = 0

var GLOBAL_CAN_TRADE_FLAG = true //atomic flag to suspend trading when active deals are online
var firstRun = true


const UNISWAP_ROUTERV2_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const UNISWAP_FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
const WETH_ERC20_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"

const UniSwapV2PairABI =[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]
const decoder = new InputDataDecoder([{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]);
const ERC20TransferABI = [{ "constant": true, "inputs": [], "name": "name", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [ { "name": "", "type": "uint8" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "name": "balance", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [ { "name": "", "type": "string" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [ { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "transfer", "outputs": [ { "name": "", "type": "bool" } ], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [ { "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" } ], "name": "allowance", "outputs": [ { "name": "", "type": "uint256" } ], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" } ]
const UniSwapV2RouterABI = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}];
const UniSWapFactoryABI = [{"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token0","type":"address"},{"indexed":true,"internalType":"address","name":"token1","type":"address"},{"indexed":false,"internalType":"address","name":"pair","type":"address"},{"indexed":false,"internalType":"uint256","name":"","type":"uint256"}],"name":"PairCreated","type":"event"},{"constant":true,"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"allPairs","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"allPairsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"createPair","outputs":[{"internalType":"address","name":"pair","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"feeTo","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"feeToSetter","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"getPair","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeTo","type":"address"}],"name":"setFeeTo","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_feeToSetter","type":"address"}],"name":"setFeeToSetter","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]


//Main Loop

//Get Authorised Tokens

//Get Private Key and Account Credentials


web3.eth.getAccounts(console.log);
var subscription = web3.eth
.subscribe("pendingTransactions")
.on("data", async function (transactionHash) {
 
 if (!hashesSeen.hasOwnProperty(transactionHash)) {
   hashesSeen[transactionHash] = true;
   var transaction = await web3.eth.getTransaction(transactionHash);
   if (transaction == null) {
     setTimeout(async function () {
       transaction = await web3.eth.getTransaction(transactionHash);
     }, 100);
   }
   try {
     if (transaction.to == UNISWAP_ROUTERV2_ADDRESS) { //Uniswap Router V02 Address
       var decodedInput = decoder.decodeData(transaction.input);
       if(decodedInput.method == 'swapExactETHForTokens'){
         var tValue = (web3.utils.fromWei(transaction.value,"ether")* ethValue)
         if (tValue < 50){
           return
           }
       if(decodedInput.inputs[1].length > 2){  //only support direct pair trading, no hops
           return
       }
       if(!firstRun){ //Blocks execution
           return
       }else{
           //firstRun = false
       }
           var otherTokenAddress = web3.utils.toChecksumAddress( decodedInput.inputs[1][1])
           //console.log("otherTokenAddress", otherTokenAddress)
           var wethTokenAddress = web3.utils.toChecksumAddress(decodedInput.inputs[1][0])

           const wethContract = new web3.eth.Contract(ERC20TransferABI, wethTokenAddress)           
           const otherTokenContract = new web3.eth.Contract(ERC20TransferABI, otherTokenAddress)           
           
           var symbol = await otherTokenContract.methods.symbol().call()
           calcPnLV2(decodedInput, transaction, symbol, wethContract, otherTokenContract, txCount)

           //simulateTradesAndReturnPnL(decodedInput, transaction, symbol, tValue, txCount)
         }
     }
   }catch (err) {}//(console.log("ERRROR Ignoring", transactionHash, transaction))}
   
   txCount++;
 }
});
async function calcPnLV2(_decodedInput, _transaction, _symbol, tokenAContract, tokenBContract, _txCount){
//Hand Calculated PnL -- Need to approximate for gas.
try{
openBalanceMyETH = await web3.eth.getBalance(PRIV_ACC)

const tokenA = new Token( ChainId.MAINNET, tokenAContract.options.address, parseInt(await (tokenAContract.methods.decimals().call())))
const tokenB = new Token( ChainId.MAINNET, tokenBContract.options.address, parseInt(await (tokenBContract.methods.decimals().call())))
const uniswapFactoryContract = new web3.eth.Contract(UniSWapFactoryABI, UNISWAP_FACTORY_ADDRESS)           
var uniswapTokenABPairAddress = web3.utils.toChecksumAddress(await uniswapFactoryContract.methods.getPair(tokenAContract.options.address, tokenBContract.options.address).call())
const uniswapTokenABPairContract = new web3.eth.Contract(UniSwapV2PairABI, uniswapTokenABPairAddress)           

var tempReserves = await uniswapTokenABPairContract.methods.getReserves().call()
//console.log(tempReserves)



var pairReservesA, pairReservesB
if(!tokenA.sortsBefore(tokenB)){
 pairReservesA =  new TokenAmount(tokenA, new BN(tempReserves[1]));
 pairReservesB =  new TokenAmount(tokenB, new BN(tempReserves[0]));
}else{
 pairReservesA =  new TokenAmount(tokenA, new BN(tempReserves[0]));
 pairReservesB =  new TokenAmount(tokenB, new BN(tempReserves[1]));
}


var myETHInput = new TokenAmount(tokenA, Math.round(_transaction.value)) //.49*
var otherMinOutTokenB = new TokenAmount(tokenB, _decodedInput.inputs[0])
var origTicketGasPriceGwei = (web3.utils.fromWei(String(_transaction.gasPrice),"gwei"))
var origTicketGasLimitGwei = (web3.utils.fromWei(String(_transaction.gas),"gwei"))
var origTicketGasLimit = (_transaction.gas)

var totalGasFeeEth = (web3.utils.fromWei(String((_transaction.gasPrice) * (_transaction.gas)),"ether"))
var secondsRemainingUntilDeadline = parseInt(_decodedInput.inputs[3]) - Math.floor(Date.now() / 1000)

console.log("*",_symbol, "SwapE2T, $"+ Math.round(((web3.utils.fromWei(_transaction.value,"ether"))*ethValue),2), _transaction.hash, _txCount)


//Ticket Slippage Calculations
var pairUnaltered = new Pair(pairReservesA, pairReservesB); //1st Leg - Reserves Snapshotted as of last block.
var outputAmountOfTokenMyBuy = pairUnaltered.getOutputAmount(new TokenAmount(tokenA, String(myETHInput.raw)))

var outputAmountOfOtherTokenBuyOrigIntended = pairUnaltered.getOutputAmount(new TokenAmount(tokenA, String(_transaction.value)))
var origTradeSlippageVsMidPcnt = (100 - (otherMinOutTokenB.toExact() / outputAmountOfOtherTokenBuyOrigIntended[0].toExact())*100).toFixed(9) //returns in % e.g. .49 = 49bps
var origTradeSlippageVsExecPcnt = 100*(1 - (outputAmountOfOtherTokenBuyOrigIntended[0].toExact() /((pairReservesB.toExact() /pairReservesA.toExact() ) * (web3.utils.fromWei(_transaction.value,"ether"))))) //returns in % e.g. .49 = 49bps

console.log("Slippage allowance on orig ticket", String((parseFloat(origTradeSlippageVsMidPcnt)).toFixed(4))+"%", "Price impact on orig ticket", String(origTradeSlippageVsExecPcnt.toFixed(4))+"%")
console.log("Minimum Tokens out for orig ticket", String(otherMinOutTokenB.toExact()),"Actual Uninteruppted ", outputAmountOfOtherTokenBuyOrigIntended[0].toExact())
console.log("Orig Ticket Gas Price Gwei:", origTicketGasPriceGwei, "Orig Ticket Gas Limit Gwei:", origTicketGasLimit, "Total Gas Price $"+ (totalGasFeeEth * ethValue).toFixed(4))
console.log("Orig Ticket Deadline: (Seconds)", secondsRemainingUntilDeadline)

var maxModSeen = 0
var maxPnLSeen = -1000
var message = "Not Profitable"
var lastRunVariables = {
 'message' : "Not Profitable"
}

var isProfitableFlagAfterGas = false
var isAboveMinTradeAmount = false
var isAboveMinProfit = false
var capitalRequiredIsUnderMaxRisk = false
var isInReasonableTimeFrame = false
var isGasPriceExploitable = false
var isGasLimitValid = false
var isTokenAllowed = false

for (let i = 1; i < 500; i++) { //Simulate 500 different inputs from 1% to 5x of original trade notional, return max PnL amount seen. Returns optimal trade size. Assumes no other front runs or pending exec in block
   var modAmount = i/100
   myETHInput = new TokenAmount(tokenA, Math.round(_transaction.value * modAmount))
   pairUnaltered = new Pair(pairReservesA, pairReservesB); //1st Leg - Reserves Snapshotted as of last block.
   outputAmountOfTokenMyBuy = pairUnaltered.getOutputAmount(new TokenAmount(tokenA, String(myETHInput.raw)))
   pairLegOne = outputAmountOfTokenMyBuy[1]; //2nd Leg - Reserves Snapshotted as after front run.
   outputAmountOfTokenOtherBuy = pairLegOne.getOutputAmount(new TokenAmount(tokenA, String(Math.round((_transaction.value)))))
   pairLegTwo = outputAmountOfTokenOtherBuy[1]; //3rd Leg - Reserves Snapshotted as after othre buy executed.
   outputAmountOfETHatClosing= pairLegTwo.getOutputAmount(new TokenAmount(tokenB, String(outputAmountOfTokenMyBuy[0].raw)))
   var simPnL = String((((outputAmountOfETHatClosing[0]).toExact() - (myETHInput.toExact()))*ethValue).toFixed(4))
   var simPnLNetGas = String(( ( ((outputAmountOfETHatClosing[0]).toExact()) - (myETHInput.toExact())  - (totalGasFeeEth*2) )*ethValue).toFixed(4)) //Assumes we pay 2x What orig ticket paid (+1.01%)


   var out = outputAmountOfTokenOtherBuy[0].toExact(); 
   var outOtherMin = otherMinOutTokenB.toExact()
   var myCapitalOutlay = parseInt((web3.utils.fromWei(_transaction.value,"ether")*modAmount*ethValue))
   //console.log("Leg One output, I buy tokens",_symbol, String((outputAmountOfTokenMyBuy[0].toFixed(4))), "from eth", String(myETHInput.toFixed(4)))
  // console.log("Leg Two output, Other buy tokens",_symbol, String((outputAmountOfTokenOtherBuy[0].toFixed(4))), "from eth", (web3.utils.fromWei(_transaction.value,"ether")))
  // console.log("Leg Three output, I unwind tokens for eth", String(outputAmountOfETHatClosing[0].toFixed(4)), "$PnL: "+ String((((outputAmountOfETHatClosing[0]).toExact() - (myETHInput.toExact()))*ethValue).toFixed(4)))
  // console.log(_symbol, modAmount, outputAmountOfTokenOtherBuy[0].toFixed(4), otherMinOutTokenB.toFixed(4), "$PnL: "+ String(simPnL))


   if( (parseFloat(outOtherMin) >= parseFloat(out)) || (myCapitalOutlay > maxTradeRiskSize)){ //Cancels sim if capital outlay is greater than trade size MAX risk limit or minimum out is breached (ie cause trade failure)
       break
   }

   if((parseFloat(maxPnLSeen) < parseFloat(simPnL))){
     lastRunVariables = {
       'modAmount' : modAmount,
       'myETHInput' : myETHInput,
       'pairUnaltered' : pairUnaltered,
       'outputAmountOfTokenMyBuy' : outputAmountOfTokenMyBuy,
       'pairLegOne' : pairLegOne,
       'outputAmountOfTokenOtherBuy' : outputAmountOfTokenOtherBuy,
       'pairLegTwo' : pairLegTwo, 
       'outputAmountOfETHatClosing' : outputAmountOfETHatClosing, 
       'simPnL' : simPnL,
       'simPnLNetGas' : simPnLNetGas,
       'out' : out,
       'outOtherMin' : outOtherMin,
       'myCapitalOutlay' : myCapitalOutlay,
       'otherMinOutTokenB':otherMinOutTokenB,
       'message' : "Runs"
     }
     maxPnLSeen = simPnL
   }
 }    
 if(simPnLNetGas>0){
   console.log("+",",", _symbol, ",", lastRunVariables.modAmount, ",",  lastRunVariables.myCapitalOutlay,",  ","$PnL: ", (lastRunVariables.simPnL), ",", "$PnLNetGas:", lastRunVariables.simPnLNetGas)
   isProfitableFlagAfterGas = true
 }else{
   console.log("-",",", _symbol, ",", lastRunVariables.modAmount, ",",  lastRunVariables.myCapitalOutlay,",  ","$PnL: ", (lastRunVariables.simPnL), ",", "$PnLNetGas:", lastRunVariables.simPnLNetGas)
   console.log("")
   isProfitableFlagAfterGas = false
 }

 //Core Pretrade check logic
 if(isProfitableFlagAfterGas){

  //1)
  //Check we actually will make a worthwhile profit amount
  if (lastRunVariables.simPnLNetGas >= minProfitAmount){
    isAboveMinProfit = true;
  }else{
      console.log("Failed: Below Minimum Profit")
  }

  //2)
  //Check we wont blow out risk
  if (maxTradeRiskSize < lastRunVariables.myCapitalOutlay){
    console.log("Failed: Trade size is above max specified risk limit")
  }else{
    capitalRequiredIsUnderMaxRisk = true;
  }

  //3)
  //Check trade is in a reasonable time frame - e.g. wont delete before we can p2p a trade up
  if(secondsRemainingUntilDeadline > 10 && secondsRemainingUntilDeadline < 3000){
    isInReasonableTimeFrame = true
  }else{
    console.log("Failed: Deadline is outside of parameters")

  }
  //4)
  //Check orig tickets gas price paid wont have instaneous execution or execute too slowly
  if(minGasPrice < origTicketGasPriceGwei && maxGasPrice > origTicketGasPriceGwei){
    isGasPriceExploitable = true
  }else{
    console.log("Failed: GasPrice is outside of exploitable parameters")

  }
  //5)
  //Check trade is in a reasonable time frame - e.g. wont delete before we can p2p a trade up
  if( origTicketGasLimit > minGasLimit){
    isGasLimitValid = true
  }else{
    console.log("Failed: GasLimit too low trade unlikely to complete")
  }
  //6)
  //Check we arent wasting our time on small trades
  if (lastRunVariables.myCapitalOutlay > minTradeAmount){
    isAboveMinTradeAmount = true;
  }else{
    console.log("Failed: Trade size is too small")
  }

  //7) 
  //Check the contract ERC-20 isnt banned by me

  if (checkApprovedContracts(tokenB.address)){
    isTokenApproved = true; //Approved!
  }else{
    console.log("Failed: ERC20 is NOT on the Approved list")
  }

  if(isAboveMinProfit && capitalRequiredIsUnderMaxRisk && isInReasonableTimeFrame && isGasPriceExploitable && isGasLimitValid && isAboveMinTradeAmount && isTokenApproved && GLOBAL_CAN_TRADE_FLAG){
    firstRun = false; //Stop More Execution     
    GLOBAL_CAN_TRADE_FLAG = false 
   
    console.log(_symbol, "Token Address: ", tokenB.address, Date.now())

    console.log("Leg One output, I buy tokens",_symbol, String((lastRunVariables.outputAmountOfTokenMyBuy[0].toFixed(4))), "from eth", String(lastRunVariables.myETHInput.toFixed(4)))
    console.log("Leg Two output, Other buy tokens",_symbol, String((lastRunVariables.outputAmountOfTokenOtherBuy[0].toFixed(4))), "from eth", (web3.utils.fromWei(_transaction.value,"ether")))
    console.log("Leg Three output, I unwind tokens for eth", String(lastRunVariables.outputAmountOfETHatClosing[0].toFixed(4)), "$PnL: "+ String((((lastRunVariables.outputAmountOfETHatClosing[0]).toExact() - (lastRunVariables.myETHInput.toExact()))*ethValue).toFixed(4)))
    console.log(_symbol, lastRunVariables.modAmount, lastRunVariables.outputAmountOfTokenOtherBuy[0].toFixed(4), lastRunVariables.otherMinOutTokenB.toFixed(4), "$PnL: "+ String(lastRunVariables.simPnL))
    console.log("")

    console.log("Sending Trade to Execute...")
    console.log("$$$$$$$$$$$$")
    console.log("Token Link", tokenB.address)
    console.log("")


    var myAccount = PRIV_ACC//(await localWeb3.eth.getAccounts())[0] //Alias
    nonceCount = await web3.eth.getTransactionCount(myAccount,"pending")

   
   try {
        console.log(_symbol, "REAL TRADE *****************************************")
        var totalPnL = -1
  
          //Simulate a transaction on the first occurence of ticker - if Postive PnL, then add to whitelist else, blacklist
          approveERC20Spend(tokenB.address, UNISWAP_ROUTERV2_ADDRESS, myAccount, web3, _transaction, _symbol, nonceCount)
          .then(//Custom Token - Me
          createAndSendMyBuyTransactionSimulated(_decodedInput, _transaction, myAccount, web3, _symbol, lastRunVariables, nonceCount + 1 ))
          .then(
          createAndSendMySellTransactionSimulated(_decodedInput, _transaction, myAccount, web3, _symbol, lastRunVariables, nonceCount+2 )  //Need to add my real account
          );
        
          setTimeout(async () => { 
                  var closeBalanceMyETH = await web3.eth.getBalance(myAccount)
                  totalPnL = ((web3.utils.fromWei(closeBalanceMyETH,"ether")) - openBalanceMyETH) * ethValue
                  console.log("PNL FROM REAL RUN:", _symbol, String(totalPnL))    
          }, 10000);
    
      }catch(err){
       console.log("This is in the catch trade failed", err)
       //Logic to cancel trades goes here
      }
   

  }
console.log("")

}

}catch (err) {console.log(err)}//{console.log("Error - Not Profitable")}
}



//1st Trade
async function createAndSendMyBuyTransactionSimulated(_decodedInput, _transaction, _myAccount, _localWeb3, _symbol, _lastRunVariables, _nonce){
    console.log("Starting TX1", _symbol)

    return new Promise((resolve, reject) => {  
   const amountOutMin = String(_lastRunVariables.outputAmountOfTokenMyBuy[0].raw)
   console.log("Leg One I am buying Minimum token", amountOutMin, "For ETH", String(_lastRunVariables.myETHInput.raw))
   
   //new BN(_decodedInput.inputs[0]).div(new BN('2')).toString() 
   const path = _decodedInput.inputs[1];
   path[0] =  String(_localWeb3.utils.toChecksumAddress(path[0]))
   path[1] =  String(_localWeb3.utils.toChecksumAddress(path[1]))
   const to = _myAccount //Buffer.from(_myAccount, 'hex') ; //May need to hex
   const deadline = Math.floor(Date.now() / 1000) + 180; //Ticket Max Uptime is 3 minutes
   
   const routerV2Contract = new _localWeb3.eth.Contract(UniSwapV2RouterABI, UNISWAP_ROUTERV2_ADDRESS) 
   var approvalTxDataABI = routerV2Contract.methods.swapETHForExactTokens(String(amountOutMin), path, String(_myAccount), deadline).encodeABI()

   const txParams = {
     gas : web3.utils.toHex(_transaction.gas), //Copy original tickets gas limit
     gasPrice: web3.utils.toHex(String(parseInt(_transaction.gasPrice) + 100000000)), //Just bid slightly more than original ticket
     to: UNISWAP_ROUTERV2_ADDRESS,
     data: approvalTxDataABI,
     value: web3.utils.toHex(String(_lastRunVariables.myETHInput.raw)),
     from: _myAccount,
     nonce: web3.utils.toHex(_nonce)
     
   }
   var tx = new Tx(txParams, {'chain':'mainnet'});
   tx.sign(PRIV_KEY);
   
   var serializedTx = tx.serialize();            
   web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
 
   .once('receipt', function(receipt){
   console.log("**", _symbol,"TX1  Msg Receipt",  receipt.transactionHash)
   resolve(confirmationNumber)
    })
   .once('confirmation', async function(confirmationNumber, receipt){ 
   console.log("**", _symbol,"TX1 TX Confirmed", confirmationNumber, receipt.blockNumber, receipt.transactionHash)
   })// receipt)
   .on('error', async function(error){ 
   console.log("**", _symbol,"TX1 Error", error)// receipt)
   })
 })}

//3rd Trade
async function createAndSendMySellTransactionSimulated(_decodedInput, _transaction, _myAccount, _localWeb3, _symbol, _lastRunVariables, _nonce){
    
    _localWeb3.eth.handleRevert = true
    console.log("Starting TX3", _symbol)
    return new Promise(async(resolve, reject) => {  

   const amountOutMin = _lastRunVariables.myETHInput;    
   const amountIn = _lastRunVariables.outputAmountOfTokenMyBuy[0].raw //var _tokenAmountToSell = await new _localWeb3.utils.BN((await _otherTokenContractLocal.methods.balanceOf(_myAccount).call())) 
   const path = [2];
   path[0] =  String(_localWeb3.utils.toChecksumAddress(_decodedInput.inputs[1][1]))
   path[1] =  String(_localWeb3.utils.toChecksumAddress(_decodedInput.inputs[1][0]))
   const deadline = Math.floor(Date.now() / 1000) + 180; //Ticket Max Uptime is 3 minutes
   const routerV2Contract = new _localWeb3.eth.Contract(UniSwapV2RouterABI, UNISWAP_ROUTERV2_ADDRESS) 

   var approvalTxDataABI = routerV2Contract.methods.swapExactTokensForETH((String(amountIn)), String(amountOutMin.raw), path, String(_myAccount), (deadline)) .encodeABI()
   var newInputValue = 0 //no eth sending just gas to unwind trade

   //console.log(_transaction)
   const txParams = {
    gas : web3.utils.toHex(300000), //Copy original tickets gas limit
    gasPrice: web3.utils.toHex(String(parseInt(_transaction.gasPrice) - 1000000000)), //Just bid slightly less than original ticket
    to: UNISWAP_ROUTERV2_ADDRESS,
     data: approvalTxDataABI,
     value: web3.utils.toHex(newInputValue),
     from: _myAccount,
     nonce: web3.utils.toHex(_nonce)
   }

   var tx = new Tx(txParams, {'chain':'mainnet'});
   tx.sign(PRIV_KEY);
   
   var serializedTx = tx.serialize();            
   web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
 
   .once('receipt', function(receipt){
   console.log("**", _symbol,"TX3  Msg Receipt",  receipt.transactionHash)
   resolve(confirmationNumber)
    })
   .once('confirmation', async function(confirmationNumber, receipt){ 
   console.log("**", _symbol,"TX3 TX Confirmed", confirmationNumber, receipt.blockNumber, receipt.transactionHash)
   })// receipt)
   .on('error', async function(error){ 
   console.log("**", _symbol,"TX3 Error", error)// receipt)
   })
 })}
async function approveERC20Spend(_addressOfToken, _addressOfSmartContractSpending, _accountPayingGas, _localWeb3, _transaction, _symbol, _nonce){
  //https://d2uvd02r4antif.cloudfront.net/docs/guides/how-to-set-your-token-allowances#setting-allowances-for-a-quote-with-web3js
  console.log("Starting Approval", _symbol)

  return new Promise((resolve, reject) => {  
  var otherTokenAddress = _localWeb3.utils.toChecksumAddress(_addressOfToken)
  var addressOfSmartContractSpending = _localWeb3.utils.toChecksumAddress(_addressOfSmartContractSpending)
  var accountPayingGas = _localWeb3.utils.toChecksumAddress(_accountPayingGas)
  
  let a = ethers.BigNumber.from(2);
  let b = ethers.BigNumber.from(256);
  let c = ethers.BigNumber.from(1);
  let d = ethers.BigNumber.from((a.pow(b)))
  
  const maxApproval =  new ethers.BigNumber.from((d).sub(c));
  const MAX_APPROVAL_STRING = maxApproval.toString()
  const otherTokenContract = new _localWeb3.eth.Contract(ERC20TransferABI, otherTokenAddress) 

  var approvalTxDataABI = otherTokenContract.methods.approve(addressOfSmartContractSpending, MAX_APPROVAL_STRING).encodeABI()
  
  //var nonce = _localWeb3.eth.getTransactionCount(accountPayingGas) //nonce.toString(16);
    
  const txParams = {
    gasPrice: web3.utils.toHex(approvalGasPrice), //30GWEI
    gas: web3.utils.toHex(80000), //80,000 units
    to: otherTokenAddress,
    data: approvalTxDataABI,
    from: accountPayingGas,
    nonce: web3.utils.toHex(_nonce)
}  

  var tx = new Tx(txParams, {'chain':'mainnet'});
  tx.sign(PRIV_KEY);
  
  var serializedTx = tx.serialize();            
  web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))

  .once('receipt', function(receipt){
  console.log("**", _symbol,"App  Msg Receipt",  receipt.transactionHash)
  resolve(confirmationNumber)
   })
  .once('confirmation', async function(confirmationNumber, receipt){ 
  console.log("**", _symbol,"App TX Confirmed", confirmationNumber, receipt.blockNumber, receipt.transactionHash)
  })// receipt)
  .on('error', async function(error){ 
  console.log("**", _symbol,"Approve Error", error)// receipt)
  })
})}

 
//Helper Methods for maintaining a list of approved contracts in ./approvedERC20.json
function writeApprovedContracts(newApprovedObj){
  fs.writeFile('./approvedERC20.json',JSON.stringify(newApprovedObj),function(err){
      if(err) throw err;
  })
}
function writeBannedContracts(newApprovedObj){
  fs.writeFile('./bannedERC20.json',JSON.stringify(newApprovedObj),function(err){
      if(err) throw err;
  })
}

function checkApprovedContracts(tokenAddressToCheck){
  var r = approvedContracts.some(i => i.tokenAddress.includes(tokenAddressToCheck));
  return r
}

function checkBannedContracts(tokenAddressToCheck){
  var r = bannedContracts.some(i => i.tokenAddress.includes(tokenAddressToCheck));
  return r
}

function addNewApprovedContract(tokenAddress, symbol){
  approvedContracts.push({"tokenAddress":tokenAddress, "tokenSymbol":symbol})
  writeApprovedContracts(approvedContracts)
  console.log("Added to approved contracts, updated json DB", tokenAddress, symbol);
}

function addNewBannedContract(tokenAddress, symbol){
  bannedContracts.push({"tokenAddress":tokenAddress, "tokenSymbol":symbol})
  writeBannedContracts(bannedContracts)
  console.log("Added to banned contracts, updated json DB", tokenAddress, symbol);
}

function disableTrading(){
    GLOBAL_CAN_TRADE_FLAG = false
}
function enableTrading(){
    GLOBAL_CAN_TRADE_FLAG = true
}

async function getRevertReasonR(localWeb3, txHash, blockNum){
  let _txHash = txHash
  let network = 'mainnet'
  let blockNumber = blockNum
  let provider = localWeb3 // NOTE: getAlchemyProvider is not exposed in this package
  console.log("Attempting to find revert reason: ",_txHash, network, blockNumber)
  console.log(await getRevertReason(_txHash, network, blockNumber, provider)) // 'BA: Insufficient gas (ETH) for refund'
     
  }
  