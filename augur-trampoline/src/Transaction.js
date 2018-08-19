// @flow

import React from 'react';
import './App.css';
import nullthrows from 'nullthrows';

const networks = {
  Rinkeby: 4,
  mainnet: 1,
};

const Transaction = ({ match }: { match: * }) => {
  const networkID = nullthrows(networks[match.params.network]);
  return (
    <div className="App">
      {JSON.stringify({ networkID, params: match.params })}
    </div>
  );
};

export default Transaction;
