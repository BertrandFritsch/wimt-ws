import SNCFData from '../SNCFData.js'
import { tripStateSetUp } from './tripState.js'
import { lineTripsGenerator } from './lineState.js'

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
 * @param date
 * @returns {String}
 */
function formatDate(date) {
  const _1H = 1 * 60 * 60 * 1000;

  let today = new Date();
  let midnight = (_ => {
    let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() + 1);
    return d;
  })();

  let midnightTime = midnight.getTime();
  let time = date.getTime();
  let now = today.getTime();

  if (time >= midnightTime) {
    // the date is later than today, show the date
    return date.toLocaleString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
  }
  else { //if (time - now >= _1H) {
    // the date is later than 1 hour from now, show the hours and minutes
    return date.toLocaleString('fr-FR', {hour: '2-digit', minute: '2-digit'});
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
 * @param trip {string} the trip id
 * @param status {string} the real time status
 * @returns {object}
 */
export function newTripRealTimeState(trip, status) {
  return { type: REAL_TIME_TRIP, data: { trip, status } };
}

function viewLineAction(tripsGenerator) {
  return { type: VIEW_LINE, data: { tripsGenerator } };
}

function viewLineNextTripsAction(trips, states) {
  return { type: VIEW_LINE_NEXT_TRIPS, data: { trips, states } };
}

/**
 * View line status
 *
 * @param departureStopLine {number} stop id
 * @param arrivalStopLine {number} stop id
 */
export function viewLine(departureStopLine, arrivalStopLine) {
  return viewLineAction(lineTripsGenerator(departureStopLine, arrivalStopLine));
}

/**
 * View next line trips
 * @param count {number} expected count of trips
 * @returns {Function}
 */
export function viewLineNextTrips(count) {
  return (dispatch, getState) => {
    const viewTripState = getState().viewTrip;
    const trips = viewTripState.line.generator(count);
    dispatch(viewLineNextTripsAction(trips.map(e => ({ trip: SNCFData.getTripId(e.trip), date: e.date })), trips.map(e => {
      return viewTripState.tripsStates && viewTripState.tripsStates[SNCFData.getTripId(e.trip)] || tripStateSetUp(SNCFData.getTripId(e.trip), e.date, dispatch, getState);
    })));
  }
}

/**
 * View stop trips
 *
 * @param departureStop {number} stop id
 * @param arrivalStop {number} stop id
 */
export function viewStop(departureStop, arrivalStop) {
  return { type: VIEW_STOP, data: { departureStop, arrivalStop } };
}
