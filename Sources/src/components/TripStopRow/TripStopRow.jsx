import React from 'react';
import SNCFData from './../SNCFData';
import theme from './TripStopRow.css';

class TripStopRow extends React.Component {
  constructor(props) { super(props); }

  render = () => {
    let adjustedMinutes = SNCFData.getStopTimeTime(this.props.stopTime) + (this.props.delayedMinutes || 0),
      hours = Math.floor(adjustedMinutes / 60),
      minutes = adjustedMinutes - (hours * 60);

    if (hours >= 24) {
      hours -= 24;
    }

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    let classes = ['trip-time-row-time', this.props.delayedMinutes && 'trip-time-row-time-late' || '', this.props.delayed && 'trip-time-row-time-delayed' || ''].join(' ');
    let rowClasses = ['trip-time-row', this.props.trainHasPassedBy ? 'trip-time-row-passed' : ''].join(' ');
    let top = { transform: `translateY(${this.props.top}px)` };
    return (
        <div className={rowClasses} style={top}>
          <span className={classes}>{hours}:{minutes}</span>
          <span className="trip-time-row-time-separator"/>
          <span className="trip-time-row-container">{SNCFData.getStopUICCode(SNCFData.getStopTimeStop(this.props.stopTime))} - {SNCFData.getStopName(SNCFData.getStopTimeStop(this.props.stopTime))}</span>
        </div>
    );
  }
}

export default TripStopRow;
