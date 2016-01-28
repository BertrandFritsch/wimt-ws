import SNCFData from '../../SNCFData.js';
import { publish as publishEvent, getEventBus } from '../../infrastructure/eventBus.js';
import { events as globalEvents } from '../events.js';
import { createTripViewer } from './aggregate.js';
import { events as moduleEvents } from './events.js';

export const commands = {
  createTripViewer(trip, time) {
    const tripViewer = createTripViewer(trip, time);
    publishEvent({ type: moduleEvents.TRIP_VIEWER_CREATED, data: { tripViewer } });
  }
};

const regexURL = /\/trip\/(.+?)(\/date\/(\d+))?$/;

function checkValidTrip(tripId) {
  if (!SNCFData.getTripById(tripId)) {
    console.warn(`The trip id '${tripId}' is invalid!`);
  }
  else {
    return tripId;
  }
}

function parseValidTimeOrNow(timeStr) {
  if (timeStr) {
    const time = parseInt(timeStr),
          date = new Date(time);

    if (time !== date.getTime()) {
      console.warn(`The time '${time}' is invalid!`);
    }
    else {
      return time;
    }
  }

  return Date.now();
}

// INITIAL_NAVIGATION_COMPLETED
getEventBus()
  .where(e => e.type === globalEvents.INITIAL_NAVIGATION_COMPLETED)
  .take(1) // only the initial navigation is taken into account
  .where(e => regexURL.test(e.data.url))
  .subscribe(e => {
    const [ , tripId, , time ] = regexURL.exec(e.data.url);
    commands.createTripViewer(tripId && checkValidTrip(tripId), parseValidTimeOrNow(time));
  });
