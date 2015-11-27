import SNCFData from '../components/SNCFData.jsx'
import { tripStateSetUp } from './tripState.js'
import { lineStateSetUp } from './lineState.js'

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

export const VIEW_LINE = 'VIEW_LINE';

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

function unviewTripAction() {
  return { type: UNVIEW_TRIP };
}

/**
 * View trip details
 * Only one trip details can be viewed at a time
 *
 * @param trip {string} trip id
 * @param date {Date} the date the trip is running
 * @returns {Function}
 */
export function viewTrip(trip, date) {
  return (dispatch, getState) => {
    dispatch(viewTripAction(trip, tripStateSetUp(trip, date, dispatch, getState)));
  }
}

/**
 * Unview trip details
 * @returns {Function}
 */
export function unviewTrip() {
  return (dispatch, getState) => {
    // stop the trip state machine if no component does reference it anymore
    let state = getState();
    let trip = SNCFData.getTripId(state.viewTrip.trip);

    if (state.viewTrip.tripsStates[trip].refs === 1) {
      state.viewTrip.tripsStates[trip].endTripNotifier();
      dispatch(unviewTripAction());
    }
  }
}

/**
 * The trip is planned
 * @param trip {string} trip id
 * @param date {Date} The next time the trip will run
 * @returns {object}
 */
export function plannedTrip(trip, date) {
  return { type: PLANNED_TRIP, data: { trip, date } };
}

/**
 * The trip is no longer planned
 * @param trip {string} trip id
 * @returns {object}
 */
export function notPlannedTrip(trip) {
  return { type: NOT_PLANNED_TRIP, data: { trip } };
}

/**
 * The trip has been cancelled
 * @param trip {string} trip id
 * @returns {object}
 */
export function cancelledTrip(trip) {
  return { type: CANCELLED_TRIP, data: { trip } };
}

/**
 * The trip has been delayed
 * @param trip {string} trip id
 * @param stopTime {Array} The next stop the train has to reach
 * @returns {object}
 */
export function delayedTrip(trip, stopTime) {
  return { type: DELAYED_TRIP, data: { trip, stopTime } };
}

/**
 * the trip is running, it may not has been started yet, or it may have been arrived
 * @param trip {string} the trip id
 * @param stopTime {stopTime} the next stop to reach
 * @param time {number} the delayed time in mn
 * @returns {object}
 */
export function runningTrip(trip, stopTime, time) {
  return { type: RUNNING_TRIP, data: { trip, stopTime, time } };
}

/**
 * The trip has arrived
 * @param trip {string} the trip id
 * @param stopTime {stopTime} the last stop
 * @param time {number} the delayed time in mn
 * @returns {object}
 */
export function arrivedTrip(trip, stopTime, time) {
  return { type: ARRIVED_TRIP, data: { trip, stopTime, time } };
}

/**
 * Update the real time status
 * @param status {string} the real time status
 * @returns {object}
 */
export function newTripRealTimeState(status) {
  return { type: REAL_TIME_TRIP, data: { status } };
}

function viewLineAction(nextLineTrips) {
  return { type: VIEW_LINE, data: { nextLineTrips } };
}

/**
 * View line status
 *
 * @param departureStopLine {number} stop id
 * @param arrivalStopLine {number} stop id
 * @returns {Function}
 */
export function viewLine(departureStopLine, arrivalStopLine) {
  return (dispatch, getState) => {
    dispatch(viewLineAction(lineStateSetUp(departureStopLine, arrivalStopLine, dispatch, getState)));
  }
}

