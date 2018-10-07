// @flow

import React, { Component, Fragment } from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import OptimisticProgressBar from '../../lib/ui/optimistic-progress-bar';
import Outcome from '../../lib/ui/Outcome';
import type { MarketData } from './fetch';

export type MarketDataViewProps = {|
  marketData: ?MarketData,
  havingErrors: boolean,
|};

const MarketDataView = (props: MarketDataViewProps) => {
  const marketData = props.marketData;

  const maybeMakeLink = s =>
    s.startsWith('http://') || s.startsWith('https://') ? (
      <a href={s} target="_blank">
        {s}
      </a>
    ) : (
      s
    );

  const panel =
    marketData == null ? (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">Loading market data...</Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <OptimisticProgressBar
            expectedTimeSeconds={4}
            error={props.havingErrors}
          />
          {props.havingErrors ? (
            <div>
              An error happened while trying to fetch market data. Try again or
              wait a bit.
            </div>
          ) : null}
        </Panel.Body>
      </Panel>
    ) : (
      <Panel>
        <Panel.Heading>
          <Panel.Title componentClass="h3">
            {marketData.description}
          </Panel.Title>
        </Panel.Heading>
        <Panel.Body>
          <p>
            Resolution source:{' '}
            {marketData.resolutionSource !== ''
              ? maybeMakeLink(marketData.resolutionSource)
              : 'General knowledge'}
          </p>
          {marketData.longDescription !== '' ? (
            <div>
              <DetailsCollapsible
                longDescription={marketData.longDescription}
              />
            </div>
          ) : null}
          <p>
            Possible outcomes:{' '}
            {marketData.marketType.toNumber() === 2 ? (
              <span>
                any value between{' '}
                <Outcome
                  marketType={marketData.marketType}
                  outcomes={marketData.outcomes}
                  index={0}
                  minPrice={marketData.minPrice}
                  maxPrice={marketData.maxPrice}
                  scalarDenomination={marketData.scalarDenomination}
                />{' '}
                and{' '}
                <Outcome
                  marketType={marketData.marketType}
                  outcomes={marketData.outcomes}
                  index={1}
                  minPrice={marketData.minPrice}
                  maxPrice={marketData.maxPrice}
                  scalarDenomination={marketData.scalarDenomination}
                />{' '}
                with step of{' '}
                {marketData.maxPrice
                  .minus(marketData.minPrice)
                  .dividedBy('1e18')
                  .dividedBy(marketData.numTicks)
                  .toString()}{' '}
                {marketData.scalarDenomination}.
              </span>
            ) : (
              orize(
                range(marketData.numberOfOutcomes.toNumber()).map(
                  outcomeIndex => (
                    <Outcome
                      marketType={marketData.marketType}
                      outcomes={marketData.outcomes}
                      index={outcomeIndex}
                      minPrice={marketData.minPrice}
                      maxPrice={marketData.maxPrice}
                      scalarDenomination={marketData.scalarDenomination}
                    />
                  ),
                ),
              )
            )}
          </p>
          <p>
            Traded shares:
            <ul style={{ listStyle: 'none' }}>
              {range(marketData.numberOfOutcomes.toNumber()).map(
                outcomeIndex => (
                  <li key={`${outcomeIndex}`}>
                    <Outcome
                      marketType={marketData.marketType}
                      outcomes={marketData.outcomes}
                      index={outcomeIndex}
                      minPrice={marketData.minPrice}
                      maxPrice={marketData.maxPrice}
                      scalarDenomination={marketData.scalarDenomination}
                    />
                    : TBD description
                  </li>
                ),
              )}
            </ul>
          </p>
        </Panel.Body>
      </Panel>
    );

  return (
    <div>
      <div>{JSON.stringify(props)}</div>
      {panel}
    </div>
  );
};

function range(size: number, startAt: number = 0): Array<number> {
  return [...Array(size).keys()].map(i => i + startAt);
}

const orize = a => {
  return (
    <Fragment>
      {a.slice(0, a.length - 1).map((arg, i) => (
        <Fragment key={i}>
          {arg}
          {a.length > 2 ? ',' : ''}{' '}
        </Fragment>
      ))}
      or {a[a.length - 1]}
    </Fragment>
  );
};

class DetailsCollapsible extends Component<*, {| collapsed: boolean |}> {
  state: {| collapsed: boolean |};
  toggle: () => void;

  constructor(props: *) {
    super(props);
    this.state = { collapsed: this.props.longDescription.length > 500 };
    this.toggle = () =>
      this.setState({
        collapsed: !this.state.collapsed,
      });
  }

  render() {
    return (
      <Fragment>
        <p>
          <Button bsStyle="link" onClick={this.toggle} style={{ padding: '0' }}>
            Additional details:{' '}
            <Glyphicon glyph={this.state.collapsed ? 'menu-down' : 'menu-up'} />
          </Button>
        </p>
        {this.state.collapsed ? null : (
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.props.longDescription}
          </pre>
        )}
      </Fragment>
    );
  }
}

export default MarketDataView;
