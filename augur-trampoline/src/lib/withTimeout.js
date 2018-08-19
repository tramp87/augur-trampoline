// @flow

function withTimeout<T>(ms: number, f: () => Promise<T>): Promise<T> {
  return new Promise(function(resolve, reject) {
    const timer = window.setTimeout(() => reject(new Error('timed out')), ms);

    f()
      .then(function(res) {
        clearTimeout(timer);
        resolve(res);
      })
      .catch(function(err) {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default withTimeout;
