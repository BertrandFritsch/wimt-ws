import Immutable from 'immutable';
import { events } from './events.js';
import { tripStates } from './states.js';

//************** reducers

const emptyTripState = Immutable.Map({ refs: 0 });
const emptyMap = Immutable.Map();

let reducers = {
  [events.TRIPS_STATES_CREATED](state, { tripsStates }) {
    return tripsStates.reduce((tripsStates, e) => {
      return tripsStates.update(e.tripStateId, emptyTripState, tripState => {
        return tripState.merge({
          refs: tripState.get('refs') + 1,
          endTripNotifier: e.endTripNotifier
        });
      });
    }, state);
  },

  [events.TRIPS_STATES_ENDED](state, { trips }) {
    return state.withMutations(map => trips.reduce((map, tripStateId) => {
      const refs = map.get(tripStateId).get('refs');

      if (refs === 1) {
        return map.delete(tripStateId);
      }
      else {
        return map.setIn([ tripStateId, 'refs' ], refs - 1);
      }
    }, map));
  },

  [events.REAL_TIME_TRIP_CREATED](state, { tripStateId, status }) {
    return state.setIn([ tripStateId, 'realTimeStatus' ], status);
  },

  [events.REAL_TIME_TRIP_PLANNED](state, { tripStateId, time }) {
    return state.setIn([ tripStateId, 'state' ], { type: tripStates.TRIP_PLANNED, time });
  },

  [events.REAL_TIME_TRIP_NOT_PLANNED](state, { tripStateId }) {
    return state.setIn([ tripStateId, 'state' ], { type: tripStates.NOT_PLANNED_TRIP });
  },

  [events.REAL_TIME_TRIP_ARRIVED](state, { tripStateId, stopTime, delayed }) {
    return state.setIn([ tripStateId, 'state' ], { type: tripStates.ARRIVED_TRIP, stopTime, delayed });
  },

  [events.REAL_TIME_TRIP_CANCELED](state, { tripStateId }) {
    return state.setIn([ tripStateId, 'state' ], { type: tripStates.CANCELLED_TRIP });
  },

  [events.REAL_TIME_TRIP_DELAYED](state, { tripStateId, stopTime }) {
    return state.setIn([ tripStateId, 'state' ], { type: tripStates.DELAYED_TRIP, stopTime });
  },

  [events.REAL_TIME_TRIP_RUNNING](state, { tripStateId, stopTime, delayed }) {
    return state.setIn([ tripStateId, 'state' ], { type: tripStates.RUNNING_TRIP, stopTime, delayed });
  }
};

export function reducer(state = emptyMap, action = {}) {
  if (reducers[action.type]) {
    return reducers[action.type](state, action.data);
  }
  else {
    return state;
  }
}
