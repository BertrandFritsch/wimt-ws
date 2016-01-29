import { publish as publishEvent, getEventBus } from '../../infrastructure/eventBus.js';
import { dispatch as dispatchAction, getState } from '../../infrastructure/reduxActionBus.js';
import { events as stopEvents } from '../stop/events.js';
import { events as tripEvents } from '../trip/events.js';
import { events as moduleEvents } from './events.js';
import { createTripsStates, endTripsStates } from './aggregate.js';
import { makeTripStateIndex } from './helpers.js';

function getTripsStates() {
  return getState().tripsStates;
}

const tripStateNotifiers = {
  newTripRealTimeState(trip, date, status) {
    dispatchAction({ type: moduleEvents.REAL_TIME_TRIP_CREATED, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), status } });
  },

  plannedTrip(trip, date, plannedDate) {
    dispatchAction({ type: moduleEvents.REAL_TIME_TRIP_PLANNED, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), time: plannedDate.getTime() } });
  },

  notPlannedTrip(trip, date) {
    dispatchAction({ type: moduleEvents.REAL_TIME_TRIP_NOT_PLANNED, data: { tripStateId: makeTripStateIndex(trip, date.getTime()) } });
  },

  arrivedTrip(trip, date, stopTime, delayed) {
    dispatchAction({ type: moduleEvents.REAL_TIME_TRIP_ARRIVED, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), stopTime, delayed } });
  },

  cancelledTrip(trip, date) {
    dispatchAction({ type: moduleEvents.REAL_TIME_TRIP_CANCELED, data: { tripStateId: makeTripStateIndex(trip, date.getTime()) } });
  },

  delayedTrip(trip, date, stopTime) {
    dispatchAction({ type: moduleEvents.REAL_TIME_TRIP_DELAYED, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), stopTime } });
  },

  runningTrip(trip, date, stopTime, delayed) {
    dispatchAction({ type: moduleEvents.REAL_TIME_TRIP_RUNNING, data: { tripStateId: makeTripStateIndex(trip, date.getTime()), stopTime, delayed } });
  }
};

const commands = {
  [stopEvents.STOP_VIEWER_TRIPS_GENERATED]: ({ trips }) => publishEvent({ type: moduleEvents.TRIPS_STATES_CREATED, data: { tripsStates: createTripsStates(getTripsStates(), trips, tripStateNotifiers) } }),
  [tripEvents.TRIP_VIEWER_CREATED]: ({ tripViewer }) => publishEvent({ type: moduleEvents.TRIPS_STATES_CREATED, data: { tripsStates: createTripsStates(getTripsStates(), [ { trip: tripViewer.get('trip'), date: new Date(tripViewer.get('time')) } ], tripStateNotifiers) } }),
  [stopEvents.STOP_VIEWER_TRIPS_ENDED]: ({ trips }) => publishEvent({ type: moduleEvents.TRIPS_STATES_ENDED, data: { trips: endTripsStates(getTripsStates(), trips.toJS()) } }),
  [tripEvents.TRIP_VIEWER_ENDED]: ({ trips }) => publishEvent({ type: moduleEvents.TRIPS_STATES_ENDED, data: { trips: endTripsStates(getTripsStates(), trips.toJS()) } }),
  [moduleEvents.TRIPS_STATES_CREATED]: ({ tripsStates }) => dispatchAction({ type: moduleEvents.TRIPS_STATES_CREATED, data: { tripsStates } }),
  [moduleEvents.TRIPS_STATES_ENDED]: ({ trips }) => dispatchAction({ type: moduleEvents.TRIPS_STATES_ENDED, data: { trips } })
};

getEventBus()
  .subscribe(e => {
    if (commands[e.type]) {
      commands[e.type](e.data);
    }
  });
