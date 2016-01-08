import React from 'react';
import SNCFData from './../../SNCFData';
import { connectToTrainPosition } from '../Trip/TrainPosition';
import { realTimeStateDisplay, RUNNING_TRIP, ARRIVED_TRIP } from '../../store/actions/actions.js';
import './StopTimeLine.css';

const StopTimeLine = connectToTrainPosition(React.createClass({
  propTypes: {
    // invariants -- known at construction time
    date: React.PropTypes.instanceOf(Date).isRequired,
    trip: React.PropTypes.array.isRequired,
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
    const hasTripState = !!(this.props.tripState && this.props.tripState.state);
    const isRunning = hasTripState && (this.props.tripState.state.type === RUNNING_TRIP || this.props.tripState.state.type === ARRIVED_TRIP);
    const stopTime0 = SNCFData.getTripFirstStopTime(this.props.trip);
    const stopTime = isRunning && this.props.tripState.state.stopTime || stopTime0;
    const delayed = isRunning && this.props.tripState.state.delayed || 0;
    const stopTimeTime0 = SNCFData.getStopTimeTime(stopTime0);
    const totalTripTime = SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(this.props.trip)) + delayed - stopTimeTime0;

    return (
      <div className="stop-time-line"
           onClick={() => this.props.onStopTimeSelected(SNCFData.getTripId(this.props.trip), this.props.date)}>
        <div className="stop-time-line-text-container">
          <span className="stop-time-line-container">{
            (SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime) + delayed)).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          } - {
            SNCFData.getTripMission(this.props.trip)
          } - {
            SNCFData.getTripNumber(this.props.trip)
          } - {
            SNCFData.getStopName(SNCFData.getStopTimeStop(stopTime))
          }</span>
          <span className="stop-time-line-state">{hasTripState && realTimeStateDisplay(this.props.tripState.state, false, false)}</span>
        </div>
        <div className="stop-time-line-timeline">
          <div ref="stopsContainer" className="stop-time-line-stop-container">
            {(() => {
              let stopTimeReached = false;

              return SNCFData.getTripStopTimes(this.props.trip).map((st, index) => {
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
