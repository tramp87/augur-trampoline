// @flow
import nullthrows from 'nullthrows';
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

ReactDOM.render(<App />, nullthrows(document.getElementById('root')));
