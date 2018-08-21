// @flow

import invariant from 'invariant';
import React, { Component } from 'react';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import abiDecoder from '../lib/abi-decoder';
import type { CancelableCallback } from '../lib/cancellable';
import type { Request } from '../Request';
import abi from '../lib/abi';
import { CANCELLABLE_ABORT_MSG, cancellable } from '../lib/cancellable';
import contracts from '../lib/contracts';
import type { StepProps } from '../lib/Step';

abiDecoder.addABI(abi.Augur);

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

type MarketData = {|
  blob: {},
|};

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
    // TODO: schedule start() every 10 seconds
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

// quick conversion from callback API into Promises
function promisifyContract(object: {}): * {
  return new Proxy(
    {},
    {
      get: (_: {}, name: string) => (...args: *) =>
        new Promise((resolve, reject) =>
          nullthrows(object[name], `Could not find property ${name}`).call(
            ...args,
            (error, result) =>
              error != null ? reject(error) : resolve(result),
          ),
        ),
    },
  );
}

function promisifyObject(object: {}): * {
  return new Proxy(
    {},
    {
      get: (_: {}, name: string) => (...args: *) =>
        new Promise((resolve, reject) =>
          nullthrows(object[name], `Could not find property ${name}`)(
            ...args,
            (error, result) =>
              error != null ? reject(error) : resolve(result),
          ),
        ),
    },
  );
}

async function fetchMarketData(
  request: Request,
  web3: Web3,
  account: string,
): Promise<MarketData> {
  const market = promisifyContract(
    web3.eth.contract(abi.Market).at(request.market),
  );

  const [
    // eslint-disable-next-line no-unused-vars
    _,
    numberOfOutcomes,
    numTicks,
    denominationToken,
    endTime,
    isFinalized,
    marketCreationInfo,
  ] = await Promise.all([
    // Security gotcha. We need to ensure that market belongs to
    // trusted universe. Otherwise in the future attacker could trick user
    // into buying some shares in false universe.
    ensureMarketIsLegitAndIsFromTrustedUniverse(request, web3),
    market.getNumberOfOutcomes(),
    market.getNumTicks(),
    market.getDenominationToken(),
    market.getEndTime(),
    market.isFinalized(),
    fetchMarketCreationInfo(request, web3),
  ]);

  return {
    blob: {
      numberOfOutcomes,
      numTicks,
      denominationToken,
      endTime,
      isFinalized,
      ...marketCreationInfo,
    },
  };
}

async function fetchMarketCreationInfo(
  request: Request,
  web3: Web3,
): Promise<*> {
  const receipt = await promisifyObject(web3.eth).getTransactionReceipt(
    request.creationTX,
  );

  // Security gotcha.
  // Here we take externally-provided transaction as a proof
  // of how market was created. To avoid scam, we need to verify:
  // 1. Trusted Augur contract logged "MarketCreated" event in tx
  // 2. Event is about this market
  // 3. Transaction is included in the blockchain
  //
  // All three are important, and failure to check all of them would open
  // opportunity for an attack.
  const logs = abiDecoder
    .decodeLogs(
      nullthrows(receipt).logs.filter(
        ({ address, removed }) =>
          // TODO: choose augur contract depending on which network we are in
          address === contracts.Augur && removed === false,
      ),
    )
    .filter(({ name }) => name === 'MarketCreated')
    .map(log =>
      log.events.reduce(
        (acc, { name, value }) => ({
          ...acc,
          [name]: value,
        }),
        {},
      ),
    )
    .filter(event => event.market === request.market);

  invariant(
    logs.length === 1,
    `Expected to have one MarketCreated event, got ${logs.length}`,
  );

  const event = logs[0];
  const extraInfo = JSON.parse(event.extraInfo);

  return {
    description: event.description,
    longDescription: nullthrows(extraInfo.longDescription),
    resolutionSource: nullthrows(extraInfo.resolutionSource),
    outcomes: event.outcomes,
    marketCreationFee: event.marketCreationFee,
    minPrice: event.minPrice,
    maxPrice: event.maxPrice,
    marketType: event.marketType,
  };
}

async function ensureMarketIsLegitAndIsFromTrustedUniverse(
  request: Request,
  web3: Web3,
): Promise<void> {
  // TODO: choose trusted universe depending on which network we are in
  const trustedUniverse = promisifyContract(
    web3.eth.contract(abi.Universe).at(contracts.Universe),
  );

  const isLegitMarket = await trustedUniverse.isContainerForMarket(
    request.market,
  );

  // comparing with `!== true` is silly, but I want to avoid
  // chance of considering market legit due to some silly type conversions
  // e.g. string 'false' is truthy in JS, and if method somehow returns
  // `'false'`, it may be interpreted as `true`
  if (isLegitMarket !== true) {
    throw Error('This is an unrecognized market. Failing to avoid scam.');
  }
}

export default (props: Props) => <DisplayMarketData {...props} />;
