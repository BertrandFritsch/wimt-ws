import { createStore, applyMiddleware } from 'redux';
import createLogger from 'redux-logger';

let store;

export function initializeStore(reducers) {
  const loggerMiddleware = createLogger();

  const createStoreWithMiddleware = applyMiddleware(
    loggerMiddleware // neat middleware that logs actions
  )(createStore);

  return (store = createStoreWithMiddleware(reducers));
}

export function dispatch(action) {
  store.dispatch(action);
}

export function getState() {
  return store.getState();
}
