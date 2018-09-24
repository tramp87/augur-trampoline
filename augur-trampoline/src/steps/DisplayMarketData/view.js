// @flow

import React, { Component, Fragment } from 'react';
import Panel from 'react-bootstrap/lib/Panel';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
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
        <Button bsStyle="link" onClick={this.toggle} style={{ padding: '0' }}>
          Additional details:{' '}
          <Glyphicon glyph={this.state.collapsed ? 'menu-down' : 'menu-up'} />
        </Button>
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
