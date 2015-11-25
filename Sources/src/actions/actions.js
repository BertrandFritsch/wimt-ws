import { tripStateSetUp } from './tripState.js'

/*
 * action types
 */

export const UPDATE_DEBUGGING_INFO = 'UPDATE_DEBUGGING_INFO';
export const VIEW_TRIP = 'VIEW_TRIP';
export const UNVIEW_TRIP = 'UNVIEW_TRIP';
export const PLANNED_TRIP = 'PLANNED_TRIP';
export const NOT_PLANNED_TRIP = 'NOT_PLANNED_TRIP';
export const CANCELLED_TRIP = 'CANCELLED_TRIP';
export const DELAYED_TRIP = 'DELAYED_TRIP';
export const REAL_TIME_TRIP = 'REAL_TIME_TRIP';
export const RUNNING_TRIP = 'RUNNING_TRIP';
export const ARRIVED_TRIP = 'ARRIVED_TRIP';

/*
 * real time status
 */
export var RealTimeStatus = {
  OFFLINE: "OFFLINE",
  ONLINE: "ONLINE",
  CHECKING: "CHECKING"
};

/*
 * action creators
 */

export function updateDebuggingInfo(type, text) {
  return { type: UPDATE_DEBUGGING_INFO, data: { type, text }};
}

function viewTripAction(trip, endTripNotifier) {
  return { type: VIEW_TRIP, data: { trip, endTripNotifier } };
}

function unviewTripAction(trip) {
  return { type: UNVIEW_TRIP, data: { trip } };
}

export function viewTrip(trip, date) {
  return (dispatch, getState) => {
    dispatch(viewTripAction(trip, tripStateSetUp(trip, date, dispatch, getState)));
  }
}

export function unviewTrip(trip) {
  return (dispatch, getState) => {
    // stop the trip state machine if no component does reference it anymore
    let state = getState();

    if (state.tripsStates[trip].refs === 1) {
      state.tripsStates[trip].endTripNotifier();
      dispatch(unviewTripAction(trip));
    }
  }
}

export function plannedTrip(trip, date) {
  return { type: PLANNED_TRIP, data: { trip, date } };
}

export function notPlannedTrip(trip, date) {
  return { type: NOT_PLANNED_TRIP, data: { trip, date } };
}

export function cancelledTrip(trip) {
  return { type: CANCELLED_TRIP, data: { trip } };
}

export function delayedTrip(trip, stopTime) {
  return { type: DELAYED_TRIP, data: { trip, stopTime } };
}

/**
 * the trip is running, it may not has been started yet, or it may have been arrived
 * @param trip {trip} the trip
 * @param stopTime {stopTime} the next stop to reach
 * @param time {Integer} the delayed time in mn
 * @returns {{type: string, data: {trip: *, stopTime: *, time: *}}}
 */
export function runningTrip(trip, stopTime, time) {
  return { type: RUNNING_TRIP, data: { trip, stopTime, time } };
}

/**
 * the trip has arrived
 * @param trip {trip} the trip
 * @param stopTime {stopTime} the next stop to reach
 * @param time {Integer} the delayed time in mn
 * @returns {{type: string, data: {trip: *, stopTime: *, time: *}}}
 */
export function arrivedTrip(trip, stopTime, time) {
  return { type: ARRIVED_TRIP, data: { trip, stopTime, time } };
}

export function newTripRealTimeState(status) {
  return { type: REAL_TIME_TRIP, data: { status } };
}

