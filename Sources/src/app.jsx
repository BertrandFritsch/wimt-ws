import React from 'react';
import ReactDOM from 'react-dom';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import reducers from './reducers/reducers.js';
import SNCFData from './SNCFData';
import { viewStop, viewTrip, viewLine } from './actions/actions.js';
import createHistory from 'history/lib/createBrowserHistory';
import { syncReduxAndRouter } from 'redux-simple-router';
import { Router, IndexRoute, Route } from 'react-router';
import Trips from './components/Trips/Trips';
import Line from './components/Line/Line';
import Trip from './components/Trip/Trip';

const loggerMiddleware = createLogger();

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware, // lets us dispatch() functions
  loggerMiddleware // neat middleware that logs actions
)(createStore);

const store = createStoreWithMiddleware(reducers);
const history = createHistory();
syncReduxAndRouter(history, store);

function enterTrips(nextState) {
  var debug = true;
}

function leaveTrips() {
  var debug = true;
}

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <Route path="/" component={Main}>
        <Route path="stop/:departureStop(/arrival/:arrivalStop)" component={Trips} onEnter={enterTrips} onLeave={leaveTrips} />
        <Route path="line" component={Line} />
        <Route path="trip" component={Trip} />
        <IndexRoute component={Trips} onEnter={enterTrips} onLeave={leaveTrips} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main-container')
);
GridLayout.initialize();
