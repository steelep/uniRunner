# UniRunner

NodeJS tool for identifying and back-running dual-listed high impact mempool transactions across Uniswap/Sushiswap. Monitoring is via a simple web interface/frontend and chain interactions via smart contract.

![](https://i.imgur.com/7GUFY9v.png)

TLDR docs:

# The Idea
Trades occurring on dual-listed token pools between UniSwap and SushiSwap frequently cause material price impact, leading to intrablock pricing inefficiencies.
This tool, watches for pending transactions, calculates the pending impact on cross DEX pricing. Identifying if an exploitable pricing inefficiency will exist, if so then it creates and executes a bundled set of transactions (buy/sell legs) via a specially constructed smart contract, immediately after the target transaction occurs (gas -1 wei) in the same block.

# uniSushi_Pricer.js
Subscribes to an ethereum nodes memory pool via WSS, listens for all new transactions, filters for transactions destined for UniSwaps V2 OR SushiSwaps router contracts, filters again for transaction type (e.g. ETHtoTokenSwap or TokenToEthSwap), do a bit of maths (via a quick manifold search) to work out the impact of a pending trade, figures out the next pricing state (impact of pools) on both DEX's after assumed execution, calculate opportunity size, determine PnL, if the opportunity is profitable net of costs and it passes risk checks, then sends a trade via ArbProxy.sol and reports the PnL. Trading halts after a single trade - can be turned back on via web interface.

Pretrade checks include gas/deadline on the original transaction, followed by a forked in-memory mainnet simulation of the total sequence of trades to confirm the validity of the opportunity (avoid honeypots), checks e.g. max capital required is under a limit, min PnL generated net of fees. Verification simulations when run on the same hardware as the node cost around 115ms in latency.

# pairDL.js
Simple program to download and precompute all pairs on Sushi and UniSwap V2, finds the intersection of the set where one token is WETH, generates a list of cross DEX dual-listed pairs where arbitrage possibilities can exist and outputs to intersectionWETH.json. This script should be run periodically to capture newly listed pairs.

# uniApprover.js
To avoid automatically buying tokens that you cannot resell (honeypots) or becoming ensnared in malicious honeypot transaction setups (see the Salmonella attack), I implemented a transaction validator, which forks the ethereum mainnet to memory and simulates the transactions. If the simulated account balance is equal or positive, then the token is added to a whitelist or trade authorised, this means it's eligible to trade on uniSushi_Pricer. Approved contracts are stored in approvedERC20.json and reread at uniSushi_Pricer init. This means some latency the first time a token (2-3 seconds) is ever seen (todo, run checks when reading intersectionWETH.json)

# ArbProxy.sol 
Purpose-built smart contract, atomically executes cross dex uni/sushi arbitrage bundles. Whitelists deployers address as owner and only user.

# To Run 
Requires a private GETH node(s)
- npm install
- Update the executionSettings.json script, enter your private nodes IP/Port, enter your account address and private key
- Confirm the risk parameters are suitable in riskParameters.json
- Update private keys and WSS endpoints in truffle-config.js
- Deploy ArbProxy.sol to mainnet via truffle in ./smartContractProxy/contracts 

Then
- node uniSushi_Pricer.js

# Next Steps / Status:
This worked in September 2020 briefly before competition made this type of trade much more difficult. The underpinning idea is still sound and likely still to work when peered with a multinode infrastructure for fast transaction propagation. As it stands there are ~2-15 competitor bots for each opportunity primarily composed of MEV pools/relayers who have a structural advantage in capturing these opportunities rendering the current setup uncompetitive.


