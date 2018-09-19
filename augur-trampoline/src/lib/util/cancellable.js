// @flow

export type CancelableCallback<T> = {|
  call: T => void,
  cancel: () => void,
|};

const CANCELLABLE_ABORT_MSG =
  'This callback has been canceled. You are no longer needed. Die.';

function cancellable<T>(callback: T => void): CancelableCallback<T> {
  var canceled = false;

  const call = (t: T) => {
    if (canceled) {
      throw Error(CANCELLABLE_ABORT_MSG);
    }
    callback(t);
  };

  const cancel = () => {
    canceled = true;
  };

  return { call, cancel };
}

export { cancellable, CANCELLABLE_ABORT_MSG };
