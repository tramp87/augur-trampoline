// @flow

import React from 'react';
import { Map as ImmMap } from 'immutable';
import Web3 from 'web3';
import { get_test_markets } from './get_test_markets';
import type { TestMarket } from './get_test_markets';

type Props = {};
type MarketsData =
  | {|
      status: 'error',
      error: string,
    |}
  | {|
      status: 'ok',
      network: string,
      markets: ImmMap<string, TestMarket>,
    |};
type State = { data: ?MarketsData };

class TestMarketDetails extends React.Component<Props, State> {
  state: State;
  _mounted: boolean;

  constructor(props: Props) {
    super(props);
    this.state = { data: null };
    this._mounted = false;
  }

  componentDidMount() {
    this._mounted = true;

    this.run().then(data => {
      if (this._mounted) {
        this.setState({ data });
      }
    });
  }

  async run(): Promise<MarketsData> {
    try {
      // this won't work unless we have web3 in browser, but whatever for manual
      // tests
      const web3 = new Web3(window.web3.currentProvider);
      const network = await new Promise((resolve, reject) =>
        web3.version.getNetwork(
          (error, result) => (error != null ? reject(error) : resolve(result)),
        ),
      );
      const markets = await get_test_markets(network);
      return {
        status: 'ok',
        network,
        markets,
      };
    } catch (e) {
      console.error(e);
      return {
        status: 'error',
        error: e.toString(),
      };
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    const data = this.state.data;

    if (data == null) {
      return <span>Loading...</span>;
    }

    if (data.status === 'error') {
      return <span>Failed to fetch markets: {data.error}</span>;
    }

    return (
      <ul>
        <li>Network ID: {data.network}</li>
        <li>
          <ol>
            {ImmMap(data.markets)
              .entrySeq()
              .sort()
              .map(([name, details]) => (
                <li key={name}>
                  <b>{name}</b>: {JSON.stringify(details)}
                </li>
              ))}
          </ol>
        </li>
      </ul>
    );
  }
}

export default TestMarketDetails;
