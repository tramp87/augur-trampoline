// @flow

import React from 'react';
import renderer from 'react-test-renderer';
import { Map as ImmMap } from 'immutable';
import Web3 from 'web3';
import { get_test_markets } from '../../testenv/get_test_markets';
import fetchMarketData from './fetch';
import DisplayMarketDataView from './view';

const networks = ImmMap({
  '1': 'mainnet',
  '4': 'rinkeby',
});

describe('can fetch market data', () => {
  networks
    .entrySeq()
    .sort()
    .forEach(([networkID, networkName]) => {
      test(
        `from network ${networkName}`,
        async () => {
          const markets = await get_test_markets(networkID);
          const web3 = new Web3(
            new Web3.providers.HttpProvider(
              `https://${networkName}.infura.io/augur`,
            ),
          );

          const fetchedData = await Promise.all(
            markets
              .map(market =>
                fetchMarketData(web3, market.market, market.transaction),
              )
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
                renderer
                  .create(
                    <DisplayMarketDataView
                      marketData={{ ...datum, isFinalized: false }}
                      havingErrors={false}
                    />,
                  )
                  .toJSON(),
              ).toMatchSnapshot(`Render loaded market: ${name}`),
            );
        },
        60000,
      );
    });
});
