// @flow

import React, { Fragment } from 'react';
import type { MarketData } from '../steps/DisplayMarketData/fetch';

type Props = {|
  network: string,
  name: string,
  id: string,
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
      return {
        status: 'error',
        error: 'wip',
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

    const getDetails = () => {
      if (data == null) {
        return (
          <span>
            Loading {this.props.id}
            ...
          </span>
        );
      }

      if (data.status === 'error') {
        return (
          <span>
            Failed to fetch market {this.props.id}: {data.error}
          </span>
        );
      }

      return this.props.id;
    };

    return (
      <Fragment>
        <b>{this.props.name}</b>: {getDetails()}
      </Fragment>
    );
  }
}

export default TestMarketDetails;
