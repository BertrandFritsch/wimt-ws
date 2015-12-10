import { VIEW_STOP } from '../actions/actions.js'
import SNCFData from '../SNCFData.js'

/**
 * viewStop structure
 *
 * {
 *   departureStop: <stop-id>     // the departure stop
 *   arrivalStop: <stop-id>  // the arrival stop
 * }
 */

export function viewStop(state = {}, action = {}) {
  switch (action.type) {
    case VIEW_STOP:
      return {
        departureStop: action.data.departureStop,
        arrivalStop: action.data.arrivalStop
      };

    default:
      return state;
  }
}

