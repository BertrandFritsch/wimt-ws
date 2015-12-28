import React from 'react';
import SNCFData from '../../SNCFData.js';
import { DELAYED_TRIP, RUNNING_TRIP, ARRIVED_TRIP } from '../../actions/actions.js';

export function connectToTrainPosition(Component) {
  return React.createClass({
    displayName: 'TrainPosition',

    propTypes: {
      // invariants -- known at construction time
      trip: React.PropTypes.array.isRequired,

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

    render() {
      const trainPosition = (() => {
        const firstStopTime = SNCFData.getTripFirstStopTime(this.props.trip);
        const stopTimeTime0 = SNCFData.getStopTimeTime(firstStopTime);
        const hasTripState = !!(this.props.tripState && this.props.tripState.state);
        const isRunning = hasTripState && (this.props.tripState.state.type === RUNNING_TRIP || this.props.tripState.state.type === ARRIVED_TRIP);
        let hasTrainPosition = hasTripState && (isRunning || this.props.tripState.state.type === DELAYED_TRIP);

        if (this.state.showTrainPosition) {
          if (hasTrainPosition) {
            let stopTimeTime = SNCFData.getStopTimeTime(this.props.tripState.state.stopTime) + (this.props.tripState.state.delayed || 0) - stopTimeTime0;
            let now = ((Date.now() - SNCFData.getDateByMinutes(0)) / (60 * 1000)) - stopTimeTime0;

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
