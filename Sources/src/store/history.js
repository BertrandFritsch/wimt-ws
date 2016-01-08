import Immutable from 'immutable';

/**
 * history structure
 *
 * {
 *   history: <immutable-js list>,
 *   current: <number>,
 *   tripStates
 * }
 */

// the store referenced by this module
let _store;

const SET_HISTORY_STEP = 'SET_HISTORY_STEP';
const UPDATE_HISTORY_STEP = 'UPDATE_HISTORY_STEP';

const emptyList = Immutable.List();

const emptyState = Immutable.Map({
  history: emptyList,
  current: -1
});

export function reducer(state = emptyState, action = {}) {
  switch (action.type) {

    case SET_HISTORY_STEP:
      // updates the history, delegates the update of the navigation step
      return (() => {
        const { element, key, stepReducer } = action.data,
              { newState, newValue } = stepReducer(state);

        return newState
          .update('history', history => {
            if (element > -1) {
              return history.update(element, newValue);
            }
            else {
              return history.push(newValue.set('key', key));
            }
          })
          .set('current', element > -1 ? element : newState.get('history').size);
      })();
      break;

    case UPDATE_HISTORY_STEP:
      // generic action to update a navigation step; the entire update is delegated
      return action.data.stepReducer(state);

    default:
      return state;
  }
}

export const commands = {
  initializeModule(store) {
    _store = store;
  },

  navigateTo(key, stepReducer) {
    const state = _store.getState(),
          historyList = state.history.get('history');

    let element = historyList.findIndex(value => value.key === key);

    if (element > -1) {
      //...
    }
    else {
      // the navigation point does not yet exist
      // first, end all the afterwards navigation steps


      // push the new step at the top
      _store.dispatch({ type: SET_HISTORY_STEP, data: { element, key, stepReducer } });
    }
  },

  updateNavigationStep(stepReducer) {
    _store.dispatch({ type: UPDATE_HISTORY_STEP, data: { stepReducer } });
  }
};
