import React from 'react';
import SNCFData from './../SNCFData';
import theme from './TripStopRow.css';

class TripStopRow extends React.Component {
  render = () => {
    var hours = Math.floor(this.props.stopTime.time / 60),
      minutes = this.props.stopTime.time - (hours * 60),
      lastStop;

    let onStopTimeSelected = () => {
      this.props.onStopTimeSelected(this.props.stopTime);
    }

    if (hours >= 24) {
      hours -= 24;
    }

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    return <div className={'trip-time-row'} theme={theme}>
      <span className="trip-time-row-time">{hours}:{minutes}</span><span className="trip-time-row-time-separator" /><span className="trip-time-row-container">{SNCFData.stops[this.props.stopTime.stop].name}</span>
    </div>
  }
}

export default TripStopRow;
