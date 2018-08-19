// @flow

import React, { Fragment } from 'react';
import nullthrows from 'nullthrows';
import pure from 'recompose/pure';
import qs from 'qs';
import '../App.css';
import { RootStep, combineTwoSteps } from '../lib/Step';
import type { Request } from '../Request';
import ChooseAccount from '../steps/ChooseAccount';
import ConnectToEthereumNetwork from '../steps/ConnectToEthereumNetwork';

// TODO: move this into where the steps are defined
// Steps to place a trade:
// 1. Connect to Ethereum network
// 2. Choose account
// 3. Fetch data and display it to user
// 4. Sign
// 5. Send transaction and wait for confirmation
// 6. Redirect back

const networks = {
  Rinkeby: '4',
  mainnet: '1',
};

const Transaction = ({ match }: { match: * }) => {
  const networkID = nullthrows(networks[match.params.network]);
  const { market, outcome, action, queryparams } = match.params;
  const { amount, price, redirect } = qs.parse(queryparams);

  const request: Request = {
    networkID,
    market,
    outcome,
    action,
    amount,
    price,
    redirect,
  };

  // ensure that if due to some peculiar reason user navigates to another path
  // within the same page, we drop the state and re-render everything.
  const sessionID = `${Math.random()}.${Date.now()}`;

  return (
    <Fragment key={sessionID}>
      <div className="App">
        <div>{JSON.stringify(request)}</div>
        <div>
          <RootStep
            step={combineTwoSteps(ConnectToEthereumNetwork, ChooseAccount)}
            input={request}
          />
        </div>
      </div>
    </Fragment>
  );
};

export default pure(Transaction);
