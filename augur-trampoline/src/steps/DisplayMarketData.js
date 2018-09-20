// @flow

import invariant from 'invariant';
import React, { Component } from 'react';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import Panel from 'react-bootstrap/lib/Panel';
import abiDecoder from '../lib/contrib/abi-decoder';
import type { CancelableCallback } from '../lib/util/cancellable';
import type { Request } from '../Request';
import abi from '../lib/contracts/abi';
import { CANCELLABLE_ABORT_MSG, cancellable } from '../lib/util/cancellable';
import getContractAddresses from '../lib/contracts/addresses';
import OptimisticProgressBar from '../lib/ui/optimistic-progress-bar';
import type { StepProps } from '../lib/Step';
import type { Addresses } from '../lib/contracts/addresses';

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
  numberOfOutcomes: string,
  numTicks: string,
  denominationToken: string,
  endTime: string,
  isFinalized: boolean,
  description: string,
  longDescription: string,
  resolutionSource: string,
  outcomes: string,
  marketCreationFee: string,
  minPrice: string,
  maxPrice: string,
  marketType: string,
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
    const marketData = this.state.marketData;

    // TODO: add RetryButton?
    if (marketData == null) {
      return (
        <div>
          <div>{JSON.stringify(this.state)}</div>
          <Panel>
            <Panel.Heading>
              <Panel.Title componentClass="h3">
                Loading market data...
              </Panel.Title>
            </Panel.Heading>
            <Panel.Body>
              <OptimisticProgressBar expectedTimeSeconds={4} />
            </Panel.Body>
          </Panel>
        </div>
      );
    }

    const maybeMakeLink = s =>
      s.startsWith('http://') || s.startsWith('https://') ? (
        <a href={s} target="_blank">
          {s}
        </a>
      ) : (
        s
      );

    return (
      <div>
        <div>{JSON.stringify(this.state)}</div>
        <Panel>
          <Panel.Heading>
            <Panel.Title componentClass="h3">
              {marketData.description}
            </Panel.Title>
          </Panel.Heading>
          <Panel.Body>
            <p>
              Resolution source:{' '}
              {marketData.resolutionSource !== ''
                ? maybeMakeLink(marketData.resolutionSource)
                : 'General knowledge'}
            </p>
          </Panel.Body>
        </Panel>
      </div>
    );
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
    augurContractAddresses,
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
    getAddresesForNetworkOfWeb3(web3),
  ]);

  invariant(
    denominationToken === augurContractAddresses.Cash,
    'We do not support other denominations yet',
  );

  return {
    numberOfOutcomes,
    numTicks,
    denominationToken,
    endTime,
    isFinalized,
    ...marketCreationInfo,
  };
}

async function fetchMarketCreationInfo(
  request: Request,
  web3: Web3,
): Promise<*> {
  const receipt = await promisifyObject(web3.eth).getTransactionReceipt(
    request.creationTX,
  );
  const addresses = await getAddresesForNetworkOfWeb3(web3);
  const network = await new Promise((resolve, reject) =>
    web3.version.getNetwork(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
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
      nullthrows(receipt)
        .logs.filter(({ address }) => address === addresses.Augur)
        .filter(({ removed, type }) => {
          if (removed === false) {
            return true;
          }

          // ganache is "special", and doesn't populate `removed` field
          // risk is low though, as ganache is only used for test networks,
          // ganache is using timestamp as network id
          if (
            Number.parseInt(network, 10) > 1000000000 &&
            removed === undefined &&
            type === 'mined'
          ) {
            return true;
          }

          throw new Error(
            `We observed transaction ${
              receipt.transactionHash
            } with logs that are marked as removed=${removed}, and type=${type}. ` +
              'This may be attempt of scam, or technical issue. ' +
              'Please do report to Augur Trampoline Github page.',
          );
        }),
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

async function getAddresesForNetworkOfWeb3(web3: Web3): Promise<Addresses> {
  const network = await new Promise((resolve, reject) =>
    web3.version.getNetwork(
      (error, result) => (error != null ? reject(error) : resolve(result)),
    ),
  );
  return await getContractAddresses(network);
}

async function ensureMarketIsLegitAndIsFromTrustedUniverse(
  request: Request,
  web3: Web3,
): Promise<void> {
  const augurAddresses = await getAddresesForNetworkOfWeb3(web3);
  const trustedUniverse = promisifyContract(
    web3.eth.contract(abi.Universe).at(augurAddresses.Universe),
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
