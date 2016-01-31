import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import createHistory from 'history/lib/createHashHistory';

const history = createHistory();

const selectCurrentHistoryStep = createSelector(
    state => state.history.get('history'),
    state => state.history.get('current'),
  (history, current) => {
    return current > -1 ? history.get(current) : undefined;
  }
);

const selectRoute = componentMappings => createSelector(
  selectCurrentHistoryStep,
  step => {
    if (!step) {
      return {
        route: null
      };
    }

    const match = componentMappings.find(e => e.test(step));
    return {
      route: match ? match.component : null,
      step
    };
  }
);

function mapDispatchToProps(/* dispatch */) {
  return {
    navigateToTrip: (trip, date) => {
      history.push(`/trip/${trip}/date/${date.getTime()}`);
    }
  };
}

function mergeProps(stateProps, dispatchProps) {
  return { ...stateProps, ...dispatchProps };
}

export function connectWithRouteSelector(componentMappings, component) {
  return connect(selectRoute(componentMappings), mapDispatchToProps, mergeProps)(component);
}
