import React from 'react';
import SNCFData from './../SNCFData';
import theme from './TripStopRow.css';

class TripStopRow extends React.Component {
  render = () => {
    let adjustedMinutes = this.props.stopTime.time + (this.props.delayedMinutes ||0),
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

    let classes = ['trip-time-row-time', this.props.delayedMinutes && ' trip-time-row-time-late' || '', this.props.delayed && ' trip-time-row-time-delayed' || ''];

    return <div className={'trip-time-row'} theme={theme}>
      <span className={classes.join('')}>{hours}:{minutes}</span><span className="trip-time-row-time-separator" /><span className="trip-time-row-container">{SNCFData.getStop(this.props.stopTime.stop).name}</span>
    </div>
  }
}

export default TripStopRow;
