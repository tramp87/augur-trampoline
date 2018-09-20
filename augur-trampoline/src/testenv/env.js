// @flow

import fetchPonyfill from 'fetch-ponyfill';
import ethJsUtil from 'ethereumjs-util';
import Web3 from 'web3';

const { fetch } = fetchPonyfill({});

const TESTRPC_HTTP_URL = 'http://ganache:8545';
const TESTRPC_WS_URL = 'ws://ganache:8545';
const AUGUR_CONTRACTS_URL = 'http://testenv';
const AUGUR_CONTRACTS_BROWSER_URL = '/api/contracts';

async function getContractAddresses(): Promise<*> {
  const urls = [AUGUR_CONTRACTS_BROWSER_URL, AUGUR_CONTRACTS_URL];

  // this is running only in tests (automated and manual) anyway, so we
  // can just make both requests, and see whichever returned some results
  const results = await Promise.all(
    urls.map(url =>
      fetch(url)
        .then(response => response.json())
        .catch(e => null),
    ),
  );

  return results.reduce((x, y) => (x == null ? y : x), null);
}

const account = {
  signer: new Buffer(
    ethJsUtil.toBuffer(
      '0x73dff7a656b0ecc3bb281bd5d14f9f8e77b60355d6274683d2f6fc5e3ab7ac11',
    ),
  ),
  accountType: 'privateKey',
};

function create_test_web3(): Web3 {
  return new Web3(new Web3.providers.HttpProvider(TESTRPC_HTTP_URL));
}

export {
  TESTRPC_HTTP_URL,
  TESTRPC_WS_URL,
  AUGUR_CONTRACTS_URL,
  getContractAddresses,
  account,
  create_test_web3,
};
