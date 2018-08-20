// @flow

import invariant from 'invariant';
import React, { Component } from 'react';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import type { CancelableCallback } from '../lib/cancellable';
import type { Request } from '../Request';
import { CANCELLABLE_ABORT_MSG, cancellable } from '../lib/cancellable';
import type { StepProps } from '../lib/Step';

type Input = {|
  request: Request,
  web3: Web3,
  account: string,
|};

type Output = {|
  request: Request,
  web3: Web3,
  account: string,
|};

type MarketData = {||};

type Props = StepProps<Input, Output>;
type State = {|
  marketData: ?MarketData,
  havingErrors: boolean,
|};

class DisplayMarketData extends Component<Props, State> {
  state: State;
  _callback: ?CancelableCallback<[any, ?MarketData]>;

  constructor(props: Props) {
    super(props);
    this.state = {
      marketData: null,
      havingErrors: false,
    };
    this._callback = null;
  }

  componentDidMount() {
    this._start();
  }

  componentWillUnmount() {
    this._stop();
  }

  _start() {
    const callback = cancellable(([e, result]) => {
      if (e) {
        console.error(e);
        this.setState({ havingErrors: true });
      } else {
        this.setState({
          havingErrors: false,
          marketData: nullthrows(result),
        });
      }
      this._stop();
    });

    invariant(this._callback === null, 'must have stopped before starting');

    this._callback = callback;

    const execute = async () => {
      try {
        try {
          const result = await fetchMarketData(
            this.props.input.request,
            this.props.input.web3,
            this.props.input.account,
          );
          callback.call([null, result]);
        } catch (e) {
          callback.call([e, null]);
        }
      } catch (e) {
        if (e.message !== CANCELLABLE_ABORT_MSG) {
          throw e;
        }
      }
    };

    execute();
  }

  _stop() {
    if (this._callback != null) {
      this._callback.cancel();
      this._callback = null;
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    invariant(
      this.props.onMutation === prevProps.onMutation &&
        this.props.input === prevProps.input,
      'These props are not supported to be updated dynamically. ' +
        'If this happened, it indicates a serious bug. ' +
        'Parent component should have updated our key in this case.',
    );

    const extractHasMarketData = (state: State): boolean => {
      return state.marketData != null;
    };

    const oldHasMarketData = extractHasMarketData(prevState);
    const newHasMarketData = extractHasMarketData(this.state);

    if (newHasMarketData !== oldHasMarketData) {
      this.props.onMutation({
        exclusive: false,
        output: newHasMarketData
          ? {
              state: 'ready',
              result: {
                account: this.props.input.account,
                web3: this.props.input.web3,
                request: this.props.input.request,
              },
            }
          : {
              state: 'not ready',
            },
      });
    }
  }

  render() {
    return <div>{JSON.stringify(this.state)}</div>;
  }
}

async function fetchMarketData(
  request: Request,
  web3: Web3,
  account: string,
): Promise<MarketData> {
  throw new Error('nah');
}

export default (props: Props) => <DisplayMarketData {...props} />;
