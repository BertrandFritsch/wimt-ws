import React from 'react';
import ReactDOM from 'react-dom';
import { combineReducers } from 'redux';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import { Provider } from 'react-redux';
import { reducer as historyReducer } from './model/history/reducer.js';
import { reducer as tripsStatesReducer } from './model/tripsStates/reducer.js';
import RouteSelector from './components/RouteSelector/RouteSelector';
import { connectWithRouteSelector } from './model/routeSelector.js';
import Trips from './components/Trips/Trips';
import Line from './components/Line/Line.jsx';
import Trip from './components/Trip/Trip';
import { connectTrips } from './model/stop/connect.js';
import './model/stop/processManager.js';
import './model/trip/processManager.js';
import './model/history/processManager.js';
import './model/tripsStates/processManager.js';
import { connectTrip } from './model/trip/connect.js';
import { connectWithTripState } from './model/tripsStates/connect.js';

import { initializeStore } from './infrastructure/reduxActionBus.js';
import { publish as publishEvent } from './infrastructure/eventBus.js';
import { events } from './model/events.js';

// store initialization
const store = initializeStore(combineReducers({
  history: historyReducer,
  tripsStates: tripsStatesReducer
}));

// connect containers
const ConnectedTrips = connectTrips(Trips);
const ConnectedLine = connectTrips(Line);
const ConnectedTrip = connectTrip(connectWithTripState(Trip));

// routes
// list the kind of supported history steps
const None = Symbol();
const routeMappings = [
      {
        test: step => step.get('viewType', None) === 'stop', // stop step detection
        component: ConnectedTrips
      },

      {
        test: step => step.get('viewType', None) === 'line', // line step detection
        component: ConnectedLine
      },

      {
        test: step => step.get('trip', None) !== None, // trip step detection
        component: ConnectedTrip
      }
];

const ConnectedRouteSelector = connectWithRouteSelector(routeMappings, RouteSelector);

publishEvent({ type: events.INITIAL_NAVIGATION_COMPLETED, data: { url: window.location.hash ? window.location.href : `${ window.location.href }#/line/87382887/arrival/87382218` } });

ReactDOM.render(
  <Provider store={store}>
    <Main>
      <ConnectedRouteSelector />
    </Main>
  </Provider>,
  document.getElementById('main-container')
);

GridLayout.initialize();
