// @flow
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import nullthrows from 'nullthrows';

ReactDOM.render(<App />, nullthrows(document.getElementById('root')));
