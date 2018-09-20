// @flow

import { Map as ImmMap } from 'immutable';
import create_test_markets from '../../testenv/create_test_markets';
import { create_test_web3 } from '../../testenv/env';
import fetchMarketData from './fetch';

test(
  'can fetch market data',
  async () => {
    const { markets } = await create_test_markets();
    const web3 = create_test_web3();

    const fetchedData = await Promise.all(
      markets
        .map(market => fetchMarketData(web3, market.market, market.transaction))
        .entrySeq()
        .map(async ([name, promise]) => {
          const data = await promise;
          return [name, data];
        })
        .toArray(),
    ).then(pairs => ImmMap(pairs));

    expect(
      fetchedData.map(datum =>
        clean_json_from_ids(datum, {
          denominationToken: datum.denominationToken,
          endTime: datum.endTime,
        }),
      ),
    ).toMatchSnapshot();
  },
  30000,
);

function clean_json_from_ids(json: any, ids: { [string]: string }): any {
  return JSON.parse(
    ImmMap(ids)
      .entrySeq()
      .sort()
      .reduce(
        (s, [name, value]) =>
          s.split(value).join(`_MASKED_${name}_FOR_DETERMINISM_`),
        JSON.stringify(json),
      ),
  );
}
