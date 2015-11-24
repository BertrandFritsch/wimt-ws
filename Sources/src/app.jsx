import React from 'react';
import ReactDOM from 'react-dom';
import ExtendedArray from './extendedArray';
import ExtendedElement from './extendedElement';
import ExtendedString from './extendedString';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import BabelPolyfill from 'babel-polyfill';
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux';
import reducers from './reducers/reducers.js'
import SNCFData from './components/SNCFData';
import { viewTrip } from './actions/actions.js';

const loggerMiddleware = createLogger();

const createStoreWithMiddleware = applyMiddleware(
  thunkMiddleware, // lets us dispatch() functions
  loggerMiddleware // neat middleware that logs actions
)(createStore);

const store = createStoreWithMiddleware(reducers);

parseQueryString(store);

ReactDOM.render(<Provider store={store}><Main /></Provider>, document.getElementById('main-container'));
GridLayout.initialize();

function parseQueryString(store) {
  if (document.location.hash && document.location.hash.match(/(#|&)trip=/)) {
    let matches = /(#|&)trip=(.*?)(&|$)/.exec(document.location.hash);
    if (matches[2]) {
      let trip = SNCFData.getTrip(matches[2]);
      //TODO: report bad trip id
      if (trip) {
        store.dispatch(viewTrip(SNCFData.getTripId(trip)));
      }
    }
  }
}
