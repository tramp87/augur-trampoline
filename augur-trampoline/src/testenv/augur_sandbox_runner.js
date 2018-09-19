// @flow

// we run Augur inside JSDOM to ensure clean shutdown

import nullthrows from 'nullthrows';
import Augur from 'augur.js';
import { TESTRPC_WS_URL } from './env';

async function run(func: *, params: *): Promise<*> {
  const augur = new Augur();
  await new Promise((resolve, reject) =>
    augur.connect(
      {
        ethereumNode: { ws: TESTRPC_WS_URL },
        augurNode: null,
      },
      (err, connectionInfo) =>
        err != null ? reject(err) : resolve(connectionInfo),
    ),
  );
  return await new Promise((resolve, reject) =>
    func(augur)({
      ...params,
      onSuccess: result => resolve(result),
      onFailed: e => reject(e),
    }),
  );
}

window.AUGUR_SANDBOX_RUNNER_PROMISE = run(
  nullthrows(window.AUGUR_SANDBOX_RUNNER_FUNC),
  nullthrows(window.AUGUR_SANDBOX_RUNNER_PARAMS),
);
