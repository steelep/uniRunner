
# idea
Buy infront of trades that are pending and arent confirmed, then unwind all in the same block. This program determines which trades are profitable to trade infront of, in what size and then can execute.

# uniRunner
Front Running Uniswap, with anti scam token avoidance.

UniRunner - Subscribes to an ethereum nodes memory pool via WSS, listens for all new transactions, filters them for transactions destined for UniSwaps Router Contract, filters again for ETHtoTokenSwap transactions, does quite a bit of maths to work out the impact of a pending trade, figures out the optimal amount to trade infront of the ticket, determines PnL, if profitable and passes risk checks (including antiscam token checking - see UniApprover), then trade and report PnL. Will stop after a single trade.

# uniApprover
After getting rekt, by automatically buying tokens which I couldnt sell (about 1k USD!), I implemented an event scanner, which does exactly the same as above, but instead of executing, it forks the ethereum mainnet to memory and simulates the transactions, if the simulated account balance is positive (after fee's etc), then the token is added to a whitelist, this means its eligable to trade on uniRunner. Approved contracts are stored in approvedERC20.json and reread at uniRunner init.


To Run 
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
