import Immutable from 'immutable';

//************** aggregate-root API

export function createTripViewer(trip, time) {
  return Immutable.Map({ trip, time });
}
