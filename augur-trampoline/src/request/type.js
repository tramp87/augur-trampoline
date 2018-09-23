// @flow

export type Request = {|
  networkID: string,
  market: string,
  creationTX: string,
  outcome: string,
  action: 'buy' | 'sell',
  amount: string,
  price: string,
  redirect: string,
|};
