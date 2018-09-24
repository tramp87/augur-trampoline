// @flow

import nullthrows from 'nullthrows';
import BigNumber from 'bignumber.js';

const Outcome = ({
  marketType,
  outcomes,
  index,
  minPrice,
  maxPrice,
  scalarDenomination,
}: {
  marketType: BigNumber,
  outcomes: Array<string>,
  index: number,
  minPrice: BigNumber,
  maxPrice: BigNumber,
  scalarDenomination: ?string,
}) => {
  if (marketType.toNumber() === 0) {
    // binary
    return `[${nullthrows(['NO', 'YES'][index])}]`;
  } else if (marketType.toNumber() === 1) {
    // categorical
    return `[${nullthrows(outcomes[index])}]`;
  } else if (marketType.toNumber() === 2) {
    // scalar
    return nullthrows(
      [
        `[DOWN ${minPrice.times(new BigNumber('1e-18'))} ${nullthrows(
          scalarDenomination,
        )}]`,
        `[UP ${maxPrice.times(new BigNumber('1e-18'))} ${nullthrows(
          scalarDenomination,
        )}]`,
      ][index],
    );
  }

  throw new Error(`Unknown market type ${marketType}`);
};

export default Outcome;
