// @flow

import { Map as ImmMap } from 'immutable';
import nullthrows from 'nullthrows';
import qs from 'qs';
import type { Request } from './type';

const ROUTER_PATH = '/:network/:market/:outcome/:action/:queryparams';

const networkNameToID = {
  Rinkeby: '4',
  mainnet: '1',
};

function fromRouterMatch(match: *): Request {
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
  return request;
}

function toRouterPath(request: Request): string {
  const query_params = qs.stringify({
    amount: request.amount,
    price: request.price,
    redirect: request.redirect,
    creationTX: request.creationTX,
  });

  return `/${ImmMap(networkNameToID)
    .flip()
    .get(request.networkID, request.networkID)}/${request.market}/${
    request.outcome
  }/${request.action}/${query_params}`;
}

export { ROUTER_PATH, fromRouterMatch, toRouterPath };
