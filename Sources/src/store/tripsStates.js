import Immutable from 'immutable';
import { tripsGenerator } from './actions/tripsGenerator.js';
import SNCFData from '../SNCFData.js';
import { tripStateSetUp } from './actions/tripState.js';

//************** constants

const REAL_TIME_TRIP = 'REAL_TIME_TRIP';
const PLANNED_TRIP = 'PLANNED_TRIP';
const NOT_PLANNED_TRIP = 'NOT_PLANNED_TRIP';
const ARRIVED_TRIP = 'ARRIVED_TRIP';
const CANCELLED_TRIP = 'CANCELLED_TRIP';
const DELAYED_TRIP = 'DELAYED_TRIP';
const RUNNING_TRIP = 'RUNNING_TRIP';
const SET_TRIPS_STATES = 'SET_TRIPS_STATES';

export const tripStates = {
  TRIP_PLANNED: 'TRIP_PLANNED',
  NOT_PLANNED_TRIP: 'NOT_PLANNED_TRIP',
  ARRIVED_TRIP: 'ARRIVED_TRIP',
  CANCELLED_TRIP: 'CANCELLED_TRIP',
  DELAYED_TRIP: 'DELAYED_TRIP',
  RUNNING_TRIP: 'RUNNING_TRIP'
};

function makeTripStateIndex(trip, time) {
  return `${trip}-${time}`;
}

//************** reducers

const emptyTripState = Immutable.Map({ refs: 0 });
const emptyMap = Immutable.Map();

let reducers = {
  [SET_TRIPS_STATES](state, { tripsEndNotifiers }) {
    return tripsEndNotifiers.reduce((tripsStates, e) => {
      return tripsStates.update(e.tripStateId, emptyTripState, tripState => {
        return tripState.merge({
          refs: tripState.get('refs') + 1,
          endTripNotifier: e.endTripNotifier
        });
      });
    }, state);
  },

  [REAL_TIME_TRIP](state, { tripStateId, status }) {
    return state.update(tripStateId, emptyMap, tripState => tripState.set('status', status));
  },

  [PLANNED_TRIP](state, { tripStateId, time }) {
    return state.update(tripStateId, emptyMap, tripState => tripState.set('state', { type: tripStates.TRIP_PLANNED, time }));
  },

  [NOT_PLANNED_TRIP](state, { tripStateId }) {
    return state.update(tripStateId, emptyMap, tripState => tripState.set('state', { type: tripStates.NOT_PLANNED_TRIP }));
  },

  [ARRIVED_TRIP](state, { tripStateId, stopTime, delayed }) {
    return state.update(tripStateId, emptyMap, tripState => tripState.set('state', { type: tripStates.ARRIVED_TRIP, stopTime, delayed }));
  },

  [CANCELLED_TRIP](state, { tripStateId }) {
    return state.update(tripStateId, emptyMap, tripState => tripState.set('state', { type: tripStates.CANCELLED_TRIP }));
  },

  [DELAYED_TRIP](state, { tripStateId, stopTime }) {
    return state.update(tripStateId, emptyMap, tripState => tripState.set('state', { type: tripStates.DELAYED_TRIP, stopTime }));
  },

  [RUNNING_TRIP](state, { tripStateId, stopTime, delayed }) {
    return state.update(tripStateId, emptyMap, tripState => tripState.set('state', { type: tripStates.RUNNING_TRIP, stopTime, delayed }));
  }
};

export function reducer(state = emptyMap, action = {}) {
  if (reducers[action.type]) {
    window.currentActionTrip = action.data.tripStateId && action.data.tripStateId.substring(0, action.data.tripStateId.indexOf('-'));
    return reducers[action.type](state, action.data);
  }
  else {
    return state;
  }
}

//************** trip state interface

const tripStateCommands = {
  newTripRealTimeState(trip, date, status) {
    window.store.dispatch({ type: REAL_TIME_TRIP, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), status } });
  },

  plannedTrip(trip, date, plannedDate) {
    window.store.dispatch({ type: PLANNED_TRIP, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), time: plannedDate.getTime() } });
  },

  notPlannedTrip(trip, date) {
    window.store.dispatch({ type: NOT_PLANNED_TRIP, data: { tripStateId: makeTripStateIndex(trip, date.getTime()) } });
  },

  arrivedTrip(trip, date, stopTime, delayed) {
    window.store.dispatch({ type: ARRIVED_TRIP, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), stopTime, delayed } });
  },

  cancelledTrip(trip, date) {
    window.store.dispatch({ type: CANCELLED_TRIP, data: { tripStateId: makeTripStateIndex(trip, date.getTime()) } });
  },

  delayedTrip(trip, date, stopTime) {
    window.store.dispatch({ type: DELAYED_TRIP, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), stopTime } });
  },

  runningTrip(trip, date, stopTime, delayed) {
    window.store.dispatch({ type: RUNNING_TRIP, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), stopTime, delayed } });
  }
};

//************** actions

export const actions = {
  tripsGenerator: tripsGenerator,

  generateNextTrips(count, generator, getTripsStates) {
    const trips = generator(count).map(e => ({
            trip: SNCFData.getTripId(e.trip),
            date: e.date
          })),
          tripsStates = getTripsStates();

    return {
      trips: trips,
      tripsStates: actions.setTripsStates(trips.map(e => {
        const tripStateId = makeTripStateIndex(e.trip, e.date.getTime());
        return { tripStateId, endTripNotifier: tripsStates.getIn([ tripStateId, 'endTripNotifier' ]) || tripStateSetUp(e.trip, e.date, tripStateCommands) };
      }))
    };
  },

  setTripsStates(tripsEndNotifiers) {
    return { type: SET_TRIPS_STATES, data: { tripsEndNotifiers } };
  }
};

//************** commands

export const commands = {
  getTripStateOf(tripsStates, trip, date) {
    return tripsStates.get(makeTripStateIndex(trip, date.getTime()));
  }
};
