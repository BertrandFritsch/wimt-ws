import Immutable from 'immutable';
import SNCFData from '../../SNCFData.js';
import { tripsGenerator } from '../actions/tripsGenerator.js';

//************** constants

const NAVIGATE_TO_STOP = 'NAVIGATE_TO_STOP';
const STOP_NAVIGATION_STEP_CREATED = 'STOP_NAVIGATION_STEP_CREATED';
const STOP_NAVIGATION_STEP_UPDATED = 'STOP_NAVIGATION_STEP_UPDATED';
const SELECT_STOPS = 'SELECT_STOPS';
const GENERATE_NEXT_TRIPS = 'GENERATE_NEXT_TRIPS';

//************** reducers

const emptyList = Immutable.List();

export const creationEvent = STOP_NAVIGATION_STEP_CREATED;
export const updateEvent = STOP_NAVIGATION_STEP_UPDATED;

//************** actions

export const actions = {
  navigateToStop(departureStop, arrivalStop, date) {
    return { type: NAVIGATE_TO_STOP, data: { departureStop, arrivalStop, date } };
  },

  stopNavigationStepCreated(step) {
    return { type: STOP_NAVIGATION_STEP_CREATED, data: { step } };
  },

  stopNavigationStepUpdated(step) {
    return { type: STOP_NAVIGATION_STEP_UPDATED, data: { step } };
  },

  selectStops(step, departureStop, arrivalStop, date) {
    return { type: SELECT_STOPS, data: { step, departureStop, arrivalStop, date } };
  },

  generateNextTrips(step, count) {
    return { type: GENERATE_NEXT_TRIPS, data: { step, count } };
  }
};

//************** sagas

//function* navigateToStop() {
//  while (true) {
//    const { data: { departureStop, arrivalStop, date } } = yield take(NAVIGATE_TO_STOP),
//          step = Immutable.Map({
//            departureStop,
//            arrivalStop,
//            time: date.getTime(),
//            generator: tripsStatesActions.tripsGenerator(departureStop, arrivalStop, date)
//          });
//
//    yield put(actions.stopNavigationStepCreated(step));
//  }
//}
//
//function* generateNextTrips(getTripsStates) {
//  while (true) {
//    const { data: { step, count } } = yield take(GENERATE_NEXT_TRIPS),
//          { trips: nextTrips, tripsStates: tripsStatesSetAction } = tripsStatesActions.generateNextTrips(count, step.get('generator'), getTripsStates);
//
//    yield put(tripsStatesSetAction);
//    yield put(actions.stopNavigationStepUpdated(step.update('trips', emptyList, trips => trips.concat(nextTrips))));
//  }
//}
//
//function* selectStops(getTripsStates) {
//  while (true) {
//    const { data: { step, departureStop, arrivalStop, date } } = yield take(SELECT_STOPS),
//          tripsStates = getTripsStates(),
//          trips = step.get('trips');
//
//    if (trips) {
//      yield put(tripsStatesActions.stopTripStates(tripsStates, trips));
//    }
//
//    yield put(actions.navigateToStop(departureStop, arrivalStop, date, { history: step.get('key') }));
//  }
//}
//
//export function* sagas(getState) {
//  const getTripsStates = () => getState().tripsStates;
//
//  yield fork(navigateToStop);
//  yield fork(generateNextTrips, getTripsStates);
//  yield fork(selectStops, getTripsStates);
//}

//************** aggregate-root API

export function createStopViewer(departureStop, arrivalStop, date) {
  return Immutable.Map({
    departureStop,
    arrivalStop,
    time: date.getTime(),
    generator: tripsGenerator(departureStop, arrivalStop, date)
  });
}

export function generateNextTrips(stopViewer, count) {
  const nextTrips = stopViewer.get('generator')(count).map(e => ({
    trip: SNCFData.getTripId(e.trip),
    date: e.date
  }));

  return {
    stopViewer: stopViewer.update('trips', emptyList, trips => trips.concat(nextTrips)),
    trips: nextTrips
  };
}

export function selectStops(stopViewer, departureStop, arrivalStop, date) {
  return stopViewer.merge({
    departureStop,
    arrivalStop,
    time: date.getTime(),
    generator: tripsGenerator(departureStop, arrivalStop, date),
    trips: emptyList
  });
}
