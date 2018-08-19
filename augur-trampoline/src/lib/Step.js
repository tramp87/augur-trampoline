// @flow

import invariant from 'invariant';
import React, { PureComponent, Fragment } from 'react';
import type { Node } from 'react';
import isEqualShallow from 'is-equal-shallow';

// Process of placing trade consists of many inter-dependent steps
// (i.e. connecting to Ethereum network, choosing account, signing tx, ...)
// Mini-framework in this file helps organize those steps and dependencies
// between them.

// each step has output, which is consumed by next steps
export type StepOutput<Result> =
  | {| state: 'ready', result: Result |}
  | {| state: 'not ready' |};

// steps exports its output and whether it is in exclusive state
export type StepExternalState<Result> = {|
  // if the step is done, next step is unblocked
  // and receives the result of this step
  output: StepOutput<Result>,
  // if the step is in "exclusive" state, meaning it wants to avoid
  // any interference, all other steps
  // become immutable until step leaves exclusive state
  exclusive: boolean,
|};

function getInitialExternalStateForStep<Result>(): StepExternalState<Result> {
  return {
    output: {
      state: 'not ready',
    },
    exclusive: false,
  };
}

// Props for a step to be rendered
// Step can assume only `immutable` prop will change during its lifetime.
// If other props change, step will be destroyed and created anew.
export type StepProps<TInput, TOutput> = {|
  // indicates that the user should not be allowed to make any changes
  // in this step, as another step is currently in exclusive state
  immutable: boolean,
  input: TInput,
  // called whenever external state of this step changes
  onMutation: (StepExternalState<TOutput>) => void,
|};

// Finally a step is a function from props into React node.
// Functional component if you wish.
export type Step<TInput, TOutput> = (StepProps<TInput, TOutput>) => Node;

// main building blocks, can be used to combine all steps in the sequence
function combineTwoSteps<TInput, TMiddle, TOutput>(
  step1: Step<TInput, TMiddle>,
  step2: Step<TMiddle, TOutput>,
): Step<TInput, TOutput> {
  return (props: StepProps<TInput, TOutput>): Node => {
    return <TwoStepsCombiner step1={step1} step2={step2} {...props} />;
  };
}

type TwoStepsCombinerProps<TInput, TMiddle, TOutput> = {|
  ...StepProps<TInput, TOutput>,
  step1: Step<TInput, TMiddle>,
  step2: Step<TMiddle, TOutput>,
|};

type TwoStepsCombinerState<TMiddle, TOutput> = {|
  step1State: StepExternalState<TMiddle>,

  // step2 moves into next epoch whenever output of step1 changes
  step2Epoch: number,

  step2State: StepExternalState<TOutput>,
|};

/**
 * Combines two steps into a single step.
 *
 * To make state management easier for individual steps, it uses `key`
 * property to ensure that subsequent step is completely destroyed and
 * re-initialized whenever input state changes.
 *
 * So each individual step may assume that all properties except
 * `immutable` are constant throughout its lifetime.
 */
class TwoStepsCombiner<TInput, TMiddle, TOutput> extends PureComponent<
  TwoStepsCombinerProps<TInput, TMiddle, TOutput>,
  TwoStepsCombinerState<TMiddle, TOutput>,
> {
  state: TwoStepsCombinerState<TMiddle, TOutput>;
  _onStep1Mutation: (StepExternalState<TMiddle>) => void;
  _onStep2Mutation: (StepExternalState<TOutput>) => void;

  constructor(props: TwoStepsCombinerProps<TInput, TMiddle, TOutput>) {
    super(props);

    this._onStep1Mutation = newState => this.onStep1Mutation(newState);
    this._onStep2Mutation = newState => this.onStep2Mutation(newState);
    this.state = {
      step1State: getInitialExternalStateForStep(),
      step2Epoch: 0,
      step2State: getInitialExternalStateForStep(),
    };
  }

  componentDidUpdate(
    prevProps: TwoStepsCombinerProps<TInput, TMiddle, TOutput>,
  ) {
    invariant(
      this.props.step1 === prevProps.step1 &&
        this.props.step2 === prevProps.step2 &&
        this.props.onMutation === prevProps.onMutation &&
        this.props.input === prevProps.input,
      'These props are not supported to be updated dynamically. ' +
        'If this happened, it indicates a serious bug. ' +
        'Parent component should have updated our key in this case.',
    );
    // alternatively we could reset our state and update our own epoch
    // if such thing happens
  }

  render() {
    const element1 = this.props.step1({
      immutable: this.props.immutable,
      input: this.props.input,
      onMutation: this._onStep1Mutation,
    });

    const element2 =
      this.state.step1State.output.state === 'ready' ? (
        this.props.step2({
          immutable: this.props.immutable,
          input: this.state.step1State.output.result,
          onMutation: this._onStep2Mutation,
        })
      ) : (
        <Fragment />
      );

    return (
      <Fragment>
        {element1}
        <Fragment key={`${this.state.step2Epoch}`}>{element2}</Fragment>
      </Fragment>
    );
  }

  onStep1Mutation(newState: StepExternalState<TMiddle>): void {
    const oldState = this.state.step1State;
    if (isEqualShallow(oldState, newState)) {
      return;
    }

    this.setState({ step1State: newState });

    let newStep2State = this.state.step2State;
    if (!isEqualShallow(newState.output, oldState.output)) {
      this.setState(({ step2Epoch }) => ({ step2Epoch: step2Epoch + 1 }));
      newStep2State = getInitialExternalStateForStep();
      this.setState({ step2State: newStep2State });
    }

    this.props.onMutation({
      ...newStep2State,
      exclusive: newStep2State.exclusive || newState.exclusive,
    });
  }

  onStep2Mutation(newState: StepExternalState<TOutput>): void {
    const oldState = this.state.step2State;
    if (isEqualShallow(oldState, newState)) {
      return;
    }

    this.setState({ step2State: newState });
    this.props.onMutation({
      ...newState,
      exclusive: this.state.step1State.exclusive || newState.exclusive,
    });
  }
}

type RootStepProps<Input, Output> = {|
  input: Input,
  step: Step<Input, Output>,
|};
type RootStepState = {|
  immutable: boolean,
|};

class RootStep<Input, Output> extends PureComponent<
  RootStepProps<Input, Output>,
  RootStepState,
> {
  state: RootStepState;
  _onMutation: (StepExternalState<Output>) => void;

  constructor(props: RootStepProps<Input, Output>) {
    super(props);
    this.state = {
      immutable: false,
    };
    this._onMutation = ({ exclusive }) =>
      this.setState({
        immutable: exclusive,
      });
  }

  componentDidUpdate(prevProps: RootStepProps<Input, Output>) {
    invariant(
      this.props.step === prevProps.step &&
        this.props.input === prevProps.input,
      'These props are not supported to be updated dynamically. ' +
        'If this happened, it indicates a serious bug. ' +
        'Parent component should have updated our key in this case.',
    );
  }

  render() {
    return this.props.step({
      immutable: this.state.immutable,
      input: this.props.input,
      onMutation: this._onMutation,
    });
  }
}

export { combineTwoSteps, RootStep };
