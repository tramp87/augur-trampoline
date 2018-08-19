// @flow

export type Request = {|
  networkID: string,
  market: string,
  outcome: string,
  action: 'buy' | 'sell',
  amount: string,
  price: string,
  redirect: string,
|};
