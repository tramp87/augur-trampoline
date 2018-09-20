// @flow

import React from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import OptimisticProgressBar from '../../lib/ui/optimistic-progress-bar';
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
          <OptimisticProgressBar expectedTimeSeconds={4} />
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

export default MarketDataView;
