﻿import { VIEW_TRIP, UNVIEW_TRIP, PLANNED_TRIP, NOT_PLANNED_TRIP, CANCELLED_TRIP, DELAYED_TRIP, REAL_TIME_TRIP, RUNNING_TRIP, ARRIVED_TRIP, VIEW_LINE, VIEW_LINE_NEXT_TRIPS } from '../actions/actions.js'
import SNCFData from '../SNCFData.js'

/**
 * viewTrip structure
 *
 * {
 *   trip: <trip-id>         // the current viewed trip details
 *   line: {                 // the current viewed line details
 *     generator: <line-trips-generator>,
 *     trips: [trip-id, ...]
 *   }
 *   tripsStates: {          // the set of watched trips
 *     <trip-id>: {
 *       refs: <number>,
 *       endTripNotifier: <function> // function to call to end a trip state machine
 *       realTimeStatus: <status>    // real time status
 *       state: {
 *         type: <state-type>
 *         <state dependant data>
 *       }
 *     }
 *   }
 * }
 */

function reduceByTripState(state, trip, tripState) {
  const realTimeStatus = state.tripsStates && state.tripsStates[trip].realTimeStatus; // preserve the RT status
  return Object.assign({}, state, {
    tripsStates: Object.assign({}, state.tripsStates, {
      [trip]: Object.assign({}, state.tripsStates && state.tripsStates[trip] || {}, {
        state: Object.assign(tripState, { realTimeStatus })
      })
    })
  });
}

export function viewTrip(state = {}, action = {}) {
  switch (action.type) {
    case VIEW_TRIP:
      return {
        trip: SNCFData.getTripById(action.data.trip),
        tripsStates: Object.assign({}, state.tripsStates, {
          [action.data.trip]: {
            refs: (state.tripsStates && state.tripsStates[action.data.trip] && state.tripsStates[action.data.trip].refs || 0) + 1,
            endTripNotifier: action.data.endTripNotifier
          }
        })
      };

    case UNVIEW_TRIP:
      return (_ => {
        let trip = SNCFData.getTripId(state.trip);
        let refs = state.tripsStates[trip].refs - 1;
        let newState = {
          tripsStates: Object.assign({}, state.tripsStates, refs > 0 ? {
            [trip]: {
              refs: state.tripsStates[trip].refs - 1,
              endTripNotifier: state.tripsStates[trip].endTripNotifier
            }
          } : null)
        };

        if (refs === 0) {
          delete newState.tripsStates[trip];
        }

        return newState;
      })();

    case PLANNED_TRIP:
      return reduceByTripState(state, action.data.trip, {type: PLANNED_TRIP, date: action.data.date});

    case NOT_PLANNED_TRIP:
      return reduceByTripState(state, action.data.trip, {type: NOT_PLANNED_TRIP});

    case CANCELLED_TRIP:
      return reduceByTripState(state, action.data.trip, {type: CANCELLED_TRIP});

    case DELAYED_TRIP:
      return reduceByTripState(state, action.data.trip, {type: DELAYED_TRIP, stopTime: action.data.stopTime});

    case RUNNING_TRIP:
      return reduceByTripState(state, action.data.trip, {type: RUNNING_TRIP, stopTime: action.data.stopTime, delayed: action.data.time});

    case ARRIVED_TRIP:
      return reduceByTripState(state, action.data.trip, {type: ARRIVED_TRIP, stopTime: action.data.stopTime, delayed: action.data.time});

    case REAL_TIME_TRIP:
      return reduceByTripState(state, action.data.trip, Object.assign({}, state.tripsStates && state.tripsStates[action.data.trip] || {}, { realTimeStatus: action.data.status }));

    case VIEW_LINE:
      return { line: { generator: action.data.tripsGenerator, trips: [] }, ...state };

    case VIEW_LINE_NEXT_TRIPS:
      return Object.assign({}, state, {
        line: Object.assign({}, state.line, {
          trips: [...state.line.trips, ...action.data.trips]
        }),
        tripsStates: (_ => {
          return action.data.states.reduce((r, s, index) => {
            const tripId = action.data.trips[index].trip;
            r[tripId] = {
              refs: (r[tripId] && r[tripId].refs || 0) + 1,
              endTripNotifier: s
            };

            return r;
          }, state.tripsStates || {})
        })()
      });

    default:
      return state;
  }
}

