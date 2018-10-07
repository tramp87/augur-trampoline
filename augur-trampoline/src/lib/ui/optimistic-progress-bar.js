// @flow

import React, { Component } from 'react';
import ProgressBar from 'react-bootstrap/lib/ProgressBar';

export type Props = {|
  expectedTimeSeconds: number,
  error: boolean,
|};

export type State = {|
  startTime: number,
  now: number,
|};

class OptimisticProgressBar extends Component<Props, State> {
  state: State;
  clear: ?() => void;

  constructor(props: Props) {
    super(props);
    this.state = { startTime: Date.now(), now: Date.now() };
    this.clear = null;
  }

  componentDidMount() {
    const interval = setInterval(() => this.setState({ now: Date.now() }), 500);
    this.clear = () => clearInterval(interval);
  }

  componentWillUnmount() {
    if (this.clear != null) {
      this.clear();
      this.clear = null;
    }
  }

  render() {
    const timeElapsed = (this.state.now - this.state.startTime) / 1000;
    // since we are optimistic, increase progress a bit,
    // to make progress bar be non-empty even at the beginning
    const optimisticProgress =
      (timeElapsed + this.props.expectedTimeSeconds * 0.01) /
      this.props.expectedTimeSeconds;

    // some neat function to bring 0 -> 0, 1 -> 0.75, +inf -> 1.0
    const displayedProgress = 1 - 1 / (3 * optimisticProgress + 1);

    return (
      <ProgressBar
        active
        now={displayedProgress}
        min={0}
        max={1}
        bsStyle={this.props.error ? 'danger' : 'info'}
      />
    );
  }
}

export default OptimisticProgressBar;
