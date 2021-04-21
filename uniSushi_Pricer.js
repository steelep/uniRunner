//UniRunner V1.0

//Watches the mem pool of the private node specified in executionSettings.json
//Looks for trading oppurtunities by backrunning pending transactions between dual listed WETH/TOKEN pairs on Uniswap <-> Sushiswap
//Calculates optimal trade parameters across both exchanges
//Runs potential transactions through compliance checks
//Executes through a private smart contract that bundles TX's atomically
//Basic web front end/control panel on local port 3000

//Copyright 2020 Patrick Steele

var InputDataDecoder = require( "ethereum-input-data-decoder");
var Web3 = require(  "web3");
var pkg = require(  '@uniswap/sdk');
var fs = require('fs');
let intersectionWETHDB = require('./intersectionWETH.json');
let riskParametersCompliance = require('./riskParameters.json');
let executionSettings = require('./executionSettings.json');
executionSettings.pvtKey = Buffer.from(executionSettings.pvtKey, 'hex')
var Tx = require('ethereumjs-tx').Transaction

const express = require("express");
const path = require("path");
const port = process.env.PORT || "3000";
var ganacheCLI = require(  'ganache-cli');
var tradingEnabled = false
var subscribedStatus = false

const { ChainId, JSBI, BigintIsh, Fetcher, WETH, Route, Token, Pair, Price, Trade, Fractions, TokenAmount, TradeType, Percent } = pkg;

var web3 = new Web3(executionSettings.productionServer); // same output as with option below
var BN = web3.utils.BN
var hashesSeen = {};
var oppFrame = [];
var complianceFrame = [];
var firstRun = true
//Setup Tokens we can trade to search in linear time
const token0List = []
const token1List = []

