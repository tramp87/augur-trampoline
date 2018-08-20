// @flow

import invariant from 'invariant';
import React, { Component, Fragment } from 'react';
import type { Node } from 'react';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import Label from 'react-bootstrap/lib/Label';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import type { CancelableCallback } from '../lib/cancellable';
import type { Request } from '../Request';
import { RetryButton, ConfigureButton, LogButton } from '../lib/Buttons';
import { CANCELLABLE_ABORT_MSG, cancellable } from '../lib/cancellable';
import type { StepProps } from '../lib/Step';
import LogBox from '../lib/LogBox';
import withTimeout from '../lib/withTimeout';

type Input = Request;
type Output = {|
  request: Request,
  web3: Web3,
|};

type Props = StepProps<Input, Output>;
type State = {|
  manualURL: string,
  logs: Array<string>,
  isLogShown: boolean,
  status:
    | {| type: 'unknown' |}
    | {| type: 'running' |}
    | {| type: 'failed' |}
    | {|
        type: 'succeeded',
        result: {|
          web3: Web3,
          description: string,
        |},
      |},
|};

class ConnectToEthereumNetwork extends Component<Props, State> {
  state: State;
  _callback: ?CancelableCallback<
    [
      any,
      ?{|
        web3: Web3,
        description: string,
      |},
    ],
  >;
  _log: ?CancelableCallback<string>;

  constructor(props: Props) {
    super(props);
    this.state = {
      manualURL: '',
      logs: [],
      isLogShown: false,
      status: { type: 'unknown' },
    };
    this._callback = null;
    this._log = null;
  }

  componentDidMount() {
    this._start();
  }

  componentWillUnmount() {
    this._stop();
  }

