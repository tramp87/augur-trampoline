// @flow

import React from 'react';
import Button from 'react-bootstrap/lib/Button';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button bsSize="small" onClick={onClick} title="Retry">
      <Glyphicon glyph="refresh" />
    </Button>
  );
}

function ConfigureButton({ onClick }: { onClick: () => void }) {
  return (
    <Button bsSize="small" onClick={onClick} title="Configure">
      <Glyphicon glyph="cog" />
    </Button>
  );
}

function LogButton({ onClick, ...props }: { onClick: () => void }) {
  return (
    <Button bsSize="small" onClick={onClick} title="View logs" {...props}>
      <Glyphicon glyph="list-alt" />
    </Button>
  );
}

export { RetryButton, ConfigureButton, LogButton };
