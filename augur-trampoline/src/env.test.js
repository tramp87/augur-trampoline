// @flow

// very basic tests to ensure testrpc and test Augur contracts
// are set up correctly

import Web3 from 'web3';
import fetchPonyfill from 'fetch-ponyfill';

const { fetch } = fetchPonyfill({});

it('can connect to ganache', async () => {
  // TODO: testrpc url/web3 should be some shared file
  const web3 = new Web3(new Web3.providers.HttpProvider('http://ganache:8545'));
  const coinbase = await new Promise((resolve, reject) =>
    web3.eth.getCoinbase(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );
  expect(coinbase).not.toBeNull();
  const balance = await new Promise((resolve, reject) =>
    web3.eth.getBalance(
      coinbase,
      undefined,
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );
  expect(Number.parseFloat(balance)).toBeGreaterThan(0);
});

it('can fetch test Augur contracts addresses', async () => {
  // TODO: function that fetches test contracts should be in some shared file
  const response = await fetch('http://testenv');
  const addresses = await response.json();
  expect(addresses).not.toBeNull();
});
