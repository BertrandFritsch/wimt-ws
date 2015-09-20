import React from 'react';
import SNCFData from './SNCFData';

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

    return <div className="trip-stop-row">{hours}:{minutes} - {SNCFData.stops[this.props.stopTime.stop].name}</div>
  }
}

export default TripStopRow;
