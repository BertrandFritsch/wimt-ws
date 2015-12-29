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

  let departureStop = hs.departureStop && (_ => {
      let stop = parseInt(hs.departureStop);
      if (!SNCFData.getStopById(stop)) {
        console.warn(`The stop id '${hs.departureStop}' is invalid!`);
      }
      else {
        return stop;
      }
    })();
  let arrivalStop = hs.arrivalStop && (_ => {
      let stop = parseInt(hs.arrivalStop);
      if (!SNCFData.getStopById(stop)) {
        console.warn(`The stop id '${hs.arrivalStop}' is invalid!`);
      }
      else {
        return stop;
      }
    })();

  if (departureStop && arrivalStop) {
    store.dispatch(viewStop(departureStop, arrivalStop));
  }
  else if (departureStop) {
    store.dispatch(viewStop(departureStop));
  }
  else if (arrivalStop) {
    store.dispatch(viewStop(null, arrivalStop));
  }

  let departureStopLine = hs.departureStopLine && (_ => {
      let stop = parseInt(hs.departureStopLine);
      if (!SNCFData.getStopById(stop)) {
        console.warn(`The stop id '${hs.departureStopLine}' is invalid!`);
      }
      else {
        return stop;
      }
    })();
  let arrivalStopLine = hs.arrivalStopLine && (_ => {
      let stop = parseInt(hs.arrivalStopLine);
      if (!SNCFData.getStopById(stop)) {
        console.warn(`The stop id '${hs.arrivalStopLine}' is invalid!`);
      }
      else {
        return stop;
      }
    })();

  if (departureStopLine && arrivalStopLine) {
    store.dispatch(viewLine(departureStopLine, arrivalStopLine));
  }
  else if (departureStopLine) {
    store.dispatch(viewLine(departureStopLine));
  }
  else if (arrivalStopLine) {
    store.dispatch(viewLine(null, arrivalStopLine));
  }

  if (hs.trip) {
    if (SNCFData.getTripById(hs.trip)) {
      let date = new Date();
      if (hs.date) {
        let date2 = new Date(parseInt(hs.date));
        if (!isNaN(date2.getTime())) {
          date = date2;
        }
        else {
          console.warn(`The date '${hs.date}' is invalid!`);
        }
      }
      store.dispatch(viewTrip(hs.trip, date));
    }
    else {
      console.warn(`The trip id '${hs.trip}' is invalid!`);
    }
  }
}
