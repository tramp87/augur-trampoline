// @flow

import invariant from 'invariant';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import abiDecoder from '../../lib/contrib/abi-decoder';
import abi from '../../lib/contracts/abi';
import getContractAddresses from '../../lib/contracts/addresses';
import type { Addresses } from '../../lib/contracts/addresses';

abiDecoder.addABI(abi.Augur);

export type MarketData = {|
  numberOfOutcomes: string,
  numTicks: string,
  denominationToken: string,
  endTime: string,
  isFinalized: boolean,
  description: string,
  longDescription: string,
  resolutionSource: string,
  outcomes: string,
  marketCreationFee: string,
  minPrice: string,
  maxPrice: string,
  marketType: string,
|};

/**
 * Responsibility of this function is to not only fetch accurate data about the
 * market, but also ensure that the market is genuine.
 *
 * Here are the example attacks that this protects from
 * (assuming user was linked to our page by attacked):
 * - market that was created on some other deployment of Augur
 * - market in false universe after the fork
 * - market and transaction that do not match
 *    (attacker may hope we'd use transaction logs to read data about the
 *    market, and end up reading wrong data)
 * - event in transaction that matches the market, but is made by some other
 *    entity than Augur
 * - transaction that has been removed due to reorg
 */
async function fetchMarketData(
  web3: Web3,
  marketID: string,
  creationTX: string,
): Promise<MarketData> {
  const market = promisifyContract(web3.eth.contract(abi.Market).at(marketID));

  const [
    // eslint-disable-next-line no-unused-vars
    _,
    numberOfOutcomes,
    numTicks,
    denominationToken,
    endTime,
    isFinalized,
    marketCreationInfo,
    augurContractAddresses,
  ] = await Promise.all([
    // Security gotcha. We need to ensure that market belongs to
    // trusted universe. Otherwise in the future attacker could trick user
    // into buying some shares in false universe.
    ensureMarketIsLegitAndIsFromTrustedUniverse(web3, marketID),
    market.getNumberOfOutcomes(),
    market.getNumTicks(),
    market.getDenominationToken(),
    market.getEndTime(),
    market.isFinalized(),
    fetchMarketCreationInfo(web3, marketID, creationTX),
    getAddresesForNetworkOfWeb3(web3),
  ]);

  invariant(
    denominationToken === augurContractAddresses.Cash,
    'We do not support other denominations yet',
  );

  return {
    numberOfOutcomes,
    numTicks,
    denominationToken,
    endTime,
    isFinalized,
    ...marketCreationInfo,
  };
}

// quick conversion from callback API into Promises
function promisifyContract(object: {}): * {
  return new Proxy(
    {},
    {
      get: (_: {}, name: string) => (...args: *) =>
        new Promise((resolve, reject) =>
          nullthrows(object[name], `Could not find property ${name}`).call(
            ...args,
            (error, result) =>
              error != null ? reject(error) : resolve(result),
          ),
        ),
    },
  );
}

function promisifyObject(object: {}): * {
  return new Proxy(
    {},
    {
      get: (_: {}, name: string) => (...args: *) =>
        new Promise((resolve, reject) =>
          nullthrows(object[name], `Could not find property ${name}`)(
            ...args,
            (error, result) =>
              error != null ? reject(error) : resolve(result),
          ),
        ),
    },
  );
}

async function fetchMarketCreationInfo(
  web3: Web3,
  marketID: string,
  creationTX: string,
): Promise<*> {
  const receipt = await promisifyObject(web3.eth).getTransactionReceipt(
    creationTX,
  );
  const addresses = await getAddresesForNetworkOfWeb3(web3);
  const network = await new Promise((resolve, reject) =>
    web3.version.getNetwork(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );

  // Security gotcha.
  // Here we take externally-provided transaction as a proof
  // of how market was created. To avoid scam, we need to verify:
  // 1. Trusted Augur contract logged "MarketCreated" event in tx
  // 2. Event is about this market
  // 3. Transaction is included in the blockchain
  //
  // All three are important, and failure to check all of them would open
  // opportunity for an attack.
  const logs = abiDecoder
    .decodeLogs(
      nullthrows(receipt)
        .logs.filter(({ address }) => address === addresses.Augur)
        .filter(({ removed, type }) => {
          if (removed === false) {
            return true;
          }

          // ganache is "special", and doesn't populate `removed` field
          // risk is low though, as ganache is only used for test networks,
          // ganache is using timestamp as network id
          if (
            Number.parseInt(network, 10) > 1000000000 &&
            removed === undefined &&
            type === 'mined'
          ) {
            return true;
          }

          throw new Error(
            `We observed transaction ${
              receipt.transactionHash
            } with logs that are marked as removed=${removed}, and type=${type}. ` +
              'This may be attempt of scam, or technical issue. ' +
              'Please do report to Augur Trampoline Github page.',
          );
        }),
    )
    .filter(({ name }) => name === 'MarketCreated')
    .map(log =>
      log.events.reduce(
        (acc, { name, value }) => ({
          ...acc,
          [name]: value,
        }),
        {},
      ),
    )
    .filter(event => event.market === marketID);

  invariant(
    logs.length === 1,
    `Expected to have one MarketCreated event, got ${logs.length}`,
  );

  const event = logs[0];
  const extraInfo = JSON.parse(event.extraInfo);

  return {
    description: event.description,
    longDescription: nullthrows(extraInfo.longDescription),
    resolutionSource: nullthrows(extraInfo.resolutionSource),
    outcomes: event.outcomes,
    marketCreationFee: event.marketCreationFee,
    minPrice: event.minPrice,
    maxPrice: event.maxPrice,
    marketType: event.marketType,
  };
}

async function getAddresesForNetworkOfWeb3(web3: Web3): Promise<Addresses> {
  const network = await new Promise((resolve, reject) =>
    web3.version.getNetwork(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );
  return await getContractAddresses(network);
}

async function ensureMarketIsLegitAndIsFromTrustedUniverse(
  web3: Web3,
  marketID: string,
): Promise<void> {
  const augurAddresses = await getAddresesForNetworkOfWeb3(web3);
  const trustedUniverse = promisifyContract(
    web3.eth.contract(abi.Universe).at(augurAddresses.Universe),
  );

  const isLegitMarket = await trustedUniverse.isContainerForMarket(marketID);

  // comparing with `!== true` is silly, but I want to avoid
  // chance of considering market legit due to some silly type conversions
  // e.g. string 'false' is truthy in JS, and if method somehow returns
  // `'false'`, it may be interpreted as `true`
  if (isLegitMarket !== true) {
    throw Error('This is an unrecognized market. Failing to avoid scam.');
  }
}

export default fetchMarketData;
