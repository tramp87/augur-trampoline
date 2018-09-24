// @flow

import React from 'react';
import nullthrows from 'nullthrows';
import BigNumber from 'bignumber.js';
import Label from 'react-bootstrap/lib/Label';

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
    const style = nullthrows(['danger', 'success'][index]);
    return <Label bsStyle={style}>{nullthrows(['NO', 'YES'][index])}</Label>;
  } else if (marketType.toNumber() === 1) {
    // categorical
    return <Label bsStyle="primary">{nullthrows(outcomes[index])}</Label>;
  } else if (marketType.toNumber() === 2) {
    // scalar
    return nullthrows(
      [
        <Label bsStyle="danger">
          {minPrice.times(new BigNumber('1e-18')).toString()}{' '}
          {nullthrows(scalarDenomination)}
        </Label>,
        <Label bsStyle="success">
          {maxPrice.times(new BigNumber('1e-18')).toString()}{' '}
          {nullthrows(scalarDenomination)}
        </Label>,
      ][index],
    );
  }

  throw new Error(`Unknown market type ${marketType}`);
};

export default Outcome;
