import Immutable from 'immutable';
import assert from 'assert';
import { take, fork, put } from 'redux-saga';

/**
 * history structure
 *
 * {
 *   history: <immutable-js list>,
 *   current: <number>
 * }
 */

//************** constants

const NAVIGATE_TO = 'NAVIGATE_TO';
const SET_HISTORY_STEP = 'SET_HISTORY_STEP';
const UPDATE_HISTORY_STEP = 'UPDATE_HISTORY_STEP';
const APPLY_EVENT_TO_HISTORY_STEP = 'APPLY_EVENT_TO_HISTORY_STEP';

//************** reducers

const emptyList = Immutable.List();

const emptyState = Immutable.Map({
  history: emptyList,
  current: -1
});

let reducers = {
  [SET_HISTORY_STEP](state, { element, key, stepReducer }) {
    // updates the history, delegates the update of the navigation step
    const { newState, newValue } = stepReducer(state);

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
  },

  [UPDATE_HISTORY_STEP](state, { step, stepReducer }) {
    return state.update('history', history => history.set(history.indexOf(step), stepReducer(step)));
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

//************** actions

export const actions = {
  navigateTo(key) {
    return { type: NAVIGATE_TO, data: { key } };
  },

  applyEventToStep(key, event) {
    return { type: APPLY_EVENT_TO_HISTORY_STEP, data: { key, event } };
  }
};

//************** sagas

function* navigateTo(getHistory) {
  while (true) {
    const { data: { key, stepReducer } } = yield take(NAVIGATE_TO);

    const historyList = getHistory();

    let element = historyList.findIndex(value => value.get('key') === key);

    if (element > -1) {
      //...
    }
    else {
      // the navigation point does not yet exist
      // first, end all the afterwards navigation steps

      yield put({ type: SET_HISTORY_STEP, data: { element, key, stepReducer } });
    }
  }
}

function* applyEventToStep(getHistory) {
  while (true) {
    const { data: { key, event: { type, data } } } = yield take(APPLY_EVENT_TO_HISTORY_STEP);

    const historyList = getHistory();

    let element = historyList.findIndex(value => value.get('key') === key);
    assert(element > -1, "The history step should exist!");

    yield put({ type, data: { ...data, step: historyList.get(element), nextEvent: { type: UPDATE_HISTORY_STEP } } });
  }
}

export function* sagas(getState) {
  const getHistory = () => getState().history.get('history');

  yield fork(navigateTo, getHistory);
  yield fork(applyEventToStep, getHistory);
}
