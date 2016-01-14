import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { take, fork, put } from 'redux-saga';
import Immutable from 'immutable';
import { actions as historyActions } from './history.js';
import { actions as tripsStatesActions, commands as tripsStatesCommands } from './tripsStates.js';
import SNCFData from '../SNCFData.js';

//************** constants

const NAVIGATE_TO_STOP = 'NAVIGATE_TO_STOP';
const VIEW_STOP = 'VIEW_STOP';
const GENERATE_NEXT_TRIPS = 'GENERATE_NEXT_TRIPS';
const VIEW_NEXT_TRIPS = 'VIEW_NEXT_TRIPS';

//************** reducers

const emptyList = Immutable.List();
const emptyMap = Immutable.Map();

const reducers = {
  [VIEW_STOP](state, departureStop, arrivalStop, time, tripsGenerator) {
    return {
      newState: state,
      newValue: Immutable.Map({
        departureStop,
        arrivalStop,
        time,
        generator: tripsGenerator,
        cleaner: () => {
        }
      })
    };
  },
  [VIEW_NEXT_TRIPS](state, nextTrips) {
    return state.update('trips', emptyList, trips => trips.concat(nextTrips));
  }
};

//************** actions

export const actions = {
  navigateToStop(departureStop, arrivalStop, date, history) {
    return { type: NAVIGATE_TO_STOP, data: { departureStop, arrivalStop, date, history } };
  },

  generateNextTrips(count) {
    return { type: GENERATE_NEXT_TRIPS, data: { count } };
  }
};

//************** sagas

function* navigateToStop() {
  while (true) {
    const { data: { departureStop, arrivalStop, date, history: { type, data } } } = yield take(NAVIGATE_TO_STOP),
          generator = tripsStatesActions.tripsGenerator(departureStop, arrivalStop, date);

    yield put({ type, data: { ...data, stepReducer: state => reducers[VIEW_STOP](state, departureStop, arrivalStop, date.getTime(), generator) } });
  }
}

function* generateNextTrips(getTripsStates) {
  while (true) {
    const { data: { step, count, nextEvent: { type, data } } } = yield take(GENERATE_NEXT_TRIPS),
          { trips, tripsStates } = tripsStatesActions.generateNextTrips(count, step.get('generator'), getTripsStates);

    yield put({ type, data: { ...data, step, stepReducer: state => reducers[VIEW_NEXT_TRIPS](state, trips) } });
    yield put(tripsStates);
  }
}

export function* sagas(getState) {
  const getTripsStates = () => getState().history.get('tripsStates', emptyMap);

  yield fork(navigateToStop);
  yield fork(generateNextTrips, getTripsStates);
}


//************** Component interface

const selectCurrentHistoryStep = () => createSelector(
  state => state.history.get('history'),
  state => state.history.get('current'),
  (history, current) => {
    return current > -1 ? history.get(current) : undefined;
  }
);

const selectDepartureStop = () => createSelector(
  selectCurrentHistoryStep(),
  state => state && state.get('departureStop')
);

const selectArrivalStop = () => createSelector(
  selectCurrentHistoryStep(),
  state => state && state.get('arrivalStop')
);

const selectNavigationKey = () => createSelector(
  selectCurrentHistoryStep(),
  state => state && state.get('key')
);

const selectTrips = () => createSelector(
  selectCurrentHistoryStep(),
  state => state && state.get('trips')
);

const selectArrayTrips = () => createSelector(
  selectTrips(),
  trips => trips && trips.toArray()
);

const selectStopProps = () => createSelector(
  selectDepartureStop(),
  selectArrivalStop(),
  selectArrayTrips(),
  selectNavigationKey(),
  (departureStop, arrivalStop, trips, navigationKey) => {
    return {
      data: {
        departureStop: departureStop && SNCFData.getStopById(departureStop),
        arrivalStop: arrivalStop && SNCFData.getStopById(arrivalStop),
        trips
      },
      navigationKey
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
  const { data, navigationKey } = stateProps;

  return {
    ...data,
    generateNextTrips: count => window.store.dispatch(historyActions.applyEventToStep(navigationKey, actions.generateNextTrips(count))),
    ...dispatchProps
  };
}

export function connectTrips(component) {
  return connect(selectStopProps(), mapDispatchToProps, mergeProps)(component);
};

//************** Trip State Component interface

const selectTripState = (state, props) => tripsStatesCommands.getTripStateOf(state.tripsStates, props.trip, props.date);
const mapTripStateToObject = tripState => ({ tripState: tripState && tripState.toJS() });

export function connectWithTripState(component) {
  return connect(createSelector(selectTripState, mapTripStateToObject))(component);
}
