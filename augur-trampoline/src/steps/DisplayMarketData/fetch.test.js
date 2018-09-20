// @flow

import create_test_markets from '../../testenv/create_test_markets';
import { create_test_web3 } from '../../testenv/env';
import fetchMarketData from './fetch';

test(
  'can fetch market data',
  async () => {
    const market = await create_test_markets();
    const web3 = create_test_web3();
    const fetchedData = await fetchMarketData(
      web3,
      market.market,
      market.transaction,
    );
    expect({
      ...fetchedData,
      endTime: 'this is overridden to make test deterministic',
    }).toMatchSnapshot();
  },
  10000,
);
