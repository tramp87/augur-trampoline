// @flow

// eslint-disable-next-line import/no-nodejs-modules
import fs from 'fs';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import { JSDOM, VirtualConsole } from 'jsdom';
import { TESTRPC_HTTP_URL, getContractAddresses, account } from './env';

async function create_test_markets(): Promise<*> {
  const web3 = new Web3(new Web3.providers.HttpProvider(TESTRPC_HTTP_URL));
  const coinbase = await new Promise((resolve, reject) =>
    web3.eth.getCoinbase(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );
  const network = await new Promise((resolve, reject) =>
    web3.version.getNetwork(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );

  const addresses = await getContractAddresses().then(addresses =>
    nullthrows(addresses[network]),
  );

  const result = await runAugurInSandbox(
    augur => params => augur.api.Universe.createYesNoMarket(params),
    {
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
    },
  );

  return {
    network,
    market: result.callReturn,
    transaction: result.hash,
  };
}

// start Augur inside JSDOM to ensure clean shutdown
async function runAugurInSandbox(func: *, params: *): Promise<*> {
  const virtualConsole = new VirtualConsole();
  virtualConsole.sendTo(console);
  const dom = new JSDOM('', { runScripts: 'outside-only', virtualConsole });
  try {
    dom.window.AUGUR_SANDBOX_RUNNER_FUNC = func;
    dom.window.AUGUR_SANDBOX_RUNNER_PARAMS = params;

    const augurjs = await new Promise((resolve, reject) =>
      fs.readFile(
        'dev-artifacts/augur_sandbox_runner.js',
        { encoding: 'utf-8' },
        (err, data: string) => (err != null ? reject(err) : resolve(data)),
      ),
    );

    dom.window.eval(augurjs);

    return await nullthrows(dom.window.AUGUR_SANDBOX_RUNNER_PROMISE);
  } finally {
    dom.window.close();
  }
}

export default create_test_markets;
