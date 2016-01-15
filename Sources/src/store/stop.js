import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { take, fork, put } from 'redux-saga';
import Immutable from 'immutable';
import { actions as tripsStatesActions } from './tripsStates.js';
import SNCFData from '../SNCFData.js';

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
  navigateToStop(departureStop, arrivalStop, date, metaData) {
    return { type: NAVIGATE_TO_STOP, data: { departureStop, arrivalStop, date, metaData } };
  },

  stopNavigationStepCreated(step, metaData) {
    return { type: STOP_NAVIGATION_STEP_CREATED, data: { step, metaData } };
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

function* navigateToStop() {
  while (true) {
    const { data: { departureStop, arrivalStop, date, metaData } } = yield take(NAVIGATE_TO_STOP),
          step = Immutable.Map({
            departureStop,
            arrivalStop,
            time: date.getTime(),
            generator: tripsStatesActions.tripsGenerator(departureStop, arrivalStop, date)
          });

    yield put(actions.stopNavigationStepCreated(step, metaData));
  }
}

function* generateNextTrips(getTripsStates) {
  while (true) {
    const { data: { step, count } } = yield take(GENERATE_NEXT_TRIPS),
          { trips: nextTrips, tripsStates: tripsStatesSetAction } = tripsStatesActions.generateNextTrips(count, step.get('generator'), getTripsStates);

    yield put(tripsStatesSetAction);
    yield put(actions.stopNavigationStepUpdated(step.update('trips', emptyList, trips => trips.concat(nextTrips))));
  }
}

function* selectStops(getTripsStates) {
  while (true) {
    const { data: { step, departureStop, arrivalStop, date } } = yield take(SELECT_STOPS),
          tripsStates = getTripsStates(),
          trips = step.get('trips');

    if (trips) {
      yield put(tripsStatesActions.stopTripStates(tripsStates, trips));
    }

    yield put(actions.navigateToStop(departureStop, arrivalStop, date, { history: step.get('key') }));
  }
}

export function* sagas(getState) {
  const getTripsStates = () => getState().tripsStates;

  yield fork(navigateToStop);
  yield fork(generateNextTrips, getTripsStates);
  yield fork(selectStops, getTripsStates);
}


//************** Component interface

const selectDepartureStop = () => createSelector(
  (_, props) => props.step,
  state => state && state.get('departureStop')
);

const selectArrivalStop = () => createSelector(
  (_, props) => props.step,
  state => state && state.get('arrivalStop')
);

const selectTrips = () => createSelector(
  (_, props) => props.step,
  state => state && state.get('trips')
);

const selectArrayTrips = () => createSelector(
  selectTrips(),
  trips => trips && trips.toArray()
);

const selectStopProps = () => createSelector(
  (_, props) => props.step,
  selectDepartureStop(),
  selectArrivalStop(),
  selectArrayTrips(),
  (step, departureStop, arrivalStop, trips) => {
    return {
      data: {
        departureStop: departureStop && SNCFData.getStopById(departureStop),
        arrivalStop: arrivalStop && SNCFData.getStopById(arrivalStop),
        trips
      },
      step
    };
  }
);

function mapDispatchToProps(dispatch) {
  return {
    onStopTimeSelected: stopTime => {
    }
  };
}

function mergeProps(stateProps, dispatchProps) {
  const { data, step } = stateProps;

  return {
    ...data,
    selectStops: (departureStop, arrivalStop) => window.store.dispatch(actions.selectStops(step, departureStop && SNCFData.getStopId(departureStop), arrivalStop && SNCFData.getStopId(arrivalStop), new Date())),
    generateNextTrips: count => window.store.dispatch(actions.generateNextTrips(step, count)),
    ...dispatchProps
  };
}

export function connectTrips(component) {
  return connect(selectStopProps(), mapDispatchToProps, mergeProps)(component);
};
