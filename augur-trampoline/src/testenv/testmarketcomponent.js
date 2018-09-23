// @flow

import React, { Fragment } from 'react';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import fetchMarketData from '../steps/DisplayMarketData/fetch';
import type { MarketData } from '../steps/DisplayMarketData/fetch';

type Props = {|
  network: string,
  name: string,
  id: string,
  creationTX: string,
|};
type WrappedMarketData =
  | {|
      status: 'error',
      error: string,
    |}
  | {|
      status: 'ok',
      data: MarketData,
    |};
type State = { data: ?WrappedMarketData };

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

  async run(): Promise<WrappedMarketData> {
    try {
      const web3 = new Web3(window.web3.currentProvider);
      const data = await fetchMarketData(
        web3,
        this.props.id,
        this.props.creationTX,
      );
      return {
        status: 'ok',
        data,
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
    const wrapped = this.state.data;

    const getDetails = () => {
      if (wrapped == null) {
        return (
          <span>
            Loading {this.props.id}
            ...
          </span>
        );
      }

      if (wrapped.status === 'error') {
        return (
          <span>
            Failed to fetch market {this.props.id}: {wrapped.error}
          </span>
        );
      }

      const data = wrapped.data;

      // TODO: this should come from some Augur.js enum
      const market_type_name = ['binary', 'categorical', 'scalar'];

      return (
        <span>
          [type:
          {nullthrows(market_type_name[data.marketType.toNumber()])}] [outcomes:
          {data.numberOfOutcomes.toString()}] {data.description}
          <ol>
            <li>id: {this.props.id}</li>
            <li>creation TX: {this.props.creationTX}</li>
            <li>debug: {JSON.stringify(data)}</li>
          </ol>
        </span>
      );
    };

    return (
      <Fragment>
        [alias:
        {this.props.name}] {getDetails()}
      </Fragment>
    );
  }
}

export default TestMarketDetails;
