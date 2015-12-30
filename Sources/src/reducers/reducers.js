import { combineReducers } from 'redux';
import { UPDATE_DEBUGGING_INFO } from '../actions/actions.js';
import { viewTrip } from './viewTrip.js';
import { history } from './history.js';
import { routeReducer } from 'redux-simple-router';

function debuggingInfo(state = {}, action = {}) {
  switch (action.type) {
    case UPDATE_DEBUGGING_INFO:
      return Object.assign({}, state, { [action.data.type]: action.data.text });

    default:
      return state;
  }
}

export default combineReducers({
  debuggingInfo,
  routing: routeReducer,
  history: history,
  viewTrip
});