const UniSwapV2PairABI =[{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Burn","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1","type":"uint256"}],"name":"Mint","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount0In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1In","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount0Out","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount1Out","type":"uint256"},{"indexed":true,"internalType":"address","name":"to","type":"address"}],"name":"Swap","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint112","name":"reserve0","type":"uint112"},{"indexed":false,"internalType":"uint112","name":"reserve1","type":"uint112"}],"name":"Sync","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"MINIMUM_LIQUIDITY","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"burn","outputs":[{"internalType":"uint256","name":"amount0","type":"uint256"},{"internalType":"uint256","name":"amount1","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getReserves","outputs":[{"internalType":"uint112","name":"_reserve0","type":"uint112"},{"internalType":"uint112","name":"_reserve1","type":"uint112"},{"internalType":"uint32","name":"_blockTimestampLast","type":"uint32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"_token0","type":"address"},{"internalType":"address","name":"_token1","type":"address"}],"name":"initialize","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"kLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"mint","outputs":[{"internalType":"uint256","name":"liquidity","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"price0CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price1CumulativeLast","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"}],"name":"skim","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"uint256","name":"amount0Out","type":"uint256"},{"internalType":"uint256","name":"amount1Out","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"bytes","name":"data","type":"bytes"}],"name":"swap","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"sync","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"token0","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"token1","outputs":[{"internalType":"address","name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"}]
const decoder = new InputDataDecoder([{"inputs":[{"internalType":"address","name":"_factory","type":"address"},{"internalType":"address","name":"_WETH","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"name":"WETH","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"amountTokenDesired","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETH","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidityETHSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermit","outputs":[{"internalType":"uint256","name":"amountToken","type":"uint256"},{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"token","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountTokenMin","type":"uint256"},{"internalType":"uint256","name":"amountETHMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityETHWithPermitSupportingFeeOnTransferTokens","outputs":[{"internalType":"uint256","name":"amountETH","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapETHForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactETHForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForETHSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactETH","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]);
const ArbProxyABI = [ { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [], "name": "sushiswapRouter", "outputs": [ { "internalType": "contract IUniswapV2Router02", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [], "name": "uniswapRouter", "outputs": [ { "internalType": "contract IUniswapV2Router02", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function", "constant": true }, { "stateMutability": "payable", "type": "receive", "payable": true }, { "inputs": [ { "internalType": "uint256", "name": "_tokenAmountToBuy", "type": "uint256" }, { "internalType": "address", "name": "_tokenAddress", "type": "address" }, { "internalType": "address[]", "name": "_pathIn", "type": "address[]" }, { "internalType": "address[]", "name": "_pathOut", "type": "address[]" }, { "internalType": "uint256", "name": "_deadline", "type": "uint256" }, { "internalType": "bool", "name": "_enforcePositiveEV", "type": "bool" } ], "name": "convertEthToTokenAndBackUni2Sushi", "outputs": [], "stateMutability": "payable", "type": "function", "payable": true }, { "inputs": [ { "internalType": "uint256", "name": "_tokenAmountToBuy", "type": "uint256" }, { "internalType": "address", "name": "_tokenAddress", "type": "address" }, { "internalType": "address[]", "name": "_pathIn", "type": "address[]" }, { "internalType": "address[]", "name": "_pathOut", "type": "address[]" }, { "internalType": "uint256", "name": "_deadline", "type": "uint256" }, { "internalType": "bool", "name": "_enforcePositiveEV", "type": "bool" } ], "name": "convertEthToTokenAndBackSushi2Uni", "outputs": [], "stateMutability": "payable", "type": "function", "payable": true }, { "inputs": [ { "internalType": "uint256", "name": "_tokenAmount", "type": "uint256" }, { "internalType": "address[]", "name": "_pathOut", "type": "address[]" } ], "name": "getEstimatedETHForTokenAtUNI", "outputs": [ { "internalType": "uint256[]", "name": "", "type": "uint256[]" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [ { "internalType": "uint256", "name": "_tokenAmount", "type": "uint256" }, { "internalType": "address[]", "name": "_pathOut", "type": "address[]" } ], "name": "getEstimatedETHForTokenAtSUSHI", "outputs": [ { "internalType": "uint256[]", "name": "", "type": "uint256[]" } ], "stateMutability": "view", "type": "function", "constant": true }, { "inputs": [ { "internalType": "address", "name": "_tokenAddress", "type": "address" } ], "name": "withdrawBalanceToken", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "withdrawBalanceETH", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address payable", "name": "_newOwner", "type": "address" } ], "name": "changeOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" } ]
const UNISWAP_ROUTERV2_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const SUSHISWAP_ROUTERV2_ADDRESS ="0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
const WETH_ERC20_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
var arbProxyContract = new web3.eth.Contract(ArbProxyABI, executionSettings.deployedContract)     //need to add
const tradeSize = [0.001, 0.005, 0.01,0.0125, 0.015,0.02,0.025,0.03,0.035,0.04,0.045,0.05,0.06,0.07,0.08,0.09,0.1,0.11,0.12,0.13,0.14,0.15,0.16,0.17,0.18,0.19,0.2,0.21,0.22,0.23,0.24,0.25,0.26,0.27,0.28,0.29,0.3,0.31,0.32,0.33,0.34,0.35,0.36,0.37,0.38,0.39,0.4,0.41,0.42,0.43,0.5,0.55,0.6,0.65,0.7,0.75,0.8,0.85,0.9,0.95,1,1.05,1.1,1.15,1.2,1.25,1.3,1.35,1.4,1.45,1.5,1.55,1.6,1.65,1.7,1.75,1.8,1.85,1.9,1.95,2,2.05,2.1,2.15,2.2,2.25,2.3,2.35,2.4,2.45,2.5,2.55,2.6,2.65,2.7,2.75,2.8,2.85,2.9,2.95,3,3.05,3.1,3.15,3.2,3.25,3.3,3.35,3.4,3.45,3.5,3.55,3.6,3.65,3.7,3.75,3.8,3.85,3.9,3.95,4,4.05,4.1,4.15,4.2,4.25,4.3,4.35,4.4,4.45,4.5,4.55,4.6,4.65,4.7,4.75,4.8,4.85,4.9,4.95,5,5.05,5.1,5.15,5.2,5.25,5.3,5.35,5.4,5.45,5.5,5.55,5.6,5.65,5.7,5.75,5.8,5.85,5.9,5.95,6,6.05,6.1,6.15,6.2,6.25,6.3,6.35,6.4,6.45,6.5,6.55,6.6,6.65,6.7,6.75,6.8,6.85,6.9,6.95,7,7.05,7.1,7.15,7.2,7.25,7.3,7.35,7.4,7.45,7.5,7.55,7.6,7.65,7.7,7.75,7.8,7.85,7.9,7.95,8,8.05,8.1,8.15,8.2,8.25,8.3,8.35,8.4,8.45,8.5,8.55,8.6,8.65,8.7,8.75,8.8,8.85,8.9,8.95,9,9.05,9.1,9.15,9.2,9.25,9.3,9.35,9.4,9.45,9.5,9.55,9.6,9.65,9.7,9.75,9.8,9.85,9.9,9.95,10,10.2,10.4,10.6,10.8,11,11.2,11.4,11.6,11.8,12,12.2,12.4,12.6,12.8,13,13.2,13.4,13.6,13.8,14,14.2,14.4,14.6,14.8,15,15.2,15.4,15.6,15.8,16,16.2,16.4,16.6,16.8,17,17.2,17.4,17.6,17.8,18,18.2,18.4,18.6,18.8,19,19.2,19.4,19.6,19.8,20,20.5,21,21.5,22,22.5,23,23.5,24,24.5,25,25.5,26,26.5,27,27.5,28,28.5,29,29.5,30,30.5,31,31.5,32,32.5,33,33.5,34,34.5,35,35.5,36,36.5,37,37.5,38,38.5,39,39.5,40,40.5,41,41.5,42,42.5,43,43.5,44,44.5,45,45.5,46,46.5,47,47.5,48,48.5,49,49.5,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,134,136,138,140,142,144,146,148,150,152,154,156,158,160,162,164,166,168,170,172,174,176,178,180,182,184,186,188,190,192,194,196,198,200,210,220,230,240,250,260,270,280,290,300,310,320,330,340,350,360,370,380,390,400,410,420,430,440,450,460,470,480,490,500,520,540,560,580,600,620,640,660,680,700,720,740,760,780,800,820,840,860,880,900,920,940,960,980,1000,1020,1040,1060,1080,1100,1120,1140,1160,1180,1200,1220,1240,1260,1280,1300,1320,1340,1360,1380,1400,1420,1440,1460,1480,1500,1520,1540,1560,1580,1600,1620,1640,1660,1680,1700,1720,1740,1760,1780,1800,1820,1840,1860,1880,1900,1920,1940,1960,1980,2000,2050,2100,2150,2200,2250,2300,2350,2400,2450,2500,2550,2600,2650,2700,2750,2800,2850,2900,2950,3000,3100]

//Builds quick reference of whether token is allowed, incorp into boot routine method
for (let i = 0; i < intersectionWETHDB.length; i++) {
    token0List.push(intersectionWETHDB[i].sushi.pairToken0)
    token1List.push(intersectionWETHDB[i].sushi.pairToken1)
}

async function buildArbRoute(_i, _txInputsDecoded, _txInfo){
    return new Promise(async (resolve, reject) => {  
        var timeSeen = new Date() 
        timeSeen = timeSeen.toLocaleTimeString('it-IT') + `.${timeSeen.getMilliseconds()}`; //en-US glitches for some reason

        var tokenA, tokenB, flipped
        var sushiswapPairAddress, uniswapPairAddress, pairReservesA_uni, pairReservesB_uni, pairReservesA_sushi, pairReservesB_sushi
    
        uniswapPairAddress = intersectionWETHDB[_i].uni.pairAddress
        sushiswapPairAddress = intersectionWETHDB[_i].sushi.pairAddress
        const uniswapTokenPairContract = new web3.eth.Contract(UniSwapV2PairABI, intersectionWETHDB[_i].uni.pairAddress)           
        const sushiswapTokenPairContract = new web3.eth.Contract(UniSwapV2PairABI, intersectionWETHDB[_i].sushi.pairAddress)

        var tempReservesUni = await uniswapTokenPairContract.methods.getReserves().call()
        var tempReservesSushi = await sushiswapTokenPairContract.methods.getReserves().call()

        if(intersectionWETHDB[_i].sushi.symbol0 =="WETH"){
            flipped = false
            
            tokenA = new Token( ChainId.MAINNET, intersectionWETHDB[_i].sushi.pairToken0, parseInt(intersectionWETHDB[_i].sushi.decimals0), intersectionWETHDB[_i].sushi.symbol0)
            tokenB = new Token( ChainId.MAINNET, intersectionWETHDB[_i].sushi.pairToken1, parseInt(intersectionWETHDB[_i].sushi.decimals1), intersectionWETHDB[_i].sushi.symbol1)
            pairReservesA_uni =  new TokenAmount(tokenA, new BN(tempReservesUni[0])); //in
            pairReservesB_uni =  new TokenAmount(tokenB, new BN(tempReservesUni[1])); //out
            pairReservesA_sushi =  new TokenAmount(tokenA, new BN(tempReservesSushi[0])); //in
            pairReservesB_sushi =  new TokenAmount(tokenB, new BN(tempReservesSushi[1])); //out

        }else{
            flipped = true
            
            tokenB = new Token( ChainId.MAINNET, intersectionWETHDB[_i].sushi.pairToken0, parseInt(intersectionWETHDB[_i].sushi.decimals0), intersectionWETHDB[_i].sushi.symbol0)
            tokenA = new Token( ChainId.MAINNET, intersectionWETHDB[_i].sushi.pairToken1, parseInt(intersectionWETHDB[_i].sushi.decimals1), intersectionWETHDB[_i].sushi.symbol1)
            pairReservesA_uni =  new TokenAmount(tokenA, new BN(tempReservesUni[1])); //in
            pairReservesB_uni =  new TokenAmount(tokenB, new BN(tempReservesUni[0])); //out
            pairReservesA_sushi =  new TokenAmount(tokenA, new BN(tempReservesSushi[1])); //in
            pairReservesB_sushi =  new TokenAmount(tokenB, new BN(tempReservesSushi[0])); //out
        }

        var pairUniSwapOrig = new Pair(pairReservesA_uni, pairReservesB_uni); //Reserves Snapshotted as of last block.
        var pairSushiSwapOrig = new Pair(pairReservesA_sushi, pairReservesB_sushi); //Reserves Snapshotted as of last block.
        var routeUniOrig = new Route([pairUniSwapOrig], tokenA)
        var routeSushiOrig = new Route([pairSushiSwapOrig], tokenA)
 
        let pairUniSwapAdj, pairSushiSwapAdj, targetLabel;
        [pairUniSwapAdj, pairSushiSwapAdj, targetLabel] = calcPostTradePairs(pairUniSwapOrig, pairSushiSwapOrig, _txInfo, _txInputsDecoded, tokenA, tokenB)
        var routeUniAdj= new Route([pairUniSwapAdj], tokenA)
        var routeSushiAdj = new Route([pairSushiSwapAdj], tokenA)


        //possible issue on decimals
        var unisushiPairOrig = ( pairUniSwapOrig.reserveOf(tokenA).toFixed() / pairUniSwapOrig.reserveOf(tokenB).toFixed()) / ( pairSushiSwapOrig.reserveOf(tokenA).toFixed() / pairSushiSwapOrig.reserveOf(tokenB).toFixed()) //Price % of Each Other Less than 1, Uniswap is cheap, Greater than 1 Sushi swap token is cheap
        var unisushiPairAfter = ( pairUniSwapAdj.reserveOf(tokenA).toFixed() / pairUniSwapAdj.reserveOf(tokenB).toFixed()) / ( pairSushiSwapAdj.reserveOf(tokenA).toFixed() / pairSushiSwapAdj.reserveOf(tokenB).toFixed())

        const tradeDetails = {
                "sushiswapPairAddress":sushiswapPairAddress, 
                "uniswapPairAddress":uniswapPairAddress,
                "tradeTime": timeSeen,
                "pairUniSwapOrig":pairUniSwapOrig,
                "pairSushiSwapOrig":pairSushiSwapOrig,
                "routeUniOrig":routeUniOrig,
                "routeSushiOrig":routeSushiOrig,
                "pairUniSwapAdj":pairUniSwapAdj,
                "pairSushiSwapAdj":pairSushiSwapAdj,
                "targetLabel":targetLabel,
                "unisushiPairOrig":unisushiPairOrig,
                "unisushiPairAfter":unisushiPairAfter,
                "routeUniAdj":routeUniAdj,
                "routeSushiAdj":routeSushiAdj,
                "tokenA":tokenA,
                "tokenB":tokenB,
                "tradeDetails":  calcOptimalSize(tokenA, tokenB, pairUniSwapAdj, pairSushiSwapAdj, unisushiPairAfter, _txInfo),
                "flipped":flipped,
                "txInputsDecoded":_txInputsDecoded, 
                "txInfo": _txInfo
        } 
        resolve(tradeDetails)
    })
}


function calcPostTradePairs(_pairUniSwapOrig, _pairSushiSwapOrig, _txInfo, _txInputsDecoded, _tokenA, _tokenB){
    var targetLabel, pairUniSwapAfter, pairSushiSwapAfter
    var txValueInETH = new TokenAmount(_tokenA, Math.round(_txInfo.value))
    var txTokensExactIn = new TokenAmount(_tokenB, (String(new BN(_txInputsDecoded.inputs[0]))))
    var txEthExactOut = new TokenAmount(_tokenA, (String(new BN(_txInputsDecoded.inputs[0]))))

    var pairUniSwapAfter  = _pairUniSwapOrig
    var pairSushiSwapAfter = _pairSushiSwapOrig
    
    if(_txInfo.to == SUSHISWAP_ROUTERV2_ADDRESS){
        target = SUSHISWAP_ROUTERV2_ADDRESS
        targetLabel = "sushiswap"
    }
    if(_txInfo.to == UNISWAP_ROUTERV2_ADDRESS){
         target = UNISWAP_ROUTERV2_ADDRESS
         targetLabel = "uniswap"
    }
    if(_txInputsDecoded.method == 'swapExactETHForTokens'){
        if(_txInfo.to == UNISWAP_ROUTERV2_ADDRESS){
            pairUniSwapAfter = _pairUniSwapOrig.getOutputAmount(txValueInETH)[1]
        }
        if(_txInfo.to == SUSHISWAP_ROUTERV2_ADDRESS){
            pairSushiSwapAfter = _pairSushiSwapOrig.getOutputAmount(txValueInETH)[1]
        }
    }
    if(_txInputsDecoded.method == 'swapETHForExactTokens'){
        if(_txInfo.to == UNISWAP_ROUTERV2_ADDRESS){
            pairUniSwapAfter = _pairUniSwapOrig.getInputAmount(txTokensExactIn)[1]
        }
        if(_txInfo.to == SUSHISWAP_ROUTERV2_ADDRESS){
            pairSushiSwapAfter = _pairSushiSwapOrig.getInputAmount(txTokensExactIn)[1]
        }
    
    if(_txInputsDecoded.method == 'swapExactTokensForETH'){
            if(_txInfo.to == UNISWAP_ROUTERV2_ADDRESS){
                pairUniSwapAfter = _pairUniSwapOrig.getOutputAmount(txTokensExactIn)[1]
            }
            if(_txInfo.to == SUSHISWAP_ROUTERV2_ADDRESS){
                pairSushiSwapAfter = _pairSushiSwapOrig.getOutputAmount(txTokensExactIn)[1]
            }
        }

    if(_txInputsDecoded.method == 'swapTokensForExactETH'){
            if(_txInfo.to == UNISWAP_ROUTERV2_ADDRESS){
                pairUniSwapAfter = _pairUniSwapOrig.getInputAmount(txEthExactOut)[1]
            }
            if(_txInfo.to == SUSHISWAP_ROUTERV2_ADDRESS){
                pairSushiSwapAfter = _pairSushiSwapOrig.getInputAmount(txEthExactOut)[1]
            }
        }
    }
    return [pairUniSwapAfter, pairSushiSwapAfter, targetLabel]

}

function calcOptimalSize(_tokenA, _tokenB, _pairUniSwapAdj, _pairSushiSwapAdj, _unisushiPairAfter, _txInfo){
    var maxPnLSeen = -1000
    var simPnL = - 1000
    var lastRunVariables = {}
    var gasCost = (executionSettings.gasCostUnitsForPricing * _txInfo.gasPrice) / 10e17 //Assumes we execute with the same gas as the original sender

    if(_unisushiPairAfter < 1){

        //todo max size depends on max risk
        for (let i = 1; i < tradeSize.length; i++) { //Simulate 500 different inputs from 1% to 5x of original trade notional, return max PnL amount seen. Returns optimal trade size. Assumes no other front runs or pending exec in block
            if(tradeSize[i] > riskParametersCompliance.maxRiskPassETH){
                break; //do not run simulations above max risk size!
            }
            
            var myETHInput = new TokenAmount(_tokenA, Math.round(tradeSize[i]*10e17)) 
            var outputAmountOfTokenMyBuy = _pairUniSwapAdj.getOutputAmount(new TokenAmount(_tokenA, String(myETHInput.raw)))
            var outputAmountOfETHatClosing= _pairSushiSwapAdj.getOutputAmount(new TokenAmount(_tokenB, String(outputAmountOfTokenMyBuy[0].raw)))
            simPnL = outputAmountOfETHatClosing[0].toExact() - myETHInput.toExact() - gasCost
            

            if((parseFloat(maxPnLSeen) < parseFloat(simPnL))){
                lastRunVariables = {
                    'tradeSize' : myETHInput,
                    'outputAmountOfTokenMyBuy' : (outputAmountOfTokenMyBuy),
                    'outputAmountOfETHatClosing' : outputAmountOfETHatClosing, 
                    'simPnLEth' : simPnL,
                    'simPnLUSD' : simPnL * executionSettings.ethValUSD,
                    'tokenDirection' : "buy@uni -> sell@sushi",
                    'ethDirection' : "sell@uni - buy@sushi",
                    "gasCostUSD" : gasCost *  executionSettings.ethValUSD
                    }
                    maxPnLSeen = simPnL
                }else{
                    break
            }
        }   
    }else{
        //Sushiswap cheap to buy tokens
        for (let i = 1; i < tradeSize.length; i++) { //Simulate 500 different inputs from 1% to 5x of original trade notional, return max PnL amount seen. Returns optimal trade size. Assumes no other front runs or pending exec in block
            if(tradeSize[i] > riskParametersCompliance.maxRiskPassETH){
                break; //do not run simulations above max risk size!
            }
            
            var myETHInput = new TokenAmount(_tokenA, Math.round(tradeSize[i]*10e17)) 
            var outputAmountOfTokenMyBuy = _pairSushiSwapAdj.getOutputAmount(new TokenAmount(_tokenA, String(myETHInput.raw)))

            var outputAmountOfETHatClosing= _pairUniSwapAdj.getOutputAmount(new TokenAmount(_tokenB, String(outputAmountOfTokenMyBuy[0].raw)))
            simPnL = outputAmountOfETHatClosing[0].toExact() - myETHInput.toExact() - gasCost

            if((parseFloat(maxPnLSeen) < parseFloat(simPnL))){
                lastRunVariables = {
                    'tradeSize' : myETHInput,
                    'outputAmountOfTokenMyBuy' : (outputAmountOfTokenMyBuy),
                    'outputAmountOfETHatClosing' : outputAmountOfETHatClosing, 
                    'simPnLEth' : simPnL,
                    'simPnLUSD' : simPnL * executionSettings.ethValUSD,
                    'tokenDirection' : "buy@Sushi -> sell@Uni",
                    'ethDirection' : "sell@sushi -> buy@Uni",
                    "gasCostUSD" : gasCost *  executionSettings.ethValUSD
                }
                maxPnLSeen = simPnL
            }else{
                break
            }
        }          
    }
    return(lastRunVariables)
 }    

async function openSubscriber(){
    var subscription = web3.eth.subscribe("pendingTransactions").on("data", async function (transactionHash) {
     //Check if this is a dupe
     if (!hashesSeen.hasOwnProperty(transactionHash)) {
       hashesSeen[transactionHash] = true;

       var transaction = await web3.eth.getTransaction(transactionHash);
       if (transaction == null) {
         setTimeout(async function () {
           transaction = await web3.eth.getTransaction(transactionHash);
         }, 100);
       }

       try {
            if (transaction.to == UNISWAP_ROUTERV2_ADDRESS || transaction.to == SUSHISWAP_ROUTERV2_ADDRESS) { //Uniswap Router V02 Address
            
            //Confirm if pairs are in our list of approved dual listed
            
            var decodedInput = decoder.decodeData(transaction.input);
            if(decodedInput.method == 'swapExactETHForTokens' || 'swapETHForExactTokens' || 'swapExactTokensForETH' || 'swapTokensForExactETH'){
                var pairInfoIndex = pairExistsInWhiteList(web3.utils.toChecksumAddress(decodedInput.inputs[1][1]))
                if(pairInfoIndex > -1){

                    var benchMarkTimeStamp = new Date() 

                    if (decodedInput.inputs[1].length > 2 || !firstRun){ //2 hop trades only
                    return
                    }
                    
                    var arbCalculate = await buildArbRoute(pairInfoIndex, decodedInput, transaction)
                    
                    //Verification via Simulation
                    try{
                        //console.log(pairInfoIndex)
                        var simulationResults = await simulateParentTX(transaction)
                    }catch (error){}

                    //Verification via Inspection
                    var internalComplianceResults = runInternalPreTradeRiskChecks(arbCalculate);

                    //Write trade details to 
                    oppFrame.push({txDetails: arbCalculate, complianceDetials: ""})
                    
                    const index = oppFrame.findIndex(item => item.txDetails.txInfo.hash === transactionHash);
                    oppFrame[index].complianceDetails = {"externalCompliance": simulationResults, "internalCompliance": internalComplianceResults}
                    console.log(transaction.hash, simulationResults.status, (simulationResults.date - benchMarkTimeStamp)/1000, internalComplianceResults.internalPreTradePass)


                    //add to globalOppTradeFrame

                    //execution logic goes here

                    if(tradingEnabled && internalComplianceResults.internalPreTradePass && simulationResults.result){
                        tradingEnabled = false //Halt all trading - one shot
                        console.log("Arbitrage Transaction Occuring")
                        console.log("Parent TX:", transactionHash)
                        
                        //Get & organise trading parameters to send in TX
                        var tokenToBuyAddress = arbCalculate.tokenB.address //Ropsten UNI
                        var tokenAmountToBuy = String(arbCalculate.tradeDetails.outputAmountOfTokenMyBuy[0].raw)                  
                        var pathIn = [WETH_ERC20_ADDRESS, tokenToBuyAddress]
                        var pathOut = [tokenToBuyAddress, WETH_ERC20_ADDRESS]
                        var deadline = (Math.floor(Date.now() / 1000) + 150)
                        var enforceNPV = executionSettings.enforceNPV
                        var valueToSend = web3.utils.toHex(String(arbCalculate.tradeDetails.tradeSize.raw))
                        var gasCostUnitsForSC = web3.utils.toHex(executionSettings.gasCostUnitsForSC)
                        var gasPriceGWEI = web3.utils.toHex(parseInt(transaction.gasPrice)) // - 1)
                        var deployedContract = executionSettings.deployedContract
                        var accSender = executionSettings.accSender
                        var nonce = web3.utils.toHex(await web3.eth.getTransactionCount(executionSettings.accSender,"pending"))

                        try{

                            if(arbCalculate.unisushiPairAfter < 1){ //WETH buy@Sushi -> sell@Uni
                                console.log("********** EXEC *****************")
                                console.log("ARBITRAGE LIVE", arbCalculate.tokenA.symbol, arbCalculate.tokenB.symbol, arbCalculate.tokenA.decimals, arbCalculate.tokenB.decimals)
                                console.log("I SELL ETH @ UNI", String(arbCalculate.tradeDetails.tradeSize.raw), "i BUY TOKEN", String(arbCalculate.tradeDetails.outputAmountOfTokenMyBuy[0].raw) )
                                arbProxyConvertEthToTokenAndBackUni2Sushi(tokenAmountToBuy, tokenToBuyAddress, pathIn, pathOut, deadline, enforceNPV, gasCostUnitsForSC, gasPriceGWEI, deployedContract, valueToSend, accSender, nonce)
                            }
                            if(arbCalculate.unisushiPairAfter > 1){
                                console.log("********** EXEC *****************")
                                console.log("ARBITRAGE LIVE", arbCalculate.tokenA.symbol, arbCalculate.tokenB.symbol, arbCalculate.tokenA.decimals, arbCalculate.tokenB.decimals)
                                console.log("I SELL ETH @ SUSHI", String(arbCalculate.tradeDetails.tradeSize.raw), "i BUY TOKEN", String(arbCalculate.tradeDetails.outputAmountOfTokenMyBuy[0].raw) )

                                arbProxyConvertEthToTokenAndBackSushi2Uni(tokenAmountToBuy, tokenToBuyAddress, pathIn, pathOut, deadline, enforceNPV, gasCostUnitsForSC, gasPriceGWEI, deployedContract, valueToSend, accSender, nonce)
                            }
                        }catch(error)
                            {console.log("********** EXEC error", error)}
                    
                            
                    }else{
                        /*console.log("no arb", tradingEnabled, internalComplianceResults.internalPreTradePass, simulationResults.result)
                        console.log(arbCalculate.tokenA.symbol, arbCalculate.tokenB.symbol, arbCalculate.tokenA.decimals, arbCalculate.tokenB.decimals)
                        console.log("Uni midpx: orig", String(arbCalculate.routeUniOrig.midPrice.toFixed()), " adj ", String(arbCalculate.routeUniAdj.midPrice.toFixed()))
                        console.log("Sushi midpx: orig", String(arbCalculate.routeSushiOrig.midPrice.toFixed()), " adj ", String(arbCalculate.routeSushiAdj.midPrice.toFixed()))
                        console.log("unisushiPairOrig", arbCalculate.unisushiPairOrig, "unisushiPairAfter",  arbCalculate.unisushiPairAfter)
                        console.log("I sell eth", String(arbCalculate.tradeDetails.tradeSize.raw), "I buy token", String(arbCalculate.tradeDetails.outputAmountOfTokenMyBuy[0].raw)  , "on exchange if above under 1, leg 1 = uni, if over 1 = sushi")
                        console.log("end")*/
                    }
                
                }}}
            }catch (err){}// (console.log("EarbCalculateRRROR Ignoring", transactionHash, transaction))}
            
        }
    });
}

async function arbProxyConvertEthToTokenAndBackUni2Sushi(_tokenAmountToBuy, _tokenToBuyAddress, _pathIn, _pathOut, _deadline, _enforceNPV, _gasCostUnitsForSC, _gasPriceGWEI, _deployedContract, _valueToSend, _accSender, _nonce){

    var payload = arbProxyContract.methods.convertEthToTokenAndBackUni2Sushi(
        _tokenAmountToBuy,
        _tokenToBuyAddress, 
        _pathIn,
        _pathOut,
        _deadline,
        _enforceNPV

    ).encodeABI()

    var txParams = {
        gas : _gasCostUnitsForSC,
        gasPrice : _gasPriceGWEI,
        to: _deployedContract,
        data : payload,
        value : _valueToSend,
        from: _accSender,
        nonce: _nonce
    }
    var tx = new Tx(txParams, {'chain':'mainnet'});
    tx.sign(executionSettings.pvtKey);
    
    var serializedTx = tx.serialize();            
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('transactionHash', function(hash){
        console.log("TX HASH:", hash)
    })
    .on('receipt', function(receipt){
        console.log("TX Receipt:", receipt)
    })
    .on('confirmation', function(confirmationNumber, receipt){
        console.log("TX Confirmed: ", confirmationNumber)
    })
    .on('error', console.error);
}

async function arbProxyConvertEthToTokenAndBackSushi2Uni(_tokenAmountToBuy, _tokenToBuyAddress, _pathIn, _pathOut, _deadline, _enforceNPV, _gasCostUnitsForSC, _gasPriceGWEI, _deployedContract, _valueToSend, _accSender, _nonce){

    var payload = arbProxyContract.methods.convertEthToTokenAndBackSushi2Uni(
        _tokenAmountToBuy,
        _tokenToBuyAddress, 
        _pathIn,
        _pathOut,
        _deadline,
        _enforceNPV

    ).encodeABI()

    var txParams = {
        gas : _gasCostUnitsForSC,
        gasPrice : _gasPriceGWEI,
        to: _deployedContract,
        data : payload,
        value : _valueToSend,
        from: _accSender,
        nonce: _nonce
    }
    var tx = new Tx(txParams, {'chain':'mainnet'});
    tx.sign(executionSettings.pvtKey);
    
    var serializedTx = tx.serialize();            
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
    .on('transactionHash', function(hash){
        console.log("TX HASH:", hash)
    })
    .on('receipt', function(receipt){
        console.log("TX Receipt:", receipt)
    })
    .on('confirmation', function(confirmationNumber, receipt){
        console.log("TX Confirmed: ", confirmationNumber)
    })
    .on('error', console.error);
}

function runInternalPreTradeRiskChecks(_tradeDetails) {
    //Risk parameters stored in .json file  

    var minProfitPass = false
    var gasPass = false
    var maxRiskPass = false
    var deadLinePass = false
    var internalPreTradePass = false

    //Check Profit Minimum
    if(riskParametersCompliance.minProfitUSD <= _tradeDetails.tradeDetails.simPnLUSD){
        minProfitPass = true
    }

    //Check Gas Max TODO: Dynamic range 
    if((riskParametersCompliance.maxGasGWEI >= _tradeDetails.txInfo.gasPrice/10e8) && (riskParametersCompliance.minGasGWEI <= _tradeDetails.txInfo.gasPrice/10e8)){
        gasPass = true
    }

    //Check ETH Required
    if(riskParametersCompliance.maxRiskPassETH >= _tradeDetails.tradeDetails.tradeSize.raw/10e17){
        maxRiskPass = true
    }

    //Check Deadline
    var secondsRemainingUntilDeadline = parseInt(_tradeDetails.txInputsDecoded.inputs[3]) - Math.floor(Date.now() / 1000)
    if(secondsRemainingUntilDeadline > riskParametersCompliance.minTimeLeftDeadlineSeconds && secondsRemainingUntilDeadline < riskParametersCompliance.maxTimeLeftDeadlineSeconds){
        deadLinePass = true
    }

    //Set a summary varible
    if(minProfitPass && gasPass && maxRiskPass && deadLinePass){
        internalPreTradePass = true
    }
    //Return pretrade check result
    return ({"internalPreTradePass": internalPreTradePass, "minProfitPass": minProfitPass, "gasPass": gasPass, "maxRiskPass":maxRiskPass, "deadLinePass":deadLinePass, "internalPreTradePass":internalPreTradePass})
}

//Picks a TX off the - Simulation Compliance
function simulateParentTX(_transaction){
    try{

    return new Promise(function  (resolve, reject){  
        var localWeb3 = new Web3(ganacheCLI.provider({fork: executionSettings.productionServer, port:7535, unlocked_accounts: [_transaction.from]}), null, {transactionConfirmationBlocks: 1})
        
            var sentTx = localWeb3.eth.sendTransaction(_transaction)
            .once('confirmation',  function(confirmationNumber, receipt){
                //console.log("Confirm: ", _transaction.hash, confirmationNumber)
                resolve({status: "passedSim", date: new Date(), result: true});
            })
            .on('error', function(error){ 
                //console.log("Error2 **", _transaction.hash)
                resolve({status:"failedSim",  date: new Date(), message: error.message, result: false})
            })
            .then( async(makis) => {
                
                localWeb3.currentProvider.send({
                method: "evm_mine",
                params: [],
                jsonrpc: "2.0",
                id: 0, } , ()=>{} )
            
                localWeb3.currentProvider.send({
                method: "evm_mine",
                params: [],
                jsonrpc: "2.0",
                id: 0, } , ()=>{} )
                })
            .catch(function () {}) 
        })
    }catch(error){console.log(error)}
}

function pairExistsInWhiteList(_token0){
    if(token0List.indexOf(_token0) > -1){
        return token0List.indexOf(_token0)
    }
    if(token1List.indexOf(_token0) > -1){
        return token0List.indexOf(_token0)
    }else{
        return -1
    }
}

var app = express();

app.set("view engine","pug")
app.use(express.static(path.join(__dirname, 'views')));

app.get("/subscribe", async(req, res) => {
    
    if(!subscribedStatus){
        subscribedStatus = true
        openSubscriber()
    }else{
        //web3.eth.clearSubscriptions()
        //subscribedStatus = false
    }
})

app.get("/toggleTrading", async(req, res) => {
    if(!tradingEnabled){
        tradingEnabled = true
    }else{
        tradingEnabled = false
    }
})

app.get("/dumpDataToDisk", async(req, res) => {
    dumpOppFrameToDisk()
    
})

app.get("/", async(req, res) => {
    if(!subscribedStatus){
        subscribedStatus = true
        openSubscriber()
    }
    
    var currentBlock = await web3.eth.getBlockNumber()
    res.render('tokenList',{
        oppList: oppFrame, 
        complianceList: complianceFrame, 
        blockNumber: currentBlock, 
        ethVal: executionSettings.ethValUSD,
        tradingStatus: tradingEnabled,
        subscribedStatus: subscribedStatus}
        );
})
    
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});

setInterval(function(){    
}, 1000);

function dumpOppFrameToDisk(){
    fs.writeFile('./oppFrame.json',JSON.stringify(oppFrame),function(err){
        if(err) throw err;
    })
}
