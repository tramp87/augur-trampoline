// @flow

import invariant from 'invariant';
import mainnet from './mainnet';
import testrpc from './testrpc';
import type { Addresses } from './types';

export type { Addresses } from './types';

async function getContractAddresses(network: string): Promise<Addresses> {
  if (network === '1') {
    return mainnet;
  }

  if (process.env.NODE_ENV !== 'production') {
    // in dev mode assume that unknown network is coming from local testrpc
    return await testrpc(network);
  }

  invariant(
    false,
    `Do not know how to get contract addresses for network ${network}`,
  );
}

export default getContractAddresses;
