﻿import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import SNCFData from '../../SNCFData.js';
import { commands } from './processManager.js';
import { events as moduleEvents } from './events.js';
import { publish as publishEvent } from '../../infrastructure/eventBus.js';

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
  (step, departureStop, arrivalStop, time, trips) => {
    return {
      data: {
        departureStop: departureStop && SNCFData.getStopById(departureStop),
        arrivalStop: arrivalStop && SNCFData.getStopById(arrivalStop),
        time,
        trips,
        onStopTimeSelected: (trip, date) => publishEvent({ type: moduleEvents.STOP_TRIP_SELECTED, data: { trip, date } })
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
