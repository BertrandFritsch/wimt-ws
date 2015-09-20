import React from 'react';
import SNCFData from './SNCFData';

class StopTimeRow extends React.Component {
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

    lastStop = SNCFData.stops[SNCFData.trips[this.props.stopTime.trip].stopTimes[SNCFData.trips[this.props.stopTime.trip].stopTimes.length - 1].stop].name;

    return <div className="stop-time-row" onClick={onStopTimeSelected}>{hours}:{minutes} - {SNCFData.trips[this.props.stopTime.trip].mission} - {lastStop}</div>
  }
}

export default StopTimeRow;
