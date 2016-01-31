import { connect } from 'react-redux';
import { createSelector } from 'reselect';


const selectTripProps = () => createSelector(
  (_, props) => props.step,
    step => {
      return {
        data: {
          trip: step.get('trip'),
          date: new Date(step.get('time'))
        },
        step
      };
    }
);

function mergeProps(stateProps, dispatchProps) {
  const { data/*, step */ } = stateProps;

  return {
    ...data,
    ...dispatchProps
  };
}

export function connectTrip(component) {
  return connect(selectTripProps(), {}, mergeProps)(component);
};
