// @flow

/**
 * When we are in browser in debug mode, we want to display some
 * markets to do manual tests.
 *
 * Here we choose those markets for given network ID.
 */

import { Map as ImmMap } from 'immutable';
import invariant from 'invariant';
import { getContractAddresses } from './env';

export type TestMarket = {|
  market: string,
  transaction: string,
|};

async function get_test_markets(
  network: string,
): Promise<ImmMap<string, TestMarket>> {
  return await get_test_markets_for_local_network(network);
}

const MARKETS_ON_PUBLIC_NETWORKS: * = {
  '4': {
    cfk_jail: {
      market: '0x62643d0b946899bf7770f9b15cf9ae6c73d2cf9d',
      transaction:
        '0xe51ff13a07d63acca787927938a1d0315a2ec0c513bd1bcdc62d950388141b60',
    },
    trump_impeachment: {
      market: '0x4c5c33c2d785c0d62f396cb420ec10050d581d08',
      transaction:
        '0x6af28ceaa3e4c10a4876dc1f502f25d10413f58e93df88ccffa6bd7016255aeb',
    },
    china_antibiotics: {
      market: '0x448d1d8280844513c38b2b73bde8a539d0022954',
      transaction:
        '0x6af28ceaa3e4c10a4876dc1f502f25d10413f58e93df88ccffa6bd7016255aeb',
    },
  },
  '1': {
    eth500: {
      market: '0xd2b4906276b6ed334604f914306158c05a92e41f',
      transaction:
        '0x1a502e0bcbcc6974c81164575539beb6a4049dfe347d179b9a266f8a8c7c6786',
    },
    rep32: {
      market: '0x4e0ee58bf4230d3b799584e1a6027b4bda9fc4ed',
      transaction:
        '0x364d9e4513b3c0de0f346014b29b025491c27431cb6fdab2ec978ef88a530609',
    },
    btc20k: {
      market: '0x71fe9c2ee36374a380347d205acea2ee5359325a',
      transaction:
        '0x1aa53f7b0e099855aeb17bb0f0b9e9b83145022df7e2771f5c4b70fcdb820e41',
    },
    eth_options_categorical: {
      market: '0xcea0b692b0f97323518478c037c8c9b37e8c3f60',
      transaction:
        '0xfb704f9d6cf74114342f27f96c5e71d25a4c405210c8917bbcf53798487d43d0',
    },
    trump_reelection_2020: {
      market: '0xdecbd869eccac116193886c3f7fa4a150ffab681',
      transaction:
        '0xfc27c84df6cb4810762c0e931051dc55c8531a14081760aea3168c39e034f220',
    },
    ethcall500: {
      market: '0xf3a4e2fc480ea4bc91c3313d97fc36d4d70bf452',
      transaction:
        '0x9a9c4534606ab62885e9420f4510327a0cf8b0d50979718b07ecc4b51d265273',
    },
    usd100scalar: {
      market: '0x3e4f7b408f7b5c103f94c7cd2b72b1073b0152c6',
      transaction:
        '0xe849de5d52c5f10c533004096bde9a2b9d5ac109266b25600d5b96e09b550994',
    },
  },
};

async function get_test_markets_for_local_network(
  network: string,
): Promise<ImmMap<string, TestMarket>> {
  if (MARKETS_ON_PUBLIC_NETWORKS[network] != null) {
    return MARKETS_ON_PUBLIC_NETWORKS[network];
  }

  const json = await fetch('/api/test_markets').then(response =>
    response.json(),
  );
  invariant(json.network === network, 'Network mismatch');
  return ImmMap(json.markets);
}

async function get_local_test_network(): Promise<string> {
  const addresses = await getContractAddresses();
  return addresses.network;
}

export { get_test_markets, get_local_test_network };
