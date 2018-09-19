// @flow

// very basic tests to ensure testrpc and test Augur contracts
// are set up correctly

import Web3 from 'web3';
import { TESTRPC_HTTP_URL, getContractAddresses } from './env';

it('can connect to ganache', async () => {
  const web3 = new Web3(new Web3.providers.HttpProvider(TESTRPC_HTTP_URL));
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
  const addresses = await getContractAddresses(false);
  expect(addresses).not.toBeNull();
});
