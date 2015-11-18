import { tripStateSetUp } from './tripState.js'

/*
 * action types
 */

export const UPDATE_DEBUGGING_INFO = 'UPDATE_DEBUGGING_INFO';
export const VIEW_TRIP = 'VIEW_TRIP';
export const UNVIEW_TRIP = 'UNVIEW_TRIP';

/*
 * action creators
 */

export function updateDebuggingInfo(type, text) {
  return { type: UPDATE_DEBUGGING_INFO, data: { type, text }};
}

function viewTripAction(trip, endTripNotifier) {
  return { type: VIEW_TRIP, data: { trip, endTripNotifier } };
}

function unviewTripAction() {
  return { type: UNVIEW_TRIP };
}

export function viewTrip(trip) {
  return dispatch => {
    dispatch(viewTripAction(trip, tripStateSetUp(trip, dispatch)));
  }
}

export function unviewTrip() {
  return (dispatch, getState) => {
    // stop the trip state machine
    let state = getState();

    if (state.viewTrip.trip !== undefined) {
      state.viewTrip.endTripNotifier();
      dispatch(unviewTripAction());
    }
  }
}
