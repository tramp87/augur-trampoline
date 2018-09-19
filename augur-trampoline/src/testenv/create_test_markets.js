// @flow

import Augur from 'augur.js';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import {
  TESTRPC_HTTP_URL,
  TESTRPC_WS_URL,
  getContractAddresses,
  account,
} from './env';

async function create_test_markets(): Promise<*> {
  console.log('before connect');
  const web3 = new Web3(new Web3.providers.HttpProvider(TESTRPC_HTTP_URL));
  console.log('after connect');
  const coinbase = await new Promise((resolve, reject) =>
    web3.eth.getCoinbase(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );
  console.log('after coinbase');
  const network = await new Promise((resolve, reject) =>
    web3.version.getNetwork(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );

  const addresses = await getContractAddresses().then(addresses =>
    nullthrows(addresses[network]),
  );

  const augur = new Augur();
  await new Promise((resolve, reject) =>
    augur.connect(
      {
        ethereumNode: { ws: TESTRPC_WS_URL },
        augurNode: null,
      },
      (err, connectionInfo) =>
        err != null ? reject(err) : resolve(connectionInfo),
    ),
  );

  const result = await new Promise((resolve, reject) =>
    augur.api.Universe.createYesNoMarket({
      _endTime: Math.floor(Date.now() / 1000 + 86400 * 100),
      _feePerEthInWei: '42',
      _denominationToken: addresses.Cash,
      _designatedReporterAddress: coinbase,
      _topic: 'religion',
      _description: 'Can God create a stone so heavy that He cannot lift it?',
      _extraInfo: JSON.stringify({
        resolutionSource: 'stars',
        tags: ['yo', 'mate'],
        longDescription: 'meh',
      }),
      meta: account,
      tx: {
        from: '0x44291b3c469806e625500a6184a045d2a5994058',
        to: addresses.Universe,
        value: Math.pow(10, 18),
      },
      onSent: () =>
        console.log('Market creation TX has been sent to the network'),
      onSuccess: result => resolve(result),
      onFailed: e => reject(e),
    }),
  );

  console.log(
    `Market ${result.callReturn} has been created in transaction ${
      result.hash
    }`,
  );

  return {
    network,
    market: result.callReturn,
    transaction: result.hash,
  };
}

export default create_test_markets;
