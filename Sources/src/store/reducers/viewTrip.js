import { VIEW_TRIP, UNVIEW_TRIP, PLANNED_TRIP, NOT_PLANNED_TRIP, CANCELLED_TRIP, DELAYED_TRIP, REAL_TIME_TRIP, RUNNING_TRIP, ARRIVED_TRIP, VIEW_LINE, VIEW_LINE_NEXT_TRIPS, VIEW_STOP, VIEW_STOP_NEXT_TRIPS, UNVIEW_STOP } from '../actions/actions.js';
import SNCFData from '../../SNCFData.js';
import Immutable from 'immutable';
import assert from 'assert';

/**
 * viewTrip structure
 *
 * {
 *   stop: {
 *     departureStop: <stop-id>,     // the departure stop
 *     arrivalStop: <stop-id>,       // the arrival stop
 *     generator: <stop-trips-generator>,
 *     trips: [{ trip-id, time }, ...]
 *   },
 *   trip: {
 *     trip: <trip-id>,        // the current viewed trip details
 *     time: <trip time>       // the date when the trip is planned
 *   },
 *   line: {                 // the current viewed line details
 *     departureStop: <stop-id>,
 *     arrivalStop: <stop-id>,
 *     generator: <line-trips-generator>,
 *     trips: [{ trip-id, time }, ...]
 *   },
 *   tripsStates: {          // the set of watched trips
 *     <trip-id>: {
 *       refs: <number>,
 *       endTripNotifier: <function> // function to call to end a trip state machine
 *       realTimeStatus: <status>    // real time status
 *       state: {
 *         type: <state-type>
 *         <state dependent data>
 *       }
 *     }
 *   }
 * }
 */

const emptyMap = Immutable.Map();
const emptyList = Immutable.List();
const emptyTripState = Immutable.Map({ refs: 0 });

function makeTripStateIndex(trip, time) {
  return `${trip}-${time}`;
}

export let ViewTripAccessor = {
  create(state) {
    return {
      trip: {
        hasTrip() {
          return state.has('trip');
        },

        getTrip() {
          assert(this.hasTrip());
          return SNCFData.getTripById(state.get('trip').trip);
        },
        getTime() {
          assert(this.hasTrip());
          return state.get('trip').time;
        },
        getState() {
          return ViewTripAccessor.create(state).states.getState(SNCFData.getTripId(this.getTrip()), this.getTime());
        }
      },

      stop: {
        hasStop() {
          return state.has('stop');
        },

        getDepartureStop() {
          let stop, departureStop;
          return (stop = state.get('stop')) && (departureStop = stop.get('departureStop')) && SNCFData.getStopById(departureStop);
        },

        getArrivalStop() {
          let stop, arrivalStop;
          return (stop = state.get('stop')) && (arrivalStop = stop.get('arrivalStop')) && SNCFData.getStopById(arrivalStop);
        },

        getGenerator() {
          let stop;
          return (stop = state.get('stop')) && stop.get('generator');
        },

        getTrips() {
          let stop, trips;
          return (stop = state.get('stop')) && (trips = stop.get('trips')) && trips.toJS() || [];
        }
      },

      line: {
        hasLine() {
          return state.has('line');
        },

        getDepartureStop() {
          let line, departureStop;
          return (line = state.get('line')) && (departureStop = line.get('departureStop')) && SNCFData.getStopById(departureStop);
        },

        getArrivalStop() {
          let line, arrivalStop;
          return (line = state.get('line')) && (arrivalStop = line.get('arrivalStop')) && SNCFData.getStopById(arrivalStop);
        },

        getGenerator() {
          let line;
          return (line = state.get('line')) && line.get('generator');
        },

        getTrips() {
          let line, trips;
          return (line = state.get('line')) && (trips = line.get('trips')) && trips.toJS() || [];
        }
      },

      states: {
        getState(trip, time) {
          return state.getIn([ 'tripsStates', makeTripStateIndex(trip, time) ]).toJS();
        },

        getTripState(trip, time) {
          let tripState;
          return (tripState = state.getIn([ 'tripsStates', makeTripStateIndex(trip, time) ])) && tripState.get('state');
        },

        getEndTripNotifier(trip, time) {
          let tripState;
          return (tripState = state.getIn([ 'tripsStates', makeTripStateIndex(trip, time) ])) && tripState.get('endTripNotifier');
        }
      }
    };
  }
};

