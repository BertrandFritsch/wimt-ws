import React from 'react';
import SNCFData from '../../SNCFData.js';
import DateHelpers from './../../DateHelpers';
import { tripStates } from '../../model/tripsStates/states.js';

/**
 * Connects a component to the computing of the position of a train.
 * @param {ReactClass} Component The component to wrap.
 * @param {function} showTrainPositionTransformer A delegate function to determine the new status of the train position.
 * @returns {ReactClass} The wrapped component.
 */
export function connectToTrainPosition(Component, showTrainPositionTransformer) {
  return React.createClass({
    displayName: 'TrainPosition',

    propTypes: {
      // invariants -- known at construction time
      trip: React.PropTypes.string.isRequired,

      // dynamic state
      tripState: React.PropTypes.any
    },

    getInitialState() {
      return {
        showTrainPosition: 0
      };
    },

    componentWillUnmount() {
      this.cancelTrainPosition = true;
    },

    shouldComponentUpdate(nextProps) {
      // cancel the updating if the position of the train should change
      if (this.state.showTrainPosition === 2 && showTrainPositionTransformer && showTrainPositionTransformer(this.props, nextProps)) {
        this.registerInitialTrainPosition(10).then(() => this.setState({ showTrainPosition: 1 }));
        return false;
      }

      return true;
    },

    render() {
      const trainPosition = (() => {
        const firstStopTime = SNCFData.getTripFirstStopTime(SNCFData.getTripById(this.props.trip));
        const stopTimeTime0 = SNCFData.getStopTimeTime(firstStopTime);
        const hasTripState = !!(this.props.tripState && this.props.tripState.state);
        const isRunning = hasTripState && (this.props.tripState.state.type === tripStates.RUNNING_TRIP || this.props.tripState.state.type === tripStates.ARRIVED_TRIP);
        let hasTrainPosition = hasTripState && (isRunning || this.props.tripState.state.type === tripStates.DELAYED_TRIP);

        if (this.state.showTrainPosition) {
          if (hasTrainPosition) {
            let stopTimeTime = SNCFData.getStopTimeTime(this.props.tripState.state.stopTime) + (this.props.tripState.state.delayed || 0) - stopTimeTime0;
            let now = ((Date.now() - DateHelpers.getDateByMinutes(0)) / (60 * 1000)) - stopTimeTime0;

            if (this.state.showTrainPosition === 1 && !this.initialTrainPositionPromise) {
              this.registerInitialTrainPosition(2000).then(() => this.setState({ showTrainPosition: 2 }));
            }

            return {
              trainPositionDuration: this.state.showTrainPosition === 1 ? 2000 : now < 0 ? 0 : Math.max(0, stopTimeTime - now) * 60 * 1000,
              trainPosition: this.state.showTrainPosition === 1 ? Math.min(Math.max(0, now), stopTimeTime) : stopTimeTime,
              trainAnimationClass: this.state.showTrainPosition === 1 ? 'train-position-initial-animation' : 'train-position-progression-animation'
            };
          }
        }
        else if (!this.initialTrainPositionPromise) {
          this.registerInitialTrainPosition(10).then(() => this.setState({ showTrainPosition: 1 }));
        }
      })();

      return (
        <Component {...this.props} {...this.state} {...trainPosition} />
      );
    },

    registerInitialTrainPosition(timeout) {
      this.initialTrainPositionPromise = new Promise(resolve => {
        setTimeout(() => {
          delete this.initialTrainPositionPromise;
          if (!this.cancelTrainPosition) {
            resolve();
          }
        }, timeout);
      });
      this.cancelTrainPosition = false;
      return this.initialTrainPositionPromise;
    }
  });
}
