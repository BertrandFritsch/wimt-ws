import React from 'react';
import ReactDOM from 'react-dom';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import thunkMiddleware from 'redux-thunk';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import reducers from './store/reducers.js';
import { hashHistory, Router, IndexRoute, Route } from 'react-router';
import Trips from './components/Trips/Trips';
import Line from './components/Line/Line';
import Trip from './components/Trip/Trip';
import { connectTrips, commands as stopCommands } from './store/stop.js';
import { commands as historyCommands } from './store/history.js';
import { commands as tripsStatesCommands } from './store/tripsStates.js';
import SNCFData from './SNCFData.js';

const loggerMiddleware = createLogger();

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware, // lets us dispatch() functions
  loggerMiddleware // neat middleware that logs actions
)(createStore);

const store = createStoreWithMiddleware(reducers);

// initialize domain modules
historyCommands.initializeModule(store);
stopCommands.initializeModule(store);
tripsStatesCommands.initializeModule(store);

// connect containers
const ConnectedTrips = connectTrips(Trips);

function checkValidStop(stopStr) {
  const stop = parseInt(stopStr);
  if (!SNCFData.getStopById(stop)) {
    console.warn(`The stop id '${stopStr}' is invalid!`);
  }
  else {
    return stop;
  }
}

function navigateToStop(nextState) {
  let departureStop = nextState.params.departureStop && checkValidStop(nextState.params.departureStop),
      arrivalStop = nextState.params.arrivalStop && checkValidStop(nextState.params.arrivalStop);

  historyCommands.navigateTo(nextState.location.key, stopCommands.viewStop(departureStop, arrivalStop));
}

ReactDOM.render(
  <Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/" component={Main}>
        <Route path="/stop/:departureStop(/arrival/:arrivalStop)" component={ConnectedTrips} onEnter={navigateToStop} />
        <Route path="line" component={Line} />
        <Route path="trip" component={Trip} />
        <IndexRoute component={Trips} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main-container')
);

GridLayout.initialize();
