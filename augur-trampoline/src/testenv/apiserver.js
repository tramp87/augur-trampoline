// @flow

/*
 * Used to have API access to test Ethereum RPC, and to addresses of test
 * Augur contracts.
 */

import express from 'express';
import proxy from 'http-proxy-middleware';
import { TESTRPC_HTTP_URL, AUGUR_CONTRACTS_URL } from './env';
import create_test_markets from './create_test_markets';

const testMarketsPromise = create_test_markets();

const app = express();
const port = 4000;

const ethProxy = proxy('/api/eth', {
  target: TESTRPC_HTTP_URL,
  pathRewrite: {
    '^/api/eth': '',
  },
});

app.use('/api/eth', ethProxy);

const contractsProxy = proxy('/api/contracts', {
  target: AUGUR_CONTRACTS_URL,
  pathRewrite: {
    '^/api/contracts': '',
  },
});

app.use('/api/contracts', contractsProxy);

app.get('/api/test_markets', async (req, res) => {
  const testMarkets = await testMarketsPromise;
  res.send(JSON.stringify(testMarkets));
});

process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
    process.exit(1);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });

app.listen(port, () => console.log(`API listening on port ${port}!`));
