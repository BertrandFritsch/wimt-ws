import Immutable from 'immutable';
import SNCFData from '../../SNCFData.js';
import { publish as publishEvent, getEventBus } from '../../infrastructure/eventBus.js';
import { events as stopEvents } from '../stop/events.js';
import { events as historyEvents } from '../history/events.js';
import { events as globalEvents } from '../events.js';
import { createTripViewer } from './aggregate.js';
import { events as moduleEvents } from './events.js';

export const commands = {
  createTripViewer(trip, time, url, internalNavigation) {
    publishEvent({ type: moduleEvents.TRIP_VIEWER_CREATED, data: { tripViewer: createTripViewer(trip, time), url, internalNavigation } });
  },

  endTripViewer(tripViewer) {
    publishEvent({ type: moduleEvents.TRIP_VIEWER_ENDED, data: { trips: Immutable.List([ { trip: tripViewer.get('trip'), date: new Date(tripViewer.get('time')) } ]) } });
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
    commands.createTripViewer(tripId && checkValidTrip(tripId), parseValidTimeOrNow(time), e.data.url, false);
  });

const eventCommands = {
  [stopEvents.STOP_TRIP_SELECTED]: ({ trip, date }) => commands.createTripViewer(trip, date.getTime(), `/trip/${trip}/date/${date.getTime()}`, true),
  [historyEvents.NAVIGATION_STEP_REMOVED]: ({ step }) => {
    if (step.get('trip')) {
      commands.endTripViewer(step);
    }
  }
};

getEventBus()
  .subscribe(e => {
    if (eventCommands[e.type]) {
      eventCommands[e.type](e.data);
    }
  });
