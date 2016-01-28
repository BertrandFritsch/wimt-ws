import { combineReducers } from 'redux';
import { reducer as historyReducer } from './history/aggregate.js';
import { reducer as tripsStatesReducer } from './tripsStates/aggregate.js';

//function debuggingInfo(state = {}, action = {}) {
//  switch (action.type) {
//    case UPDATE_DEBUGGING_INFO:
//      return Object.assign({}, state, { [action.data.type]: action.data.text });
//
//    default:
//      return state;
//  }
//}

export default combineReducers({
  history: historyReducer,
  tripsStates: tripsStatesReducer
});
