// @flow

import nullthrows from 'nullthrows';
import { getContractAddresses as getContractAddressesFromTestEnv } from '../../../testenv/env';
import type { Addresses } from './types';

async function getContractAddresses(network: string): Promise<Addresses> {
  const testenv = await getContractAddressesFromTestEnv();
  return nullthrows(testenv[network]);
}

export default getContractAddresses;
