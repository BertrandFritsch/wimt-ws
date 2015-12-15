import SNCFData from '../SNCFData.js';
import { tripStateSetUp } from './tripState.js';
import { lineTripsGenerator } from './lineState.js';
import { ViewTripAccessor } from '../reducers/viewTrip.js';

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
export const VIEW_LINE_NEXT_TRIPS = 'VIEW_LINE_NEXT_TRIPS';

export const VIEW_STOP = 'VIEW_STOP';

/*
 * real time status
 */
export var RealTimeStatus = {
  OFFLINE: "OFFLINE",
  ONLINE: "ONLINE",
  CHECKING: "CHECKING"
};

/**
 * Format the date
 * @param {date} date the date to format
 * @returns {String} the formatted date
 */
function formatDate(date) {
  let today = new Date();
  let midnight = (() => {
    let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() + 1);
    return d;
  })();

  let midnightTime = midnight.getTime();
  let time = date.getTime();

  if (time >= midnightTime) {
    // the date is later than today, show the date
    return date.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  else { //if (time - now >= _1H) {
    // the date is later than 1 hour from now, show the hours and minutes
    return date.toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  //else {
  //  // the date is less than 1 hour, show the minutes
  //  return `${(time - now) / (1000 * 60)}0mn`;
  //}
}

export function realTimeStateDisplay(state, showAtTime = true) {
  if (state) {
    switch (state.type) {
      case PLANNED_TRIP:
        return formatDate(state.date);

      case NOT_PLANNED_TRIP:
        return "Non planifié !";

      case DELAYED_TRIP:
        return "Retardé";

      case CANCELLED_TRIP:
        return "Supprimé";

      case RUNNING_TRIP:
        return state.delayed === 0 ? showAtTime ? "A l'heure" : '' : `${state.delayed} mn`;

      case ARRIVED_TRIP:
        return "Arrivé";
    }
  }
}

/*
 * action creators
 */

export function updateDebuggingInfo(type, text) {
  return { type: UPDATE_DEBUGGING_INFO, data: { type, text } };
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
 * @param {string} trip trip id
 * @param {Date} date the date the trip is running
 * @returns {Function} internal redux function
 */
export function viewTrip(trip, date) {
  return (dispatch, getState) => {
    dispatch(viewTripAction(trip, ViewTripAccessor.create(getState()).states.getTripState(trip) || tripStateSetUp(trip, date, dispatch, getState)));
  };
}

/**
 * Unview trip details
 * @returns {Function} internal redux function
 */
export function unviewTrip() {
  return (dispatch, getState) => {
    // stop the trip state machine if no component does reference it anymore
    let state = getState();
    let trip = SNCFData.getTripId(state.viewTrip.trip);

    if (state.viewTrip.tripsStates[trip].refs === 1) {
      state.viewTrip.tripsStates[trip].endTripNotifier();
    }

    dispatch(unviewTripAction());
  };
}

/**
 * The trip is planned
 * @param {string} trip trip id
 * @param {Date} date The next time the trip will run
 * @returns {object} The PLANNED_TRIP action
 */
export function plannedTrip(trip, date) {
  return { type: PLANNED_TRIP, data: { trip, date } };
}

/**
 * The trip is no longer planned
 * @param {string} trip trip id
 * @returns {object} The NOT_PLANNED_TRIP action
 */
export function notPlannedTrip(trip) {
  return { type: NOT_PLANNED_TRIP, data: { trip } };
}

/**
 * The trip has been cancelled
 * @param {string} trip trip id
 * @returns {object} The CANCELLED_TRIP action
 */
export function cancelledTrip(trip) {
  return { type: CANCELLED_TRIP, data: { trip } };
}

/**
 * The trip has been delayed
 * @param {string} trip trip id
 * @param {Array} stopTime The next stop the train has to reach
 * @returns {object} The DELAYED_TRIP action
 */
export function delayedTrip(trip, stopTime) {
  return { type: DELAYED_TRIP, data: { trip, stopTime } };
}

/**
 * the trip is running, it may not has been started yet, or it may have been arrived
 * @param {string} trip the trip id
 * @param {stopTime} stopTime the next stop to reach
 * @param {number} time the delayed time in mn
 * @returns {object} The RUNNING_TRIP action
 */
export function runningTrip(trip, stopTime, time) {
  return { type: RUNNING_TRIP, data: { trip, stopTime, time } };
}

/**
 * The trip has arrived
 * @param {string} trip the trip id
 * @param {stopTime} stopTime the last stop
 * @param {number} time the delayed time in mn
 * @returns {object} The ARRIVED_TRIP action
 */
export function arrivedTrip(trip, stopTime, time) {
  return { type: ARRIVED_TRIP, data: { trip, stopTime, time } };
}

/**
 * Update the real time status
 * @param {string} trip the trip id
 * @param {string} status the real time status
 * @returns {object} The REAL_TIME_TRIP action
 */
export function newTripRealTimeState(trip, status) {
  return { type: REAL_TIME_TRIP, data: { trip, status } };
}

function viewLineAction(departureStopLine, arrivalStopLine, tripsGenerator) {
  return { type: VIEW_LINE, data: { departureStopLine, arrivalStopLine, tripsGenerator } };
}

function viewLineNextTripsAction(trips, states) {
  return { type: VIEW_LINE_NEXT_TRIPS, data: { trips, states } };
}

/**
 * View line status
 *
 * @param {number} departureStopLine stop id
 * @param {number} arrivalStopLine stop id
 * @returns {object} The VIEW_LINE action
 */
export function viewLine(departureStopLine, arrivalStopLine) {
  return viewLineAction(departureStopLine, arrivalStopLine, lineTripsGenerator(departureStopLine, arrivalStopLine));
}

/**
 * View next line trips
 * @param {number} count expected count of trips
 * @returns {Function} internal redux function
 */
export function viewLineNextTrips(count) {
  return (dispatch, getState) => {
    const viewTripState = getState().viewTrip;
    const trips = viewTripState.line.generator(count);
    dispatch(viewLineNextTripsAction(trips.map(e => ({
      trip: SNCFData.getTripId(e.trip),
      date: e.date
    })), trips.map(e => {
      return viewTripState.tripsStates && viewTripState.tripsStates[SNCFData.getTripId(e.trip)] || tripStateSetUp(SNCFData.getTripId(e.trip), e.date, dispatch, getState);
    })));
  };
}

/**
 * View stop trips
 *
 * @param {number} departureStop stop id
 * @param {number} arrivalStop stop id
 * @returns {object} The VIEW_STOP action
 */
export function viewStop(departureStop, arrivalStop) {
  return { type: VIEW_STOP, data: { departureStop, arrivalStop } };
}
