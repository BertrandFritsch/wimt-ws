import React from 'react';
import SNCFData from './../../SNCFData';
import { realTimeStateDisplay } from '../../actions/actions.js';
import './StopTimeLine.css';

const StopTimeLine = React.createClass({
  propTypes: {
    date: React.PropTypes.instanceOf(Date).isRequired,
    trip: React.PropTypes.string.isRequired,
    tripState: React.PropTypes.any,
    stopsContainerWidth: React.PropTypes.number.isRequired,
    onStopTimeSelected: React.PropTypes.func.isRequired,
    onLayoutElementAdded: React.PropTypes.func.isRequired,
    onLayoutElementRemoved: React.PropTypes.func.isRequired
  },

  componentDidMount() {
    this.props.onLayoutElementAdded(this.refs.stopsContainer);
  },

  componentWillUnmount() {
    this.props.onLayoutElementRemoved(this.refs.stopsContainer);
  },

  render() {
    const trip = SNCFData.getTripById(this.props.trip);
    const stopTime = this.props.tripState && this.props.tripState.stopTime;
    const delayed = this.props.tripState && this.props.tripState.delayed || 0;
    const firstStopTime = SNCFData.getTripFirstStopTime(trip);
    const firstStopTimeTime = SNCFData.getStopTimeTime(firstStopTime);
    const totalTripTime = SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(trip)) + delayed - firstStopTimeTime;
    const stops = (() => {
      let stopTimeReached = false;
      return SNCFData.getTripStopTimes(trip).map(s => {
        stopTimeReached = stopTimeReached || s === stopTime;
        return {
          position: (SNCFData.getStopTimeTime(s) + (stopTimeReached && delayed || 0) - firstStopTimeTime) * this.props.stopsContainerWidth / totalTripTime
        };
      });
    })();

    return (
      <div className="stop-time-line"
           onClick={() => this.props.onStopTimeSelected(this.props.trip, this.props.date)}>
        <div className="stop-time-line-text-container">
          <span className="stop-time-line-container">{
            (SNCFData.getDateByMinutes((stopTime && SNCFData.getStopTimeTime(stopTime) || firstStopTimeTime) + delayed)).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          } - {
            SNCFData.getTripMission(trip)
          } - {
            SNCFData.getTripNumber(trip)
          } - {
            SNCFData.getStopName(SNCFData.getStopTimeStop(stopTime || firstStopTime))
          }</span>
          <span className="stop-time-line-state">{realTimeStateDisplay(this.props.tripState, false)}</span>
        </div>
        <div className="stop-time-line-timeline">
          <div ref="stopsContainer" className="stop-time-line-stop-container">
            {(() => {
              return stops.map((stop, index) => {
                return (<div key={index} className="stop-time-line-stop" style={{ transform: `translateX(${stop.position}px)` }}/>);
              });
            })()}
            {(() => {
              if (stopTime) {
                const now = ((Date.now() - SNCFData.getDateByMinutes(0)) / (60 * 1000));
                const trainPosition = Math.max(0, now - firstStopTimeTime) * this.props.stopsContainerWidth / totalTripTime || 0;
                return (<div key="trainPosition" className="stop-time-line-train-position" style={{ transform: `translateX(${trainPosition}px)` }}/>);
              }
            })()}
          </div>
        </div>
      </div>
    );
  }
});

export default StopTimeLine;
