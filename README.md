
# The Idea
Buy infront of trades that are pending and arent confirmed, then unwind all in the same block. This program determines which trades are profitable to trade infront of, in what size and then execute. It also automanages delegate ERC20 approvals for transfers to the uniswap router contract.

# uniRunner
Front Running Uniswap, with anti scam token avoidance.

UniRunner - Subscribes to an ethereum nodes memory pool via WSS, listens for all new transactions, filters them for transactions destined for UniSwaps Router Contract, filters again for ETHtoTokenSwap transactions, does quite a bit of maths to work out the impact of a pending trade, figures out the optimal amount to trade infront of the ticket, determines PnL, if profitable and passes risk checks (including antiscam token checking - see UniApprover), then trade and report PnL. Will stop after a single trade.

# uniApprover
After getting rekt, by automatically buying tokens which I couldnt sell (about 1k USD!), I implemented an event scanner, which does exactly the same as above, but instead of executing, it forks the ethereum mainnet to memory and simulates the transactions, if the simulated account balance is positive (after fee's etc), then the token is added to a whitelist, this means its eligable to trade on uniRunner. Approved contracts are stored in approvedERC20.json and reread at uniRunner init.


#To Run 
- update the uniRunner Script as below
Then
- npm install
- node uniApprover1.0.0.js
- node uniRunner-v1.0.2.js

UniRunner need to add:
- Add/Update Ethereum MainNet WSS Endpoint to line 17, go to Infura if you need a public one (you will probably get rate limited)
- Line 44 & 43 add your ETH private key & Address.
- Update add risk parameters on lines 36-41

Status:
Works, have made a few small trades - currently not profitable to run due to high ETH GAS prices. Have lost more by the program automatically buying scam tokens I cant unwind - which is now addressed. Not going to make anyone rich running this.

# Example Trade
Front Running 0xBTC on 16th of November, original trade is approx $458 notionally, (TX Hash 0xcc40f753de6643cde7faa0bc469aac8226baa55994cc9ce874350e2dd6875dc2), placed by a Uniswap user with a limit allowing for 9% slippage + a 3.5% price impact on the at touch liquidity. This means if we trade 1.48x size ($677) (auto calc'd by a 500 step montecarlo/for loop) in front and unwound behind after fees we would make a PnL of ~$38.7869 assuming no competition for block space and we do not enter a gas auction off against another bot.

[Imgur](https://imgur.com/UnVnJCo)
