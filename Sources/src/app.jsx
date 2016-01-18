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
import Trip from './components/Trip/Trip';
import { connectTrips, sagas as stopSagas, actions as stopActions, creationEvent as stopCreationEvent, updateEvent as stopUpdateEvent } from './store/stop.js';
import { connectTrip, sagas as tripSagas, actions as tripActions, creationEvent as tripCreationEvent, updateEvent as tripUpdateEvent } from './store/trip.js';
import { registerCreationEvents as registerHistoryCreationEvents, registerUpdateEvents as registerHistoryUpdateEvents } from './store/history.js';
import { connectWithTripState } from './store/tripsStates.js';
import SNCFData from './SNCFData.js';

const loggerMiddleware = createLogger();

const createStoreWithMiddleware = applyMiddleware(
  saga(stopSagas, tripSagas), // lets run sagas
  loggerMiddleware // neat middleware that logs actions
)(createStore);

const store = window.store = createStoreWithMiddleware(reducers);

// navigation creation events
registerHistoryCreationEvents([ stopCreationEvent, tripCreationEvent ]);
registerHistoryUpdateEvents([ stopUpdateEvent, tripUpdateEvent ]);

// connect containers
const ConnectedTrips = connectTrips(Trips);
const ConnectedTrip = connectTrip(connectWithTripState(Trip));

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

function checkValidTrip(tripId) {
  if (!SNCFData.getTripById(tripId)) {
    console.warn(`The trip id '${tripId}' is invalid!`);
  }
  else {
    return tripId;
  }
}

function navigateToTrip(nextState) {
  const tripId = checkValidTrip(nextState.params.tripId),
        time = nextState.params.time || Date.now();

  store.dispatch(tripActions.navigateToTrip(tripId, time, { history: nextState.location.key }));
}

// routes
// list the kind of supported history steps
const None = Symbol();
const routeMappings = [
      {
        test: step => step.get('departureStop', None) !== None || step.get('arrivalStop', None) !== None, // stop step detection
        component: ConnectedTrips
      },

      {
        test: step => step.get('trip', None) !== None, // trip step detection
        component: ConnectedTrip
      }
];

const ConnectedRouteSelector = connectWithRouteSelector(routeMappings, RouteSelector);

ReactDOM.render(
  <Provider store={store}>
    <Router history={hashHistory}>
      <Route path="/" component={Main}>
        <Route path="/stop/:departureStop(/arrival/:arrivalStop)" component={ConnectedRouteSelector} onEnter={navigateToStop} />
        <Route path="line" component={ConnectedRouteSelector} />
        <Route path="/trip/:tripId(/date/:time)" component={ConnectedRouteSelector} onEnter={navigateToTrip} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('main-container')
);

GridLayout.initialize();
