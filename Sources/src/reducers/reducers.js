import { combineReducers } from 'redux'
import { UPDATE_DEBUGGING_INFO } from '../actions/actions.js'

function updateDebuggingInfo(state = {}, action) {
  switch (action.type) {
    case UPDATE_DEBUGGING_INFO:
      return Object.assign({ [action.data.type]: action.data.text }, state);

    default:
      return state;
  }
}

const app = combineReducers({
  updateDebuggingInfo
});

export default app;