  _start() {
    this.setState({ logs: [], status: { type: 'running' } });

    const log = cancellable(line =>
      this.setState(({ logs }) => ({ logs: [...logs, line] })),
    );

    const callback = cancellable(([e, result]) => {
      if (e) {
        console.error(e);
        this.setState({ status: { type: 'failed' } });
      } else {
        this.setState({
          status: { type: 'succeeded', result: nullthrows(result) },
        });
      }
      this._stop();
    });

    invariant(
      this._callback === null && this._log === null,
      'must have stopped before starting',
    );

    this._callback = callback;
    this._log = log;

    const execute = async () => {
      try {
        try {
          const result = await connect(
            this.props.input,
            this.state.manualURL,
            log.call,
          );
          callback.call([null, result]);
        } catch (e) {
          log.call(e.toString());
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
    if (this._log != null) {
      this._log.cancel();
      this._log = null;
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

    const extractWeb3 = (state: State): ?Web3 => {
      if (state.status.type === 'succeeded') {
        return state.status.result.web3;
      }
      return null;
    };

    const oldWeb3 = extractWeb3(prevState);
    const newWeb3 = extractWeb3(this.state);

    if (newWeb3 !== oldWeb3) {
      this.props.onMutation({
        exclusive: false,
        output:
          newWeb3 !== null
            ? {
                state: 'ready',
                result: {
                  web3: newWeb3,
                  request: this.props.input,
                },
              }
            : {
                state: 'not ready',
              },
      });
    }

    if (this.state.manualURL !== prevState.manualURL) {
      this._stop();
      this._start();
    }
  }

  render() {
    const statusSummary = (): Node => {
      const status = this.state.status;

      const make = (labelClass, labelText, text) => (
        <Fragment>
          <Label bsStyle={labelClass} style={{ margin: '0.5em' }}>
            {labelText}
          </Label>
          <span>{text}</span>
        </Fragment>
      );

      const versions = {
        unknown: () => make('warning', 'unknown', 'Initializing...'),
        running: () =>
          make('primary', 'Connecting...', 'Connecting to Ethereum network'),
        failed: () =>
          make('danger', 'Failed', 'Failed to connect to Ethereum network'),
        succeeded: () =>
          make(
            'success',
            'Success',
            `Connected to Ethereum network: ${
              (status: any).result.description
            }`,
          ),
      };

      return versions[status.type]();
    };

    // TODO: disable buttons if we are in immutable state
    return (
      <div>
        <div>
          {statusSummary()}
          <ButtonGroup style={{ margin: '0.25em' }}>
            <RetryButton
              onClick={() => {
                this._stop();
                this._start();
              }}
            />
            <ConfigureButton
              onClick={() => {
                const url = window.prompt(
                  'Enter URL of an Ethereum node. ' +
                    'Leave empty to choose node automatically.',
                  this.state.manualURL,
                );
                if (url != null && url !== this.state.manualURL) {
                  this.setState({ manualURL: url });
                }
              }}
            />
            <LogButton
              onClick={() =>
                this.setState(({ isLogShown }) => ({ isLogShown: !isLogShown }))
              }
              active={this.state.isLogShown}
            />
          </ButtonGroup>
        </div>
        {this.state.isLogShown ? <LogBox lines={this.state.logs} /> : null}
      </div>
    );
  }
}

async function connect(
  input: Input,
  manual: string,
  log: string => void,
): Promise<{|
  web3: Web3,
  description: string,
|}> {
  log(
    'Waiting for document to load to ensure browser extensions ' +
      'had opportunity to inject web3...',
  );
  await waitForDocumentLoad();
  log('Document is fully loaded');

  const defaultCandidates: Array<{|
    description: string,
    connector: string => Promise<Web3>,
  |}> = [
    {
      description: 'browser',
      connector: async () => {
        const web3 = window.web3;
        if (typeof web3 !== 'undefined') {
          return new Web3(web3.currentProvider);
        } else {
          throw new Error('web3 provider is unavailable');
        }
      },
    },
    {
      description: 'http://localhost:8545',
      connector: async description => {
        return new Web3(new Web3.providers.HttpProvider(description));
      },
    },
    {
      description: 'https://mainnet.infura.io/augur',
      connector: async description => {
        return new Web3(new Web3.providers.HttpProvider(description));
      },
    },
    {
      description: 'https://rinkeby.infura.io/augur',
      connector: async description => {
        return new Web3(new Web3.providers.HttpProvider(description));
      },
    },
  ];

  const candidates =
    manual === ''
      ? defaultCandidates
      : [
          {
            description: manual,
            connector: async description => {
              return new Web3(new Web3.providers.HttpProvider(description));
            },
          },
        ];

  const processCandidate = async ({
    description,
    connector,
  }: {|
    description: string,
    connector: string => Promise<Web3>,
  |}): Promise<?Web3> => {
    try {
      return await withTimeout(5000, async () => {
        const web3 = await connector(description);

        // check if it belongs to the network that we want
        const network = await new Promise((resolve, reject) => {
          web3.version.getNetwork((e, network) => {
            if (e != null) {
              reject(e);
            } else {
              resolve(network);
            }
          });
        });
        log(`Network for <${description}> is ${network}`);

        if (network !== input.networkID) {
          throw new Error(
            'This node belongs to wrong network. ' +
              `It is in ${network}, while we want ${input.networkID}`,
          );
        }

        // do some basic call to verify it works
        const blockNumber = await new Promise((resolve, reject) => {
          web3.eth.getBlockNumber((e, number) => {
            if (e != null) {
              reject(e);
            } else {
              resolve(number);
            }
          });
        });
        log(`Block number for <${description}> is ${blockNumber}`);
        return web3;
      });
    } catch (e) {
      log(`Failed to connect to ${description}: ${e.message}`);
      return null;
    }
  };

  for (var i = 0; i < candidates.length; ++i) {
    const candidate = candidates[i];
    log(`Attempting to connect to <${candidate.description}>`);
    const web3 = await processCandidate(candidate);
    if (web3 != null) {
      log(`Choosing <${candidate.description}>`);
      return {
        web3,
        description: candidate.description,
      };
    }
  }

  throw Error('Could not establish an Ethereum connection');
}

function waitForDocumentLoad(): Promise<void> {
  return new Promise(resolve => {
    const attemptResolve = () => {
      if (document.readyState === 'complete') {
        resolve();
        return true;
      }
      return false;
    };

    if (!attemptResolve()) {
      (document: any).onreadystatechange = () => {
        attemptResolve();
      };
    }
  });
}

export default (props: Props) => <ConnectToEthereumNetwork {...props} />;
