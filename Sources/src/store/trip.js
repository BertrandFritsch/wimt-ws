import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { take, fork, put } from 'redux-saga';
import Immutable from 'immutable';
import { actions as tripsStatesActions } from './tripsStates/aggregate';

//************** constants

const NAVIGATE_TO_TRIP = 'NAVIGATE_TO_TRIP';
const TRIP_NAVIGATION_STEP_CREATED = 'TRIP_NAVIGATION_STEP_CREATED';
const TRIP_NAVIGATION_STEP_UPDATED = 'TRIP_NAVIGATION_STEP_UPDATED';

//************** reducers

export const creationEvent = TRIP_NAVIGATION_STEP_CREATED;
export const updateEvent = TRIP_NAVIGATION_STEP_UPDATED;

//************** actions

export const actions = {
  navigateToTrip(trip, time) {
    return { type: NAVIGATE_TO_TRIP, data: { trip, time } };
  },

  tripNavigationStepCreated(step) {
    return { type: TRIP_NAVIGATION_STEP_CREATED, data: { step } };
  },

  tripNavigationStepUpdated(step) {
    return { type: TRIP_NAVIGATION_STEP_UPDATED, data: { step } };
  }
};

//************** sagas

function* navigateToTrip(getTripsStates) {
  while (true) {
    const { data: { trip, time } } = yield take(NAVIGATE_TO_TRIP),
          step = Immutable.Map({ trip, time });

    yield put(tripsStatesActions.createTripState({ trip, date: new Date(time) }, getTripsStates));
    yield put(actions.tripNavigationStepCreated(step));
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
        trip: step.get('trip'),
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
