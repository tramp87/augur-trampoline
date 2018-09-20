// @flow

export type Addresses = {|
  Augur: string,
  Cash: string,
  // initial universe, the one that is trusted and where users are supposed
  // to trade
  // once fork happens, this will need to be tuned
  Universe: string,
  // TODO: export cash contract address as well
  // to verify denomination
|};
