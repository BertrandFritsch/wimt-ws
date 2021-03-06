﻿import React from 'react';
import SNCFData from './../../SNCFData';
import DateHelpers from './../../DateHelpers';
import { connectToTrainPosition } from '../Trip/TrainPosition';
import { realTimeStateDisplay } from '../formatters.js';
import { tripStates } from '../../model/tripsStates/states.js';
import './StopTimeLine.css';

const StopTimeLine = connectToTrainPosition(React.createClass({
  propTypes: {
    // invariants -- known at construction time
    date: React.PropTypes.instanceOf(Date).isRequired,
    trip: React.PropTypes.string.isRequired,
    onStopTimeSelected: React.PropTypes.func.isRequired,
    onLayoutElementAdded: React.PropTypes.func.isRequired,
    onLayoutElementRemoved: React.PropTypes.func.isRequired,

    // dynamic state
    tripState: React.PropTypes.any,
    stopsContainerWidth: React.PropTypes.number.isRequired,
    showTrainPosition: React.PropTypes.number.isRequired,
    trainPosition: React.PropTypes.number,
    trainPositionDuration: React.PropTypes.number,
    trainAnimationClass: React.PropTypes.string
  },

  componentDidMount() {
    this.props.onLayoutElementAdded(this.refs.stopsContainer);
  },

  componentWillUnmount() {
    this.props.onLayoutElementRemoved(this.refs.stopsContainer);
  },

  shouldComponentUpdate(nextProps) {
    return this.props.tripState !== nextProps.tripState || this.props.stopsContainerWidth !== nextProps.stopsContainerWidth || this.props.showTrainPosition !== nextProps.showTrainPosition;
  },

  render() {
    const trip = SNCFData.getTripById(this.props.trip),
          hasTripState = !!(this.props.tripState && this.props.tripState.state),
          isRunning = hasTripState && (this.props.tripState.state.type === tripStates.RUNNING_TRIP || this.props.tripState.state.type === tripStates.ARRIVED_TRIP),
          stopTime0 = SNCFData.getTripFirstStopTime(trip),
          stopTime = isRunning && this.props.tripState.state.stopTime || stopTime0,
          delayed = isRunning && this.props.tripState.state.delayed || 0,
          stopTimeTime0 = SNCFData.getStopTimeTime(stopTime0),
          totalTripTime = SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(trip)) + delayed - stopTimeTime0;

    return (
      <div className="stop-time-line"
           onClick={() => this.props.onStopTimeSelected(SNCFData.getTripId(trip), this.props.date)}>
        <div className="stop-time-line-text-container">
          <span className="stop-time-line-container">{
            (DateHelpers.getDateByMinutes(SNCFData.getStopTimeTime(stopTime) + delayed)).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          } - {
            SNCFData.getTripMission(trip)
          } - {
            SNCFData.getTripNumber(trip)
          } - {
            SNCFData.getStopName(SNCFData.getStopTimeStop(stopTime))
          }</span>
          <span className="stop-time-line-state">{hasTripState && realTimeStateDisplay(this.props.tripState.state, false, false)}</span>
        </div>
        <div className="stop-time-line-timeline">
          <div ref="stopsContainer" className="stop-time-line-stop-container">
            {(() => {
              let stopTimeReached = false;

              return SNCFData.getTripStopTimes(trip).map((st, index) => {
                stopTimeReached = stopTimeReached || st === stopTime;
                const gap = (SNCFData.getStopTimeTime(st) + (stopTimeReached && this.props.showTrainPosition > 0 ? delayed : 0) - stopTimeTime0) * this.props.stopsContainerWidth / totalTripTime;

                return (<div key={index} className="stop-time-line-stop" style={{ transform: `translateX(${gap}px)` }}/>);
              });
            })()}
            {(() => {
              return (
                <div key="trainPosition"
                     className={[ 'stop-time-line-train-position', this.props.trainAnimationClass || '' ].join(' ')}
                     style={this.props.trainPosition && {
                       transitionDuration: `${this.props.trainPositionDuration}ms`,
                       transform: `translateX(${this.props.trainPosition * this.props.stopsContainerWidth / totalTripTime}px)`
                     } || null}/>
              );
            })()}
          </div>
        </div>
      </div>
    );
  }
}), function (props, nextProps) {
  // reset the status of the train position if the width of the container does change
  return props.stopsContainerWidth !== nextProps.stopsContainerWidth;
});

export default StopTimeLine;
