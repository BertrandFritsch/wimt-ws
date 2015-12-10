﻿import { combineReducers } from 'redux'
import { UPDATE_DEBUGGING_INFO } from '../actions/actions.js'
import { viewTrip } from './viewTrip.js'
import { viewStop } from './viewStop.js'

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
  viewTrip,
  viewStop
});
