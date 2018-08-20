// @flow

import React from 'react';
import Well from 'react-bootstrap/lib/Well';
import pure from 'recompose/pure';

function LogBox({ lines }: { lines: Array<string> }) {
  return (
    <Well>
      {lines.map((line, i) => (
        <div key={`${i}`}>{line}</div>
      ))}
    </Well>
  );
}

export default pure(LogBox);
