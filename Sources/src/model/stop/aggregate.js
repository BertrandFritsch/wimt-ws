﻿import Immutable from 'immutable';
import SNCFData from '../../SNCFData.js';
import { tripsGenerator } from '../tripsGenerator.js';

const emptyList = Immutable.List();

//************** aggregate-root API

export function createStopViewer(viewType, departureStop, arrivalStop, date) {
  return Immutable.Map({
    viewType,
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
    viewType: stopViewer.get('viewType'),
    departureStop,
    arrivalStop,
    time: date.getTime(),
    generator: tripsGenerator(departureStop, arrivalStop, date),
    trips: emptyList
  });
}
