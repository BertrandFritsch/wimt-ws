import React from 'react';
import ReactDOM from 'react-dom';
import saga from 'redux-saga';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import reducers from './store/reducers.js';
import RouteSelector from './components/RouteSelector/RouteSelector';
import { connectWithRouteSelector } from './store/routeSelector.js';
import Trips from './components/Trips/Trips';
import Trip from './components/Trip/Trip';
import { connectTrips, sagas as stopSagas, actions as stopActions, creationEvent as stopCreationEvent, updateEvent as stopUpdateEvent } from './store/stop.js';
import { connectTrip, sagas as tripSagas, actions as tripActions, creationEvent as tripCreationEvent, updateEvent as tripUpdateEvent } from './store/trip.js';
import { registerCreationEvents as registerHistoryCreationEvents, registerUpdateEvents as registerHistoryUpdateEvents, actions as historyActions, sagas as historySagas } from './store/history.js';
import { connectWithTripState } from './store/tripsStates.js';
import SNCFData from './SNCFData.js';

const loggerMiddleware = createLogger();

const createStoreWithMiddleware = applyMiddleware(
  saga(historySagas, stopSagas, tripSagas), // lets run sagas
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

function checkValidTrip(tripId) {
  if (!SNCFData.getTripById(tripId)) {
    console.warn(`The trip id '${tripId}' is invalid!`);
  }
  else {
    return tripId;
  }
}

function parseValidTimeOrNow(timeStr) {
  if (timeStr) {
    const time = parseInt(timeStr),
          date = new Date(time);

    if (time !== date.getTime()) {
      console.warn(`The time '${time}' is invalid!`);
    }
    else {
      return time;
    }
  }

  return Date.now();
}

// routes
// list the kind of supported history steps
const None = Symbol();
const routeMappings = [
      {
        regexUrl: /\/stop\/(\d+)(\/arrival\/(\d+))?/,
        navigateTo: ([ , departureStop, , arrivalStop ]) => store.dispatch(stopActions.navigateToStop(departureStop && checkValidStop(departureStop), arrivalStop && checkValidStop(arrivalStop), new Date())),
        test: step => step.get('departureStop', None) !== None || step.get('arrivalStop', None) !== None, // stop step detection
        component: ConnectedTrips
      },

      {
        regexUrl: /\/trip\/(.+?)(\/date\/(\d+))?$/,
        navigateTo: ([ , tripId, , time ]) => store.dispatch(tripActions.navigateToTrip(tripId && checkValidTrip(tripId), parseValidTimeOrNow(time))),
        test: step => step.get('trip', None) !== None, // trip step detection
        component: ConnectedTrip
      }
];

const ConnectedRouteSelector = connectWithRouteSelector(routeMappings, RouteSelector);

// route detection
const url = window.location.hash.substring(1);
const route = routeMappings.find(route => route.regexUrl.test(url));
if (route) {
  store.dispatch(route.navigateTo(route.regexUrl.exec(url) || []));
}
else {
  console.warn(`'${url}' does not match any route!`);
}

ReactDOM.render(
  <Provider store={store}>
    <Main>
      <ConnectedRouteSelector />
    </Main>
  </Provider>,
  document.getElementById('main-container')
);

GridLayout.initialize();
