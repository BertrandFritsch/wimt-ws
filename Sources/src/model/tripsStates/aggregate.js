import { tripStateSetUp } from './tripState.js';
import { makeTripStateIndex } from './helpers.js';

//************** aggregate-root API

function getTripState(trip, tripsStates, notifiers) {
  const tripStateId = makeTripStateIndex(trip.trip, trip.date.getTime());
  return { tripStateId, endTripNotifier: tripsStates.getIn([ tripStateId, 'endTripNotifier' ]) || tripStateSetUp(trip.trip, trip.date, notifiers) };
}

export function createTripsStates(tripsStates, trips, notifiers) {
  return trips.map(e => getTripState(e, tripsStates, notifiers));
}

export function endTripsStates(tripsStates, trips) {
  return trips.map(e => {
    const tripStateId = makeTripStateIndex(e.trip, e.date.getTime()),
          tripState = tripsStates.get(tripStateId);

    if (tripState.get('refs') === 1) {
      tripState.get('endTripNotifier')();
    }

    return tripStateId;
  });
}
