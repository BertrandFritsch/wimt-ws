import { connect } from 'react-redux';
import Immutable from 'immutable';
import { commands as historyCommands } from './history.js';
import { commands as tripsStatesCommands } from './tripsStates.js';
import SNCFData from '../SNCFData.js';

// the store referenced by this module
let _store;

//************** reducers

const VIEW_STOP = 'VIEW_STOP';
const VIEW_NEXT_TRIPS = 'VIEW_NEXT_TRIPS';

const emptyList = Immutable.List();

let reducers = {
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
  [VIEW_NEXT_TRIPS](state, stepState, nextTrips, statesReducer) {
    return statesReducer(state, nextTrips)
      .update('history', history => history.updateIn([ history.indexOf(stepState), 'trips' ], emptyList, list => list.concat(nextTrips)));
  }
};

//************** actions

export const commands = {
  initializeModule(store) {
    _store = store;
  },

  viewStop(departureStop, arrivalStop, date = new Date()) {
    return state => reducers[VIEW_STOP](state, departureStop, arrivalStop, date.getTime(), tripsStatesCommands.tripsGenerator(departureStop, arrivalStop, date));
  }
};

//************** Component interface

function mapStateToProps(state) {
  const history = state.history.get('history'),
        current = state.history.get('current'),
        data = history.get(current),
        departureStop = data.get('departureStop'),
        arrivalStop = data.get('arrivalStop');

  return {
    data: {
      departureStop: departureStop && SNCFData.getStopById(departureStop),
      arrivalStop: arrivalStop && SNCFData.getStopById(arrivalStop)
    },
    navigationKey: data.get('key')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    onStopTimeSelected: stopTime => {
    }
  };
}

function generateNextTrips(navigationKey, count) {
  const stepState = _store.getState().history.get('history').find(value => value.get('key') === navigationKey);
  const { trips, tripsStates } = tripsStatesCommands.generateNextTrips(count, stepState.get('generator'));

  historyCommands.updateNavigationStep(state => reducers[VIEW_NEXT_TRIPS](state, stepState, trips, state => tripsStates.statesReducer(state, trips, tripsStates.tripsEndNotifiers)));
}

function mergeProps(stateProps, dispatchProps) {
  const { data, navigationKey } = stateProps;

  return {
    ...data,
    generateNextTrips(count) {
      generateNextTrips(navigationKey, count);
    },
    ...dispatchProps
  };
}

export function connectTrips(component) {
  return connect(mapStateToProps, mapDispatchToProps, mergeProps)(component);
};
