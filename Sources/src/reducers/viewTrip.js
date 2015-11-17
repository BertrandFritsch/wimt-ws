import { VIEW_TRIP } from '../actions/actions.js'
import SNCFData from '../components/SNCFData.jsx'

export function viewTrip(state = {}, action) {
  switch (action.type) {
    case VIEW_TRIP:
      return { trip: SNCFData.getTrip(action.data.trip), endTripNotifier: action.data.endTripNotifier };

    default:
      return state;
  }
}

