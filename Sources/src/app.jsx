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
import { connectTrips } from './store/stop/connect.js';
import './store/stop/processManager.js';
import './store/trip/processManager.js';
import './store/history/processManager.js';
import './store/tripsStates/processManager.js';
import { connectTrip } from './store/trip/connect.js';
import { connectWithTripState } from './store/tripsStates/connect.js';

import { initializeStore } from './infrastructure/reduxActionBus.js';
import { publish as publishEvent } from './infrastructure/eventBus.js';
import { events } from './store/events.js';

// store initialization
const store = initializeStore(combineReducers({
  history: historyReducer,
  tripsStates: tripsStatesReducer
}));

// connect containers
const ConnectedTrips = connectTrips(Trips);
const ConnectedTrip = connectTrip(connectWithTripState(Trip));

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
