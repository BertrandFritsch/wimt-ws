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
