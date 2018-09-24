// @flow

import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import BigNumber from 'bignumber.js';
import { Range as ImmRange } from 'immutable';
import { toRouterPath } from '../request';
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

const Outcome = ({
  marketType,
  outcomes,
  index,
  minPrice,
  maxPrice,
  scalarDenomination,
}: {
  marketType: BigNumber,
  outcomes: Array<string>,
  index: number,
  minPrice: BigNumber,
  maxPrice: BigNumber,
  scalarDenomination: ?string,
}) => {
  if (marketType.toNumber() === 0) {
    // binary
    return nullthrows(['NO', 'YES'][index]);
  } else if (marketType.toNumber() === 1) {
    // categorical
    return nullthrows(outcomes[index]);
  } else if (marketType.toNumber() === 2) {
    // scalar
    return nullthrows(
      [
        `DOWN ${minPrice.times(new BigNumber('1e-18'))} ${nullthrows(
          scalarDenomination,
        )}`,
        `UP ${maxPrice.times(new BigNumber('1e-18'))} ${nullthrows(
          scalarDenomination,
        )}`,
      ][index],
    );
  }

  throw new Error(`Unknown market type ${marketType}`);
};

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
            <li>
              id: {this.props.id}, creation TX: {this.props.creationTX}
            </li>
            <li>
              Outcomes:
              <ol>
                {ImmRange(0, data.numberOfOutcomes.toNumber())
                  .map(index => (
                    <li key={index}>
                      [0x
                      {index.toString(16)}:{' '}
                      <Outcome
                        marketType={data.marketType}
                        outcomes={data.outcomes}
                        index={index}
                        minPrice={data.minPrice}
                        maxPrice={data.maxPrice}
                        scalarDenomination={data.scalarDenomination}
                      />
                      ]{' '}
                      <Link
                        to={toRouterPath({
                          networkID: this.props.network,
                          market: this.props.id,
                          creationTX: this.props.creationTX,
                          outcome: `0x${index.toString(16)}`,
                          action: 'buy',
                          amount: '1000000000000000000',
                          price: data.numTicks.times(0.8).toFixed(0),
                          redirect: window.location.href,
                        })}
                      >
                        buy@
                        {data.maxPrice
                          .minus(data.minPrice)
                          .times('0.8e-18')
                          .toString()}
                      </Link>{' '}
                      or{' '}
                      <Link
                        to={toRouterPath({
                          networkID: this.props.network,
                          market: this.props.id,
                          creationTX: this.props.creationTX,
                          outcome: `0x${index.toString(16)}`,
                          action: 'sell',
                          amount: '1000000000000000000',
                          price: data.numTicks.times(0.2).toFixed(0),
                          redirect: window.location.href,
                        })}
                      >
                        sell@
                        {data.maxPrice
                          .minus(data.minPrice)
                          .times('0.2e-18')
                          .toString()}
                      </Link>
                    </li>
                  ))
                  .toArray()}
              </ol>
            </li>
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
