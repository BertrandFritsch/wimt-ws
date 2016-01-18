import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { take, fork, put } from 'redux-saga';
import Immutable from 'immutable';
import SNCFData from '../SNCFData.js';
import { actions as tripsStatesActions } from './tripsStates';

//************** constants

const NAVIGATE_TO_TRIP = 'NAVIGATE_TO_TRIP';
const TRIP_NAVIGATION_STEP_CREATED = 'TRIP_NAVIGATION_STEP_CREATED';
const TRIP_NAVIGATION_STEP_UPDATED = 'TRIP_NAVIGATION_STEP_UPDATED';

//************** reducers

export const creationEvent = TRIP_NAVIGATION_STEP_CREATED;
export const updateEvent = TRIP_NAVIGATION_STEP_UPDATED;

//************** actions

export const actions = {
  navigateToTrip(trip, time, metaData) {
    return { type: NAVIGATE_TO_TRIP, data: { trip, time, metaData } };
  },

  tripNavigationStepCreated(step, metaData) {
    return { type: TRIP_NAVIGATION_STEP_CREATED, data: { step, metaData } };
  },

  tripNavigationStepUpdated(step) {
    return { type: TRIP_NAVIGATION_STEP_UPDATED, data: { step } };
  }
};

//************** sagas

function* navigateToTrip(getTripsStates) {
  while (true) {
    const { data: { trip, time, metaData } } = yield take(NAVIGATE_TO_TRIP),
          step = Immutable.Map({ trip, time });

    yield put(tripsStatesActions.createTripState({ trip, date: SNCFData.getDateByMinutes(0, new Date(time)) }, getTripsStates));
    yield put(actions.tripNavigationStepCreated(step, metaData));
  }
}

export function* sagas(getState) {
  const getTripsStates = () => getState().tripsStates;

  yield fork(navigateToTrip, getTripsStates);
}


//************** Component interface

const selectTripProps = () => createSelector(
  (_, props) => props.step,
  step => {
    return {
      data: {
        trip: SNCFData.getTripById(step.get('trip')),
        date: new Date(step.get('time'))
      },
      step
    };
  }
);

function mergeProps(stateProps, dispatchProps) {
  const { data/*, step */ } = stateProps;

  return {
    ...data,
    ...dispatchProps
  };
}

export function connectTrip(component) {
  return connect(selectTripProps(), {}, mergeProps)(component);
};
