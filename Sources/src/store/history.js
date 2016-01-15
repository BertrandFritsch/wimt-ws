import Immutable from 'immutable';

/**
 * history structure
 *
 * {
 *   history: <immutable-js list>,
 *   current: <number>
 * }
 */

//************** constants

const __NAVIGATION_STEP_CREATED = '__NAVIGATION_STEP_CREATED';
const __NAVIGATION_STEP_UPDATED = '__NAVIGATION_STEP_UPDATED';

//************** reducers

const emptyList = Immutable.List();

const emptyState = Immutable.Map({
  history: emptyList,
  current: -1
});

let reducers = {
  [__NAVIGATION_STEP_CREATED](state, { step, metaData: { history: key } }) {
    const history = state.get('history'),
          element = history.findIndex(value => value.get('key') === key);

    return state
      .update('history', history => {
        if (element > -1) {
          return history.set(element, step);
        }
        else {
          return history.push(step.set('key', key));
        }
      })
      .set('current', element > -1 ? element : history.size);
  },

  [__NAVIGATION_STEP_UPDATED](state, { step }) {
    const history = state.get('history'),
          key = step.get('key'),
          element = history.findIndex(value => value.get('key') === key);

    return state.setIn([ 'history', element ], step);
  }
};

// complete the reducers with the various creation step events
export function registerCreationEvents(creationEvents) {
  reducers = creationEvents.reduce((reducers, e) => ({ ...reducers, [e]: reducers[__NAVIGATION_STEP_CREATED] }), reducers);
}

// complete the reducers with the various update step events
export function registerUpdateEvents(updateEvents) {
  reducers = updateEvents.reduce((reducers, e) => ({ ...reducers, [e]: reducers[__NAVIGATION_STEP_UPDATED] }), reducers);
}

export function reducer(state = emptyState, action = {}) {
  if (reducers[action.type]) {
    return reducers[action.type](state, action.data);
  }
  else {
    return state;
  }
}
