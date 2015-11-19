import { VIEW_TRIP, UNVIEW_TRIP, PLANNED_TRIP } from '../actions/actions.js'
import SNCFData from '../components/SNCFData.jsx'

export function viewTrip(state = {}, action) {
  switch (action.type) {
    case VIEW_TRIP:
      return { trip: SNCFData.getTrip(action.data.trip), endTripNotifier: action.data.endTripNotifier };

    case UNVIEW_TRIP:
      return { };

    case PLANNED_TRIP:
      return {
        trip: action.data.trip,
        endTripNotifier: state.endTripNotifier,
        state: {type: PLANNED_TRIP, date: action.data.date}
      };

    default:
      return state;
  }
}

