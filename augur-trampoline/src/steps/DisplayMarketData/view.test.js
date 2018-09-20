// @flow

import React from 'react';
import { Map as ImmMap } from 'immutable';
import renderer from 'react-test-renderer';
import create_test_markets from '../../testenv/create_test_markets';
import { create_test_web3 } from '../../testenv/env';
import clean_json_from_ids from './test/clean_json_from_ids';
import fetchMarketData from './fetch';
import DisplayMarketDataView from './view';

test('render "loading" bar', () => {
  expect(
    renderer
      .create(<DisplayMarketDataView marketData={null} havingErrors={false} />)
      .toJSON(),
  ).toMatchSnapshot();
});

test('render "loading" bar with errors', () => {
  expect(
    renderer
      .create(<DisplayMarketDataView marketData={null} havingErrors={true} />)
      .toJSON(),
  ).toMatchSnapshot();
});

test(
  'render loaded market',
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

    fetchedData
      .entrySeq()
      .sort()
      .toArray()
      .forEach(([name, datum]) =>
        expect(
          clean_json_from_ids(
            renderer
              .create(
                <DisplayMarketDataView
                  marketData={datum}
                  havingErrors={false}
                />,
              )
              .toJSON(),
            {
              denominationToken: datum.denominationToken,
              endTime: datum.endTime,
            },
          ),
        ).toMatchSnapshot(`Render loaded market: ${name}`),
      );
  },
  60000,
);
