// @flow

import React from 'react';

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
    return (
      <div>{this.state.data == null ? 'Loading...' : this.state.data}</div>
    );
  }
}

export default TestMarketDetails;
