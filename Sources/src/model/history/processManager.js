import Immutable from 'immutable';
import { publish as publishEvent, getEventBus } from '../../infrastructure/eventBus.js';
import { dispatch as dispatchAction, getState } from '../../infrastructure/reduxActionBus.js';
import { events as stopEvents } from '../stop/events.js';
import { events as tripEvents } from '../trip/events.js';
import { events as moduleEvents } from './events.js';
import { push } from './aggregate.js';

function getHistoryState() {
  return getState().history;
}

const emptyList = Immutable.List();

function viewerCreated(step, url, internalNavigation) {
  const current = getHistoryState().get('current'),
        aheadNavigationSteps = current > -1 ? getHistoryState().get('history').slice(current + 1) : emptyList;

  // remove the steps ahead of the current one
  dispatchAction({ type: moduleEvents.CLEAN_AHEAD_NAVIGATION_STEPS });

  // notify the ended steps
  aheadNavigationSteps.forEach(step => publishEvent({ type: moduleEvents.NAVIGATION_STEP_REMOVED, data: { step } }));

  // add the step on the browser's history stack
  if (internalNavigation) {
    push(null, url, current + 1);
  }

  // push the new step ahead of the history stack
  dispatchAction({ type: moduleEvents.SET_NAVIGATION_STEP, data: { step: step } });
}

const commands = {
  [stopEvents.STOP_VIEWER_CREATED]: ({ stopViewer, url, internalNavigation }) => viewerCreated(stopViewer, url, internalNavigation),
  [tripEvents.TRIP_VIEWER_CREATED]: ({ tripViewer, url, internalNavigation }) => viewerCreated(tripViewer, url, internalNavigation),

  [stopEvents.STOP_VIEWER_UPDATED]: ({ stopViewer }) => dispatchAction({ type: moduleEvents.SET_NAVIGATION_STEP, data: { step: stopViewer } }),
  [stopEvents.STOP_VIEWER_TRIPS_GENERATED]: ({ stopViewer }) => dispatchAction({ type: moduleEvents.SET_NAVIGATION_STEP, data: { step: stopViewer } })
};

window.addEventListener('popstate', e => {
  dispatchAction({ type: moduleEvents.SET_CURRENT_NAVIGATION_STEP, data: { key: e.state && e.state.key || 0 } });
});

getEventBus()
  .subscribe(e => {
    if (commands[e.type]) {
      commands[e.type](e.data);
    }
  });
