Identifying and back-running dual listed high impact transactions across Uniswap/Sushiswap, with anti honeypot token avoidance and a simple web interface.

# The Idea
Trades occuring on dual listed token pools between UniSwap and SushiSwap frequently cause material price impact, leading to intra block pricing innefficiencies.
This tool, watches for pending transactions, calculates the pending impact on cross DEX pricing. Identifying if an exploitable pricing inefficency will exist, if so then it creates and executes a bundled set of transactions (buy/sell legs) via a specially constructed smart contract, immeadiately after the target transaction occurs (gas -1 wei) in the same block.

# uniSushi_Pricer.js
Subscribes to an ethereum nodes memory pool via WSS, listens for all new transactions, filters  for transactions destined for UniSwaps V2 OR SushiSwaps router contracts, filters again for ETHtoTokenSwap transactions, does a bit of maths (via a quick manifold search) to work out the impact of a pending trade, figures out the next pricing state (impact of pools) on both DEX's after execution, determines PnL, if profitable and passes risk checks (including antiscam token checking - see UniApprover), then trade and report PnL. Will stop after a single trade.

Pretrade checks include gas/deadline on original token, a forked in-memory mainnet simulation of the total sequence of trades to confirm the validity of the oppurtunity, risk checks e.g. max capital required is under a limit, min PnL generated net of fees, 

# pairDL.js
Simple program to download and precompute all pairs on Sushi and UniSwap V2, finds the intersection of the set where one token is WETH, generates a list of cross DEX dual listed pairs where arbitrage possiblities can exist and outputs to intersectionWETH.json. This script should be run periodically to capture newly listed pairs.

# uniApprover.js
After getting rekt several times, by automatically buying tokens which I couldnt sell, I implemented a scanner, which does exactly the same as above, but instead of executing, it forks the ethereum mainnet to memory and simulates the transactions, if the simulated account balance is positive (after fee's etc), then the token is added to a whitelist, this means its eligable to trade on uniRunner. Approved contracts are stored in approvedERC20.json and reread at uniRunner init. This means some latency the first time a token is ever seen (todo, run checks when reading intersectionWETH.json)

# ArbProxy.sol 
Purpose built smart contract, atomically executes cross dex uni/sushi arbitrage bundles. Whitelists deployers address as owner and only user.

# To Run 
- npm install
- Update the executionSettings.json script, enter your private nodes IP/Port, enter your account address and private key
- Confirm the risk parameters are suitable in riskParameters.json
- Update private keys and WSS endpoints in truffle-config.js
- Deploy ArbProxy.sol to mainnet via truffle in ./smartContractProxy/contracts 

Then
- node uniSushi_Pricer.js

#Next Steps / Status:
This worked in September 2020 briefly before compeitition made this type of trade much more difficult. The underpinning idea is still sound and likely still to work when peered with a multinode infrastructure for fast transaction propigation. As it stands there are 5-15 competitor bots for each oppurtunity primarily composed of MEV pools/relayers who have a structual advantage in capturing these oppurtunities.

# Example WebInterface Output
![](https://i.imgur.com/7GUFY9v.png)

