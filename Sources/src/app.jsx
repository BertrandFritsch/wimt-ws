import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers } from 'redux';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import { Provider } from 'react-redux';
import { reducer as historyReducer } from './store/history/reducers.js';
import { reducer as tripsStatesReducer } from './store/tripsStates/reducers.js';
import RouteSelector from './components/RouteSelector/RouteSelector';
import { connectWithRouteSelector } from './store/routeSelector.js';
import Trips from './components/Trips/Trips';
import Trip from './components/Trip/Trip';
import { actions as stopActions, creationEvent as stopCreationEvent, updateEvent as stopUpdateEvent } from './store/stop/aggregate.js';
import { connectTrips } from './store/stop/connect.js';
import './store/stop/processManager.js';
import './store/history/processManager.js';
import './store/tripsStates/processManager.js';
import { connectTrip, actions as tripActions, creationEvent as tripCreationEvent, updateEvent as tripUpdateEvent } from './store/trip.js';
import { registerCreationEvents as registerHistoryCreationEvents, registerUpdateEvents as registerHistoryUpdateEvents } from './store/history/aggregate.js';
import { connectWithTripState } from './store/tripsStates/connect.js';
import SNCFData from './SNCFData.js';

import { initializeStore } from './infrastructure/reduxActionBus.js';
import { publish as publishEvent } from './infrastructure/eventBus.js';
import { events } from './store/events.js';

// store initialization
const store = initializeStore(combineReducers({
  history: historyReducer,
  tripsStates: tripsStatesReducer
}));

// navigation creation events
registerHistoryCreationEvents([ stopCreationEvent, tripCreationEvent ]);
registerHistoryUpdateEvents([ stopUpdateEvent, tripUpdateEvent ]);

// connect containers
const ConnectedTrips = connectTrips(Trips);
const ConnectedTrip = connectTrip(connectWithTripState(Trip));

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

publishEvent({ type: events.INITIAL_NAVIGATION_COMPLETED, data: { url: window.location.href } });

ReactDOM.render(
  <Provider store={store}>
    <Main>
      <ConnectedRouteSelector />
    </Main>
  </Provider>,
  document.getElementById('main-container')
);

GridLayout.initialize();
