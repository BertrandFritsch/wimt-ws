﻿import { VIEW_TRIP, UNVIEW_TRIP, PLANNED_TRIP, NOT_PLANNED_TRIP, CANCELLED_TRIP, DELAYED_TRIP, REAL_TIME_TRIP, RUNNING_TRIP, ARRIVED_TRIP, VIEW_LINE, VIEW_LINE_NEXT_TRIPS } from '../actions/actions.js';
import SNCFData from '../SNCFData.js';

/**
 * viewTrip structure
 *
 * {
 *   trip: {
 *     trip: <trip-id>,        // the current viewed trip details
 *     time: <trip time>       // the date when the trip is planned
 *   },
 *   line: {                 // the current viewed line details
 *     departureStop: <stop-id>,
 *     arrivalStop: <stop-id>,
 *     generator: <line-trips-generator>,
 *     trips: [trip-id, ...]
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

function makeTripStateIndex(trip, time) {
  return `${trip}-${time}`;
}

export let ViewTripAccessor = {
  create(state) {
    return {
      trip: {
        getTrip() {
          return SNCFData.getTripById(state.trip.trip);
        },
        getTime() {
          return state.trip.time;
        },
        getState() {
          return ViewTripAccessor.create(state).states.getTripState(state.trip.trip, state.trip.time);
        }
      },

      line: {
        getDepartureStop() {
          return state.line.departureStop && SNCFData.getStopById(state.line.departureStop);
        },

        getArrivalStop() {
          return state.line.arrivalStop && SNCFData.getStopById(state.line.arrivalStop);
        },

        getGenerator() {
          return state.line.generator;
        },

        getTrips() {
          return state.line.trips;
        }
      },

      states: {
        getTripState(trip, time) {
          return state.tripsStates && state.tripsStates[makeTripStateIndex(trip, time)];
        },
        getEndTripNotifier(trip, time) {
          return state.tripsStates && state.tripsStates[makeTripStateIndex(trip, time)] && state.tripsStates[makeTripStateIndex(trip, time)].endTripNodifier;
        }
      }
    };
  }
};

function reduceByTripState(state, trip, time, tripState) {
  const tripStateIndex = makeTripStateIndex(trip, time);

  return Object.assign({}, state, {
    tripsStates: Object.assign({}, state.tripsStates, {
      [tripStateIndex]: Object.assign({}, state.tripsStates[tripStateIndex], {
        state: tripState
      })
    })
  });
}

export function viewTrip(state = {}, action = {}) {
  switch (action.type) {
    case VIEW_TRIP:
      return (() => {
        let tripStateIndex = makeTripStateIndex(action.data.trip, action.data.date.getTime());
        let tripState = state.tripsStates && state.tripsStates[tripStateIndex];

        return Object.assign({}, state, {
          trip: { trip: action.data.trip, time: action.data.date.getTime() },
          tripsStates: Object.assign({}, state.tripsStates, {
            [tripStateIndex]: Object.assign({}, tripState, {
              refs: (tripState && tripState.refs || 0) + 1,
              endTripNotifier: action.data.endTripNotifier
            })
          })
        });
      })();

    case UNVIEW_TRIP:
      return (() => {
        const trip = state.trip.trip;
        const time = state.trip.time;
        const tripState = ViewTripAccessor.create(state).trip.getState();
        const newState = Object.assign({}, state, {
          tripsStates: Object.assign({}, state.tripsStates, {
            [makeTripStateIndex(trip, time)]: {
              refs: tripState.refs - 1,
              ...tripState
            }
          }) });

        delete newState.trip;

        if (tripState.refs === 1) {
          delete newState.tripsStates[trip];
        }

        return newState;
      })();

    case PLANNED_TRIP:
      return reduceByTripState(state, action.data.trip, action.data.date.getTime(), { type: PLANNED_TRIP, time: action.data.date.getTime() });

    case NOT_PLANNED_TRIP:
      return reduceByTripState(state, action.data.trip, action.data.date.getTime(), { type: NOT_PLANNED_TRIP });

    case CANCELLED_TRIP:
      return reduceByTripState(state, action.data.trip, action.data.date.getTime(), { type: CANCELLED_TRIP });

    case DELAYED_TRIP:
      return reduceByTripState(state, action.data.trip, action.data.date.getTime(), { type: DELAYED_TRIP, stopTime: action.data.stopTime });

    case RUNNING_TRIP:
      return reduceByTripState(state, action.data.trip, action.data.date.getTime(), {
        type: RUNNING_TRIP,
        stopTime: action.data.stopTime,
        delayed: action.data.time
      });

    case ARRIVED_TRIP:
      return reduceByTripState(state, action.data.trip, action.data.date.getTime(), {
        type: ARRIVED_TRIP,
        stopTime: action.data.stopTime,
        delayed: action.data.time
      });

    case REAL_TIME_TRIP:
      return (() => {
        const tripStateIndex = makeTripStateIndex(action.data.trip, action.data.date.getTime());

        return Object.assign({}, state, {
          tripsStates: Object.assign({}, state.tripsStates, {
            [tripStateIndex]: Object.assign({}, state.tripsStates[tripStateIndex], {
              realTimeStatus: action.data.status
            })
          })
        });
      })();


    case VIEW_LINE:
      return {
        line: {
          departureStop: action.data.departureStopLine,
          arrivalStop: action.data.arrivalStopLine,
          generator: action.data.tripsGenerator,
          trips: []
        }, ...state
      };

    case VIEW_LINE_NEXT_TRIPS:
      return Object.assign({}, state, {
        line: Object.assign({}, state.line, {
          trips: [ ...state.line.trips, ...action.data.trips ]
        }),
        tripsStates: (() => {
          return action.data.states.reduce((r, s, index) => {
            const tripId = action.data.trips[index].trip;
            r[tripId] = {
              refs: (r[tripId] && r[tripId].refs || 0) + 1,
              endTripNotifier: s
            };

            return r;
          }, state.tripsStates || {});
        })()
      });

    default:
      return state;
  }
}
