// @flow

import React from 'react';
import HashRouter from 'react-router-dom/HashRouter';
import Route from 'react-router-dom/Route';
import Switch from 'react-router-dom/Switch';
import Home from './pages/Home';
import Transaction from './pages/Transaction';

const NoMatch = () => <div className="App">404</div>;

const App = () => (
  <HashRouter>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route
        exact
        path="/:network/:market/:outcome/:action/:queryparams"
        component={Transaction}
      />
      <Route component={NoMatch} />
    </Switch>
  </HashRouter>
);

export default App;
