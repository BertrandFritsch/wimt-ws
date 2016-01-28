import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { makeTripStateIndex } from './helpers.js';

const selectTripState = (state, props) => state.tripsStates.get(makeTripStateIndex(props.trip, props.date.getTime()));
const mapTripStateToObject = tripState => ({ tripState: tripState && tripState.toJS() });

export function connectWithTripState(component) {
  return connect(createSelector(selectTripState, mapTripStateToObject), {})(component);
}
