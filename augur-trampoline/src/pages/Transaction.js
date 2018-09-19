// @flow

import React from 'react';
import Grid from 'react-bootstrap/lib/Grid';
import Row from 'react-bootstrap/lib/Row';
import Col from 'react-bootstrap/lib/Col';
import nullthrows from 'nullthrows';
import pure from 'recompose/pure';
import qs from 'qs';
import '../App.css';
import { RootStep, combineTwoSteps } from '../lib/Step';
import type { Request } from '../Request';
import ChooseAccount from '../steps/ChooseAccount';
import ConnectToEthereumNetwork from '../steps/ConnectToEthereumNetwork';
import DisplayMarketData from '../steps/DisplayMarketData';

const networkNameToID = {
  Rinkeby: '4',
  mainnet: '1',
};

const Transaction = ({ match }: { match: * }) => {
  const networkID =
    networkNameToID[match.params.network] != null
      ? networkNameToID[match.params.network]
      : match.params.network;
  const { market, outcome, action, queryparams } = match.params;
  const { amount, price, redirect, creationTX } = qs.parse(queryparams);

  const request: Request = {
    networkID,
    market,
    creationTX: nullthrows(creationTX),
    outcome,
    action,
    amount: nullthrows(amount),
    price: nullthrows(price),
    redirect: nullthrows(redirect),
  };

  // ensure that if due to some peculiar reason user navigates to another path
  // within the same page, we drop the state and re-render everything.
  const sessionID = `${Math.random()}.${Date.now()}`;

  // TODO: add banner if we are not on mainnet
  return (
    <Grid key={sessionID}>
      <Row>
        <Col>
          <div>{JSON.stringify(request)}</div>
          <div>
            <RootStep
              // Steps to place a trade:
              // 1. Connect to Ethereum network
              // 2. Choose account
              // 3. Fetch data and display it to user
              // 4. Sign
              // 5. Send transaction and wait for confirmation
              // 6. Redirect back
              step={combineTwoSteps(
                combineTwoSteps(ConnectToEthereumNetwork, ChooseAccount),
                DisplayMarketData,
              )}
              input={request}
            />
          </div>
        </Col>
      </Row>
    </Grid>
  );
};

export default pure(Transaction);
