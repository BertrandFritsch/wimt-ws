import React from 'react';
import SNCFData from './../../SNCFData';
import './TripStopRow.css';

const TripStopRow = React.createClass({
  propTypes: {
    // invariants -- known at construction time
    stopTime: React.PropTypes.array.isRequired,

    // dynamic state
    top: React.PropTypes.number.isRequired,
    delayedMinutes: React.PropTypes.number,
    delayed: React.PropTypes.bool,
    trainHasPassedBy: React.PropTypes.bool
  },

  render() {
    let classes = [ 'trip-time-row-time', this.props.delayedMinutes && 'trip-time-row-time-late' || '', this.props.delayed && 'trip-time-row-time-delayed' || '' ].join(' ');
    let rowClasses = [ 'trip-time-row', this.props.trainHasPassedBy ? 'trip-time-row-passed' : '' ].join(' ');
    let top = { transform: `translateY(${this.props.top}px)` };
    return (
        <div className={rowClasses} style={top}>
          <span className={classes}>{(SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(this.props.stopTime) + (this.props.delayedMinutes || 0))).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="trip-time-row-time-separator"/>
          <span className="trip-time-row-container">{SNCFData.getStopUICCode(SNCFData.getStopTimeStop(this.props.stopTime))} - {SNCFData.getStopName(SNCFData.getStopTimeStop(this.props.stopTime))}</span>
        </div>
    );
  }
});

export default TripStopRow;
