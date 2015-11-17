import { tripStateSetUp } from './tripState.js'

/*
 * action types
 */

export const UPDATE_DEBUGGING_INFO = 'UPDATE_DEBUGGING_INFO';
export const VIEW_TRIP = 'VIEW_TRIP';

/*
 * action creators
 */

export function updateDebuggingInfo(type, text) {
  return { type: UPDATE_DEBUGGING_INFO, data: { type, text }};
}

function viewTripAction(trip, endTripNotifier) {
  return { type: VIEW_TRIP, data: { trip, endTripNotifier } };
}

export function viewTrip(trip) {
  return dispatch => {
    dispatch(viewTripAction(trip, tripStateSetUp(trip)));

    // update the history
    window.history.pushState({ trip }, "Voyage d'un train", String.format("#trip={0}", trip));
  }
}
