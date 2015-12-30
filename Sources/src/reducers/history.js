import Immutable from 'immutable';

/**
 * history structure
 *
 * {
 *   history: <immutable-js list>,
 *   current: <number>
 * }
 */

const emptyList = Immutable.List();

const emptyState = Immutable.Map({
  history: emptyList,
  current: -1
});

export function history(state = emptyState, action = {}) {
  switch (action.type) {

    default:
      return state;
  }
}
