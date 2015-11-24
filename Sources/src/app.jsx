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
  let hs = document.location.hash ? document.location.hash.substr(1).split('&').reduce((r, t) => {
    let q = t.split('=');
    r[q[0]] = q[1];
    return r;
  }, {}) : {};

  if (hs.trip) {
    if (SNCFData.getTrip(hs.trip)) {
      let date = new Date();
      if (hs.date) {
        let date2 = new Date(parseInt(hs.date));
        if (!isNaN(date2.getTime())) {
          date = date2;
        }
        else {
          console.warn(String.format("The date '{0}' is invalid!", hs.date));
        }
      }
      store.dispatch(viewTrip(hs.trip, date));
    }
    else {
      console.warn(String.format("The trip id '{0}' is invalid!", hs.trip));
    }
  }
}
