import { VIEW_TRIP, UNVIEW_TRIP, PLANNED_TRIP, NOT_PLANNED_TRIP, CANCELLED_TRIP, DELAYED_TRIP, REAL_TIME_TRIP, RUNNING_TRIP, ARRIVED_TRIP } from '../actions/actions.js'
import SNCFData from '../components/SNCFData.jsx'

export function viewTrip(state = {}, action = {}) {
  switch (action.type) {
    case VIEW_TRIP:
      return {
        trip: action.data.trip,
        tripsStates: Object.assign({}, state.tripsStates, {
          [action.data.trip]: {
            refs: (state.tripsStates && state.tripsStates[action.data.trip] && state.tripsStates[action.data.trip].refs || 0) + 1,
            endTripNotifier: action.data.endTripNotifier
          }
        })
      };

    case UNVIEW_TRIP:
      return (_ => {
        let refs = state.tripsStates[action.data.trip].refs - 1;
        let newState = {
          tripsStates: Object.assign({}, state.tripsStates, refs > 0 ? {
            [action.data.trip]: {
              refs: state.tripsStates[action.data.trip].refs - 1,
              endTripNotifier: state.tripsStates[action.data.trip].endTripNotifier
            }
          } : null)
        };

        if (refs === 0) {
          delete newState.tripsStates[action.data.trip];
        }

        return newState;
      })();

    case PLANNED_TRIP:
      return {
        trip: action.data.trip,
        endTripNotifier: state.endTripNotifier,
        realTimeStatus: state.realTimeStatus,
        state: {type: PLANNED_TRIP, date: action.data.date}
      };

    case NOT_PLANNED_TRIP:
      return {
        trip: action.data.trip,
        endTripNotifier: state.endTripNotifier,
        realTimeStatus: state.realTimeStatus,
        state: {type: NOT_PLANNED_TRIP}
      };

    case CANCELLED_TRIP:
      return {
        trip: action.data.trip,
        endTripNotifier: state.endTripNotifier,
        realTimeStatus: state.realTimeStatus,
        state: {type: CANCELLED_TRIP}
      };

    case DELAYED_TRIP:
      return {
        trip: action.data.trip,
        endTripNotifier: state.endTripNotifier,
        realTimeStatus: state.realTimeStatus,
        state: {type: DELAYED_TRIP, stopTime: action.data.stopTime}
      };

    case RUNNING_TRIP:
      return {
        trip: action.data.trip,
        endTripNotifier: state.endTripNotifier,
        realTimeStatus: state.realTimeStatus,
        state: {type: RUNNING_TRIP, stopTime: action.data.stopTime, delayed: action.data.time}
      };

    case ARRIVED_TRIP:
      return {
        trip: action.data.trip,
        endTripNotifier: state.endTripNotifier,
        realTimeStatus: state.realTimeStatus,
        state: {type: ARRIVED_TRIP, stopTime: action.data.stopTime, delayed: action.data.time}
      };

    case REAL_TIME_TRIP:
      return Object.assign({}, state, { realTimeStatus: action.data.status });

    default:
      return state;
  }
}

