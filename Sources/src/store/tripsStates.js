import Immutable from 'immutable';
import { tripsGenerator } from './actions/tripsGenerator.js';
import SNCFData from '../SNCFData.js';
import { tripStateSetUp } from './actions/tripState.js';

// the store referenced by this module
let _store;

const emptyMap = Immutable.Map();
const emptyTripState = Immutable.Map({ refs: 0 });

function makeTripStateIndex(trip, time) {
  return `${trip}-${time}`;
}

const tripStateCommands = {
  newTripRealTimeState(trip, date, status) {
    _store.dispatch({ type: REAL_TIME_TRIP, data: { trip, date, status } });
  }
};

//************** actions

export const commands = {
  initializeModule(store) {
    _store = store;
  },

  tripsGenerator: tripsGenerator,

  generateNextTrips(count, generator) {
    const trips = generator(count),
          tripsStates = _store.getState().history.get('tripsStates', emptyMap);

    return {
      trips: trips.map(e => ({
        trip: SNCFData.getTripId(e.trip),
        date: e.date
      })),

      tripsStates: {
        tripsEndNotifiers: trips.map(e => {
          return tripsStates.getIn([ makeTripStateIndex(SNCFData.getTripId(e.trip), e.date.getTime()), 'endTripNotifier' ]) || tripStateSetUp(SNCFData.getTripId(e.trip), e.date, tripStateCommands);
        }),
        statesReducer: (state, trips, tripsEndNotifiers) => {
          return state.update('tripsStates', emptyMap, tripsStates => trips.reduce((tripsStates, e, index) => {
            return tripsStates.update(makeTripStateIndex(e.trip, e.date.getTime()), emptyTripState, tripState => {
              return tripState.merge({
                refs: tripState.get('refs') + 1,
                endTripNotifier: tripsEndNotifiers[index]
              });
            });
          }, tripsStates));
        }
      }
    };
  }
};
