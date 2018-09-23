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
import MARKETS_ON_PUBLIC_NETWORKS from './markets_on_public_networks';

export type TestMarket = {|
  market: string,
  transaction: string,
|};

async function get_test_markets(
  network: string,
): Promise<ImmMap<string, TestMarket>> {
  if (MARKETS_ON_PUBLIC_NETWORKS[network] != null) {
    return ImmMap(MARKETS_ON_PUBLIC_NETWORKS[network]);
  }

  console.log(`Assuming ${network} is a local network.`);
  return await get_test_markets_for_local_network(network);
}

async function get_test_markets_for_local_network(
  network: string,
): Promise<ImmMap<string, TestMarket>> {
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
