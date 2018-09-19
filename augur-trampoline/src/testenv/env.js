// @flow

import fetchPonyfill from 'fetch-ponyfill';
import ethJsUtil from 'ethereumjs-util';

const { fetch } = fetchPonyfill({});

const TESTRPC_HTTP_URL = 'http://ganache:8545';
const TESTRPC_WS_URL = 'ws://ganache:8545';
const AUGUR_CONTRACTS_URL = 'http://testenv';
const AUGUR_CONTRACTS_BROWSER_URL = '/api/contracts';

async function getContractAddresses(isClientSide: boolean): Promise<*> {
  const response = await fetch(
    isClientSide ? AUGUR_CONTRACTS_BROWSER_URL : AUGUR_CONTRACTS_URL,
  );
  const addresses = await response.json();
  return addresses;
}

const account = {
  signer: new Buffer(
    ethJsUtil.toBuffer(
      '0x73dff7a656b0ecc3bb281bd5d14f9f8e77b60355d6274683d2f6fc5e3ab7ac11',
    ),
  ),
  accountType: 'privateKey',
};

export {
  TESTRPC_HTTP_URL,
  TESTRPC_WS_URL,
  AUGUR_CONTRACTS_URL,
  getContractAddresses,
  account,
};
