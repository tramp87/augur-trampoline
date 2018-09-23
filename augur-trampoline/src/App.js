// @flow

import React from 'react';
import HashRouter from 'react-router-dom/HashRouter';
import Route from 'react-router-dom/Route';
import Switch from 'react-router-dom/Switch';
import Home from './pages/Home';
import Transaction from './pages/Transaction';
import { ROUTER_PATH } from './request';

const NoMatch = () => <div className="App">404</div>;

const App = () => (
  <HashRouter>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route exact path={ROUTER_PATH} component={Transaction} />
      <Route component={NoMatch} />
    </Switch>
  </HashRouter>
);

export default App;
