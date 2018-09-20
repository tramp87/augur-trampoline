// @flow

import React from 'react';
import { Map as ImmMap } from 'immutable';

type Props = {};
type State = { data: ?string };

class TestMarketDetails extends React.Component<Props, State> {
  state: State;
  _mounted: boolean;

  constructor(props: Props) {
    super(props);
    this.state = { data: null };
    this._mounted = false;
  }

  componentDidMount() {
    this._mounted = true;

    this.run().then(data => {
      if (this._mounted) {
        this.setState({ data });
      }
    });
  }

  async run() {
    try {
      const json = await fetch('/api/test_markets').then(response =>
        response.json(),
      );
      return JSON.stringify(json);
    } catch (e) {
      console.error(e);
      return e.toString();
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    const dataS = this.state.data;

    if (dataS == null) {
      return <span>Loading...</span>;
    }

    const data = JSON.parse(dataS);

    return (
      <ul>
        <li>Network ID: {data.network}</li>
        <li>
          <ol>
            {ImmMap(data.markets)
              .entrySeq()
              .sort()
              .map(([name, details]) => (
                <li key={name}>
                  <b>{name}</b>: {JSON.stringify(details)}
                </li>
              ))}
          </ol>
        </li>
      </ul>
    );
  }
}

export default TestMarketDetails;
