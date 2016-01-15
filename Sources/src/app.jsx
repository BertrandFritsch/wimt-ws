import React from 'react';
import ReactDOM from 'react-dom';
import saga from 'redux-saga';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import reducers from './store/reducers.js';
import { hashHistory, Router, Route } from 'react-router';
import RouteSelector from './components/RouteSelector/RouteSelector';
import { connectWithRouteSelector } from './store/routeSelector.js';
import Trips from './components/Trips/Trips';
import { connectTrips, sagas as stopSagas, actions as stopActions, creationEvent as stopCreationEvent, updateEvent as stopUpdateEvent } from './store/stop.js';
import { registerCreationEvents as registerHistoryCreationEvents, registerUpdateEvents as registerHistoryUpdateEvents } from './store/history.js';
import SNCFData from './SNCFData.js';

const loggerMiddleware = createLogger();

const createStoreWithMiddleware = applyMiddleware(
  saga(stopSagas), // lets run sagas
  loggerMiddleware // neat middleware that logs actions
)(createStore);

const store = window.store = createStoreWithMiddleware(reducers);

// navigation creation events
registerHistoryCreationEvents([ stopCreationEvent ]);
registerHistoryUpdateEvents([ stopUpdateEvent ]);

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
  const departureStop = nextState.params.departureStop && checkValidStop(nextState.params.departureStop),
        arrivalStop = nextState.params.arrivalStop && checkValidStop(nextState.params.arrivalStop);

  store.dispatch(stopActions.navigateToStop(departureStop, arrivalStop, new Date(), { history: nextState.location.key }));
}

// routes
// list the kind of supported history steps
const None = Symbol();
const routeMappings = [
      {
        test: step => step.get('departureStop', None) !== None || step.get('arrivalStop', None) !== None, // stop step detection
        component: ConnectedTrips
      }
];

const ConnectedRouteSelector = connectWithRouteSelector(routeMappings, RouteSelector);

ReactDOM.render(
  <Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/" component={Main}>
        <Route path="/stop/:departureStop(/arrival/:arrivalStop)" component={ConnectedRouteSelector} onEnter={navigateToStop} />
        <Route path="line" component={ConnectedRouteSelector} />
        <Route path="trip" component={ConnectedRouteSelector} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main-container')
);

GridLayout.initialize();
