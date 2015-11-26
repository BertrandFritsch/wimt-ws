import { VIEW_TRIP, UNVIEW_TRIP, PLANNED_TRIP, NOT_PLANNED_TRIP, CANCELLED_TRIP, DELAYED_TRIP, REAL_TIME_TRIP, RUNNING_TRIP, ARRIVED_TRIP } from '../actions/actions.js'
import SNCFData from '../components/SNCFData.jsx'

/**
 * viewTrip structure
 *
 * {
 *   trip: <trip-id>         // the current viewed trip details
 *   tripsStates: {          // the set of watched trips
 *     <trip-id>: {
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
  return Object.assign({}, state, {
    tripsStates: Object.assign({}, state.tripsStates, {
      [trip]: Object.assign({}, state.tripsStates[trip], {
        state: tripState
      })
    })
  });
}

export function viewTrip(state = {}, action = {}) {
  switch (action.type) {
    case VIEW_TRIP:
      return {
        trip: SNCFData.getTrip(action.data.trip),
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
      return Object.assign({}, state, { realTimeStatus: action.data.status });

    default:
      return state;
  }
}