function reduceViewTrips(state, propName, trips, tripsEndNotifiers) {
  return state
    .updateIn([ propName, 'trips' ], emptyList, list => list.concat(trips))
    .update('tripsStates', emptyMap, tripsStates => trips.reduce((tripsStates, e, index) => {
      return tripsStates.update(makeTripStateIndex(e.trip, e.date.getTime()), emptyTripState, tripState => {
        return tripState.merge({
          refs: tripState.get('refs') + 1,
          endTripNotifier: tripsEndNotifiers[index]
        });
      });
    }, tripsStates));
}

function reduceUnviewTrips(state, propName) {
  if (state.get(propName) && state.get(propName).get('trips')) {
    return state
        .update('tripsStates', tripsStates => state.getIn([ propName, 'trips' ]).reduce((tripsStates, e) => tripsStates.update(makeTripStateIndex(e.trip, e.date.getTime()), tripState => tripState.set('refs', tripState.get('refs') - 1)), tripsStates))
        .update('tripsStates', tripsStates => tripsStates.filter(tripState => tripState.get('refs') > 0))
        .delete(propName);
  }
  else {
    return state;
  }
}

export function viewTrip(state = emptyMap, action = {}) {
  switch (action.type) {
    case VIEW_TRIP:
      return state
        .set('trip', { trip: action.data.trip, time: action.data.date.getTime() })
        .updateIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()) ], emptyTripState, tripState => {
          return tripState.merge({
            refs: tripState.get('refs') + 1,
            endTripNotifier: action.data.endTripNotifier
          });
        });

    case UNVIEW_TRIP:
      return state
          .updateIn([ 'tripsStates', makeTripStateIndex(state.get('trip').trip, state.get('trip').time) ], tripState => tripState.set('refs', tripState.get('refs') - 1))
          .update('tripsStates', tripsStates => tripsStates.filter(tripState => tripState.get('refs') > 0))
          .delete('trip');

    case PLANNED_TRIP:
      return state.setIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()), 'state' ], { type: PLANNED_TRIP, time: action.data.plannedDate.getTime() });

    case NOT_PLANNED_TRIP:
      return state.setIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()), 'state' ], { type: NOT_PLANNED_TRIP });

    case CANCELLED_TRIP:
      return state.setIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()), 'state' ], { type: CANCELLED_TRIP });

    case DELAYED_TRIP:
      return state.setIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()), 'state' ], { type: DELAYED_TRIP, stopTime: action.data.stopTime });

    case RUNNING_TRIP:
      return state.setIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()), 'state' ], {
        type: RUNNING_TRIP,
        stopTime: action.data.stopTime,
        delayed: action.data.time
      });

    case ARRIVED_TRIP:
      return state.setIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()), 'state' ], {
        type: ARRIVED_TRIP,
        stopTime: action.data.stopTime,
        delayed: action.data.time
      });

    case REAL_TIME_TRIP:
      return state.setIn([ 'tripsStates', makeTripStateIndex(action.data.trip, action.data.date.getTime()), 'realTimeStatus' ], action.data.status);

    case VIEW_LINE:
      return state.set('line', Immutable.Map({
        departureStop: action.data.departureStopLine,
        arrivalStop: action.data.arrivalStopLine,
        generator: action.data.tripsGenerator
      }));

    case VIEW_LINE_NEXT_TRIPS:
      return reduceViewTrips(state, 'line', action.data.trips, action.data.states);

    case VIEW_STOP:
      return state.set('stop', Immutable.Map({
        departureStop: action.data.departureStop,
        arrivalStop: action.data.arrivalStop,
        generator: action.data.tripsGenerator
      }));

    case VIEW_STOP_NEXT_TRIPS:
      return reduceViewTrips(state, 'stop', action.data.trips, action.data.states);

    case UNVIEW_STOP:
      return reduceUnviewTrips(state, 'stop');

    default:
      return state;
  }
}
