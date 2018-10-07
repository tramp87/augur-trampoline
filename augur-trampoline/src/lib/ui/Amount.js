// @flow

import BigNumber from 'bignumber.js';

const APPROX_EQUAL_TO = '\u2248';

const Amount = ({ amount }: { amount: BigNumber }) => {
  const readable = new BigNumber(amount.toPrecision(5));
  if (readable.equals(amount)) {
    return readable.toString();
  } else {
    return `${APPROX_EQUAL_TO}${readable.toString()}`;
  }
};

export default Amount;
