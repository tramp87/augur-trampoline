// @flow

import React from 'react';
import nullthrows from 'nullthrows';
import BigNumber from 'bignumber.js';
import Label from 'react-bootstrap/lib/Label';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Amount from './Amount';

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
          <Glyphicon glyph={'arrow-down'} />{' '}
          <Amount amount={minPrice.times(new BigNumber('1e-18'))} />{' '}
          {nullthrows(scalarDenomination)}
        </Label>,
        <Label bsStyle="success">
          <Glyphicon glyph={'arrow-up'} />{' '}
          <Amount amount={maxPrice.times(new BigNumber('1e-18'))} />{' '}
          {nullthrows(scalarDenomination)}
        </Label>,
      ][index],
    );
  }

  throw new Error(`Unknown market type ${marketType}`);
};

export default Outcome;
