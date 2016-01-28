import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import SNCFData from '../../SNCFData.js';
import { commands } from './processManager.js';

const selectDepartureStop = () => createSelector(
  (_, props) => props.step,
  state => state && state.get('departureStop')
);

const selectArrivalStop = () => createSelector(
  (_, props) => props.step,
  state => state && state.get('arrivalStop')
);

const selectTime = () => createSelector(
  (_, props) => props.step,
    state => state && state.get('time')
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
  selectTime(),
  selectArrayTrips(),
  (_, props) => props.navigateToTrip,
  (step, departureStop, arrivalStop, time, trips, navigateToTrip) => {
    return {
      data: {
        departureStop: departureStop && SNCFData.getStopById(departureStop),
        arrivalStop: arrivalStop && SNCFData.getStopById(arrivalStop),
        time,
        trips,
        onStopTimeSelected: navigateToTrip
      },
      step
    };
  }
);

function mergeProps(stateProps, dispatchProps) {
  const { data, step } = stateProps;

  return {
    ...data,
    selectStops: (departureStop, arrivalStop) => commands.selectStops(step, departureStop && SNCFData.getStopId(departureStop), arrivalStop && SNCFData.getStopId(arrivalStop), new Date(data.time)),
    generateNextTrips: count => commands.generateNextTrips(step, count),
    ...dispatchProps
  };
}

export function connectTrips(component) {
  return connect(selectStopProps(), null, mergeProps)(component);
};
