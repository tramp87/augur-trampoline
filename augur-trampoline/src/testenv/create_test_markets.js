// @flow

// eslint-disable-next-line import/no-nodejs-modules
import fs from 'fs';
import nullthrows from 'nullthrows';
import { JSDOM, VirtualConsole } from 'jsdom';
import { Map as ImmMap } from 'immutable';
import encodeTag from 'augur.js/src/format/tag/encode-tag';
import { getContractAddresses, account, create_test_web3 } from './env';

async function create_test_markets(): Promise<{|
  network: string,
  markets: ImmMap<
    string,
    {|
      market: string,
      transaction: string,
    |},
  >,
|}> {
  const web3 = create_test_web3();
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

  // have to run sequentially to avoid nonce race condition
  const markets = await ImmMap({
    binary: () =>
      runAugurInSandbox(
        augur => params => augur.api.Universe.createYesNoMarket(params),
        {
          _endTime: Math.floor(Date.now() / 1000 + 86400 * 100),
          _feePerEthInWei: '42',
          _denominationToken: addresses.Cash,
          _designatedReporterAddress: coinbase,
          _topic: encodeTag('religion'),
          _description:
            'Can God create a stone so heavy that He cannot lift it?',
          _extraInfo: JSON.stringify({
            resolutionSource: 'your mind',
            tags: ['religion', 'God', 'philosophy'],
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
      ),
    // TODO: see why fetcher doesn't recognize outcomes
    categorical: () =>
      runAugurInSandbox(
        augur => params => augur.api.Universe.createCategoricalMarket(params),
        {
          _endTime: Math.floor(Date.now() / 1000 + 86400 * 50),
          _feePerEthInWei: '13',
          _denominationToken: addresses.Cash,
          _designatedReporterAddress: coinbase,
          _topic: encodeTag('colors'),
          _description: 'What is the best color?',
          _extraInfo: JSON.stringify({
            resolutionSource:
              'https://upload.wikimedia.org/wikipedia/commons/0/0e/Red-green-blue_flag.svg',
            tags: [],
            longDescription: '',
          }),
          _outcomes: ['Red', 'Green', 'Blue'].map(s => encodeTag(s)),
          meta: account,
          tx: {
            from: '0x44291b3c469806e625500a6184a045d2a5994058',
            to: addresses.Universe,
            value: Math.pow(10, 18),
          },
          onSent: () =>
            console.log('Market creation TX has been sent to the network'),
        },
      ),
    // TODO: see why ranges are all messed up
    scalar: () =>
      runAugurInSandbox(
        augur => params => augur.api.Universe.createScalarMarket(params),
        {
          _endTime: Math.floor(Date.now() / 1000 + 86400 * 365 * 5),
          _feePerEthInWei: '1203',
          _denominationToken: addresses.Cash,
          _designatedReporterAddress: coinbase,
          _minPrice: 0,
          _maxPrice: 100,
          _numTicks: 100,
          _topic: encodeTag('politics'),
          _description:
            'How many states will there be in the United States at the market expiration?',
          _extraInfo: JSON.stringify({
            resolutionSource: '',
            tags: ['United States', 'geography'],
            longDescription: '',
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
      ),
    // TODO: see why ranges are all messed up
    scalar2: () =>
      runAugurInSandbox(
        augur => params => augur.api.Universe.createScalarMarket(params),
        {
          _endTime: Math.floor(Date.now() / 1000 + 86400 * 90),
          _feePerEthInWei: '1111',
          _denominationToken: addresses.Cash,
          _designatedReporterAddress: coinbase,
          _minPrice: 1.0,
          _maxPrice: 1.3,
          _numTicks: 300,
          _topic: encodeTag('finance'),
          _description: 'How much will EUR cost in USD at market expiration?',
          _extraInfo: JSON.stringify({
            resolutionSource: '',
            tags: ['finance'],
            longDescription: '',
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
      ),
  })
    .entrySeq()
    .reduce(async (mapPromise, [name, f]) => {
      const map = await mapPromise;
      const creation = await f();
      return map.set(name, creation);
    }, Promise.resolve(ImmMap()));

  return {
    network,
    markets: markets.map(result => ({
      market: result.callReturn,
      transaction: result.hash,
    })),
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
