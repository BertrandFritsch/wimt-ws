﻿import React from 'react';
import TripHeaderRow from './../TripHeaderRow/TripHeaderRow';
import TripStopRow from './../TripStopRow/TripStopRow';
import SNCFData from '../../SNCFData.js';
//import { updateDebuggingInfo } from '../../actions/actions.js';
import { realTimeStateDisplay, RUNNING_TRIP, DELAYED_TRIP, ARRIVED_TRIP } from '../../actions/actions.js';
import { connectToTrainPosition } from './TrainPosition';
import './Trip.css';

const PIXELS_PER_MINUTE = 15;

const Trip = connectToTrainPosition(React.createClass({
  propTypes: {
    // invariants -- known at construction time
    trip: React.PropTypes.array.isRequired,

    // dynamic state
    showTrainPosition: React.PropTypes.number.isRequired,
    tripState: React.PropTypes.any,
    trainPosition: React.PropTypes.number,
    trainPositionDuration: React.PropTypes.number,
    trainAnimationClass: React.PropTypes.string
  },

  render() {
    const hasTripState = !!(this.props.tripState && this.props.tripState.state);
    const isRunning = hasTripState && (this.props.tripState.state.type === RUNNING_TRIP || this.props.tripState.state.type === ARRIVED_TRIP);
    const stopTimeTime0 = SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.props.trip));
    const tripContainerStyles = {
      height: (SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(this.props.trip)) + (isRunning && this.props.showTrainPosition > 0 && this.props.tripState.state.delayed || 0) - stopTimeTime0) * PIXELS_PER_MINUTE
    };

    return (
      <div data-g-layout-container='' className="trip-frame">
        <div data-g-layout-item='"row": 0'>
          <TripHeaderRow trip={this.props.trip}
                         state={hasTripState && realTimeStateDisplay(this.props.tripState.state)}
                         status={hasTripState && this.props.tripState.realTimeStatus}/>

          <div className="trip-frame-top-space"/>
        </div>
        <div ref="tripScrollEl" style={{ overflowY: 'auto' }} data-g-layout-item='"row": 1, "isXSpacer": true'
             data-g-layout-policy='"heightHint": "*", "heightPolicy": "Fixed"'>
          <div className="trip-frame-center">
            <div className="trip-timeline"/>
            <div className="trip-container" style={tripContainerStyles}>
              {(() => {
                let stopTimeReached = false;
                const stopTime = isRunning && this.props.tripState.state.stopTime;
                const delayed = isRunning && this.props.tripState.state.delayed || 0;
                return SNCFData.getTripStopTimes(this.props.trip).map((st, index) => {
                  stopTimeReached = stopTimeReached || st === stopTime;
                  const gap = SNCFData.getStopTimeTime(st) + (stopTimeReached && this.props.showTrainPosition > 0 ? delayed : 0) - stopTimeTime0;

                  return (<TripStopRow key={index} top={gap * PIXELS_PER_MINUTE} stopTime={st}
                                      delayedMinutes={delayed}
                                      delayed={hasTripState && this.props.tripState.state.type === DELAYED_TRIP || false}
                                      trainHasPassedBy={!stopTimeReached && st !== stopTime} />);
                });
              })()}
              {(() => {
                return (
                  <div className={[ 'trip-train-frame', this.props.trainAnimationClass || '' ].join(' ')} style={this.props.trainPosition && {
                    transitionDuration: `${this.props.trainPositionDuration}ms`,
                    transform: `translateY(${this.props.trainPosition * PIXELS_PER_MINUTE}px)`
                  } || null}>
                    <div className={this.props.trainPosition !== undefined && 'trip-train-position'}/>
                  </div>
                );
              })()
              }
            </div>
          </div>
        </div>
        <div data-g-layout-item='"row": 2'>
          <div className="trip-frame-bottom-space"/>
        </div>
      </div>
    );
  }
}));

export default Trip;
