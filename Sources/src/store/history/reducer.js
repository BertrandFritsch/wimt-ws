import Immutable from 'immutable';
import { events } from './events.js';

/**
 * history structure
 *
 * {
 *   history: <immutable-js list>,
 *   current: <number>
 * }
 */

//************** reducers

const emptyList = Immutable.List();

const emptyState = Immutable.Map({
  history: emptyList,
  current: -1
});

let reducers = {
  [events.SET_NAVIGATION_STEP](state, { step }) {
    const history = state.get('history'),
          element = step.get('key');

    return state
      .update('history', history => {
        if (element !== undefined) {
          return history.set(element, step);
        }
        else {
          return history.push(step.set('key', history.size));
        }
      })
      .set('current', element !== undefined ? element : history.size);
  },

  [events.SET_CURRENT_NAVIGATION_STEP](state, { key }) {
    return state.set('current', key);
  },

  [events.CLEAN_AHEAD_NAVIGATION_STEPS](state) {
    return state.set('history', state.get('history').slice(0, state.get('current') + 1));
  }
};

export function reducer(state = emptyState, action = {}) {
  if (reducers[action.type]) {
    return reducers[action.type](state, action.data);
  }
  else {
    return state;
  }
}
