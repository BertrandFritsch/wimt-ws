import { getEventBus } from '../../infrastructure/eventBus.js';
import { dispatch as dispatchAction } from '../../infrastructure/reduxActionBus.js';
import { events as stopEvents } from '../stop/events.js';
import { events as moduleEvents } from './events.js';

const commands = {
  [stopEvents.STOP_VIEWER_CREATED]: ({ stopViewer }) => dispatchAction({ type: moduleEvents.SET_NAVIGATION_STEP, data: { step: stopViewer } }),
  [stopEvents.STOP_VIEWER_UPDATED]: ({ stopViewer }) => dispatchAction({ type: moduleEvents.SET_NAVIGATION_STEP, data: { step: stopViewer } }),
  [stopEvents.STOP_VIEWER_TRIPS_GENERATED]: ({ stopViewer }) => dispatchAction({ type: moduleEvents.SET_NAVIGATION_STEP, data: { step: stopViewer } })
};

getEventBus()
  .subscribe(e => {
    if (commands[e.type]) {
      commands[e.type](e.data);
    }
  });
