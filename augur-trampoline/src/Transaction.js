// @flow

import React from 'react';
import './App.css';
import nullthrows from 'nullthrows';

const networks = {
  Rinkeby: 4,
  mainnet: 1,
};

// Steps here:
// 1. Connect to Ethereum network
// 2. Choose account
// 3. Fetch data and display it to user
// 4. Sign
// 5. Send transaction and wait for confirmation
// 6. Redirect back

const Transaction = ({ match }: { match: * }) => {
  const networkID = nullthrows(networks[match.params.network]);
  return (
    <div className="App">
      {JSON.stringify({ networkID, params: match.params })}
    </div>
  );
};

export default Transaction;
