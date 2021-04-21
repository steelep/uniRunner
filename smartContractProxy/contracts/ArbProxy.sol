// SPDX-License-Identifier: MIT

pragma solidity 0.7.1;

import "./interfaces/IUniswapV2Router02.sol";
import "./interfaces/IERC20.sol";


contract ArbProxy {
  address internal constant UNISWAP_ROUTER_ADDRESS = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
  address internal constant SUSHISWAP_ROUTER_ADDRESS = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F;
  address payable owner;
  IUniswapV2Router02 public uniswapRouter;
  IUniswapV2Router02 public sushiswapRouter;

  constructor() {
    uniswapRouter = IUniswapV2Router02(UNISWAP_ROUTER_ADDRESS);
    sushiswapRouter = IUniswapV2Router02(SUSHISWAP_ROUTER_ADDRESS);
    owner = msg.sender;

  }

  //Uni -> Sushiswap
  function convertEthToTokenAndBackUni2Sushi(uint _tokenAmountToBuy, address _tokenAddress, address[] calldata _pathIn, address[] calldata _pathOut, uint _deadline, bool _enforcePositiveEV) public payable {
    require(msg.sender == owner);
    
    //Check if Positive EV TX @ UNI
    uint256 estimatedETH = getEstimatedETHForTokenAtSUSHI(_tokenAmountToBuy, _pathOut)[1];
    if(_enforcePositiveEV){
          //Assert that this tx will have a positve expected value otherwise revert and burn gas
          require((msg.value) <= estimatedETH,  "Not Positive EV");
    }    
    //Leg one of TX UNI WETH Sell -> UNI Buy Token
    uniswapRouter.swapExactETHForTokens{ value: msg.value }(_tokenAmountToBuy, _pathIn, address(this), _deadline);

    //Intermediate Logic, confirm amount of tokens received, approve next exchange to sell
    uint256 tokensReceived = IERC20(_tokenAddress).balanceOf(address(this));
    IERC20(_tokenAddress).approve(address(SUSHISWAP_ROUTER_ADDRESS), 2**256 - 1);
    sushiswapRouter.swapExactTokensForETH(tokensReceived, estimatedETH, _pathOut, address(this), _deadline);

    // refund leftover ETH to user
    (bool success,) = msg.sender.call{ value: address(this).balance }("");
    require(success, "Refund Failed");
  }

  function convertEthToTokenAndBackSushi2Uni(uint _tokenAmountToBuy, address _tokenAddress, address[] calldata _pathIn, address[] calldata _pathOut, uint _deadline, bool _enforcePositiveEV) public payable {
    require(msg.sender == owner);
    
    //Check if Positive EV TX @ UNI
    uint256 estimatedETH = getEstimatedETHForTokenAtUNI(_tokenAmountToBuy, _pathOut)[1];
    if(_enforcePositiveEV){
          //Assert that this tx will have a positve expected value otherwise revert and burn gas
          require((msg.value) <= estimatedETH,  "Not Positive EV");
    }    
    //Leg one of TX UNI WETH Sell -> UNI Buy Token
    sushiswapRouter.swapExactETHForTokens{ value: msg.value }(_tokenAmountToBuy, _pathIn, address(this), _deadline);

    //Intermediate Logic, confirm amount of tokens received, approve next exchange to sell
    uint256 tokensReceived = IERC20(_tokenAddress).balanceOf(address(this));
    IERC20(_tokenAddress).approve(address(UNISWAP_ROUTER_ADDRESS), 2**256 - 1);
    uniswapRouter.swapExactTokensForETH(tokensReceived, estimatedETH, _pathOut, address(this), _deadline);

    // refund leftover ETH to user
    (bool success,) = msg.sender.call{ value: address(this).balance }("");
    require(success, "Refund Failed");
  }

  function getEstimatedETHForTokenAtUNI(uint _tokenAmount, address[] calldata _pathOut) public view returns (uint[] memory) {
    require(msg.sender == owner);
    return uniswapRouter.getAmountsOut(_tokenAmount, _pathOut);
  }
  function getEstimatedETHForTokenAtSUSHI(uint _tokenAmount, address[] calldata _pathOut) public view returns (uint[] memory) {
    require(msg.sender == owner);
    return sushiswapRouter.getAmountsOut(_tokenAmount, _pathOut);
  }

  function withdrawBalanceToken(address _tokenAddress) public{
    require(msg.sender == owner);
    IERC20(_tokenAddress).transfer(msg.sender, IERC20(_tokenAddress).balanceOf(address(this)));
  }

    function changeOwner(address payable _newOwner) public{
    require(msg.sender == owner);
    owner = _newOwner;

  }
  function withdrawBalanceETH() public{
    // withdraw all eth 
    require(msg.sender == owner);
    msg.sender.call{ value: address(this).balance }("");
  }

  // important to receive ETH
  receive() payable external {}
}
