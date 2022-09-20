// Wallet verification functions
const LOCAL = 1337;
const MAINNET = 1;
const KOVAN_TESTNET = 42;
const RINKEBY_TESTNET = 4;

const {isValidAddress} = require('ethereumjs-util');

const hasValidAddress = (selectedAddress) => Boolean(isValidAddress(selectedAddress));

const isWallet = (selectedAddress) => Boolean(selectedAddress && hasValidAddress(selectedAddress));

const isValidNetwork = (networkVersion) =>
  networkVersion === LOCAL ||
  networkVersion === MAINNET ||
  networkVersion === KOVAN_TESTNET ||
  networkVersion === RINKEBY_TESTNET;

const isAnotherValidWallet = () => false; // complete logic for other wallets

const isValid = (selectedAddress, networkVersion) =>
  Boolean(isWallet(selectedAddress) && (isValidNetwork(networkVersion) || isAnotherValidWallet()));

module.exports = {
  isValid,
};
