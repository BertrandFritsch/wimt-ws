import SNCFData from '../../SNCFData.js';
import { publish as publishEvent, getEventBus } from '../../infrastructure/eventBus.js';
import { events as globalEvents } from '../events.js';
import { createStopViewer, generateNextTrips, selectStops } from './aggregate.js';
import { events as moduleEvents } from './events.js';

export const commands = {
  createStopViewer(departureStop, arrivalStop, date, url, internalNavigation) {
    const stopViewer = createStopViewer(departureStop, arrivalStop, date);
    publishEvent({ type: moduleEvents.STOP_VIEWER_CREATED, data: { stopViewer, url, internalNavigation } });
  },

  generateNextTrips(stopViewer, count) {
    const { stopViewer: newStopViewer, trips } = generateNextTrips(stopViewer, count);
    publishEvent({ type: moduleEvents.STOP_VIEWER_TRIPS_GENERATED, data: { stopViewer: newStopViewer, trips } });
  },

  selectStops(stopViewer, ...params) {
    publishEvent({ type: moduleEvents.STOP_VIEWER_TRIPS_ENDED, data: { stopViewer, trips: stopViewer.get('trips') } });
    publishEvent({ type: moduleEvents.STOP_VIEWER_UPDATED, data: { stopViewer: selectStops(stopViewer, ...params) } });
  }
};

function checkValidStop(stopStr) {
  const stop = parseInt(stopStr);
  if (!SNCFData.getStopById(stop)) {
    console.warn(`The stop id '${stopStr}' is invalid!`);
  }
  else {
    return stop;
  }
}

const regexURL = /\/stop\/(\d+)(\/arrival\/(\d+))?/;

// INITIAL_NAVIGATION_COMPLETED
getEventBus()
  .where(e => e.type === globalEvents.INITIAL_NAVIGATION_COMPLETED)
  .take(1) // only the initial navigation is taken into account
  .where(e => regexURL.test(e.data.url))
  .subscribe(e => {
    const [ , departureStop, , arrivalStop ] = regexURL.exec(e.data.url);
    commands.createStopViewer(departureStop && checkValidStop(departureStop), arrivalStop && checkValidStop(arrivalStop), new Date(), e.data.url, false);
  });
