// @flow

import invariant from 'invariant';
import React, { Component, Fragment } from 'react';
import type { Node } from 'react';
import Web3 from 'web3';
import nullthrows from 'nullthrows';
import Label from 'react-bootstrap/lib/Label';
import Button from 'react-bootstrap/lib/Button';
import type { CancelableCallback } from '../lib/cancellable';
import type { Request } from '../Request';
import { CANCELLABLE_ABORT_MSG, cancellable } from '../lib/cancellable';
import type { StepProps } from '../lib/Step';
import withTimeout from '../lib/withTimeout';

type Input = {|
  request: Request,
  web3: Web3,
|};

type Output = {|
  request: Request,
  web3: Web3,
  // TODO: also export signer
  account: string,
|};

type Props = StepProps<Input, Output>;
type State = {|
  logs: Array<string>,
  status:
    | {| type: 'unknown' |}
    | {| type: 'running' |}
    | {| type: 'failed' |}
    | {|
        type: 'succeeded',
        result: {|
          account: string,
        |},
      |},
|};

class ChooseAccount extends Component<Props, State> {
  state: State;
  _callback: ?CancelableCallback<[any, ?string]>;
  _log: ?CancelableCallback<string>;

  constructor(props: Props) {
    super(props);
    this.state = {
      logs: [],
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
          status: {
            type: 'succeeded',
            result: { account: nullthrows(result) },
          },
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
          const result = await chooseAccount(this.props.input.web3, log.call);
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

    const extractAccount = (state: State): ?string => {
      if (state.status.type === 'succeeded') {
        return state.status.result.account;
      }
      return null;
    };

    const oldAccount = extractAccount(prevState);
    const newAccount = extractAccount(this.state);

    if (newAccount !== oldAccount) {
      this.props.onMutation({
        exclusive: false,
        output:
          newAccount != null
            ? {
                state: 'ready',
                result: {
                  account: newAccount,
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
          make('primary', 'Identifying...', 'Identifying Ethereum account'),
        failed: () =>
          // TODO: in this case we may try to explain people about Metamask
          // Or pop-up dialog to choose other signers (Trezor, Ledger)
          make('danger', 'Failed', 'Could not identify Ethereum account'),
        succeeded: () =>
          make(
            'success',
            'Success',
            `Found account: ${(status: any).result.account}`,
          ),
      };

      return versions[status.type]();
    };

    return (
      <div>
        <div>
          {statusSummary()}
          <Button
            style={{ margin: '0.5em' }}
            onClick={() => {
              this._stop();
              this._start();
            }}
          >
            Try again
          </Button>
        </div>
        <div>
          <ol>
            {this.state.logs.map((line, i) => (
              <li key={`${i}`}>{line}</li>
            ))}
          </ol>
        </div>
      </div>
    );
  }
}

async function chooseAccount(web3: Web3, log: string => void): Promise<string> {
  const accounts = await new Promise((resolve, reject) => {
    web3.eth.getAccounts((e, network) => {
      if (e != null) {
        reject(e);
      } else {
        resolve(network);
      }
    });
  });
  log('Identified accounts: ' + JSON.stringify(accounts));
  if (accounts.length > 0) {
    // TODO: let person choose
    // Does web3 ever have more than one account?
    return accounts[0];
  }
  throw new Error('Could not find an Ethereum account');
}

export default (props: Props) => <ChooseAccount {...props} />;
