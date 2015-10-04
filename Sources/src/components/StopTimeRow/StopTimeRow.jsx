import React from 'react';
import SNCFData from './../SNCFData';
import theme from './StopTimeRow.css';

class StopTimeRow extends React.Component {
  render = () => {
    var hours = Math.floor(this.props.stopTime.time / 60),
      minutes = this.props.stopTime.time - (hours * 60);

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

    let lastStop = SNCFData.getStop(SNCFData.getTrip(this.props.stopTime.trip).stopTimes[SNCFData.getTrip(this.props.stopTime.trip).stopTimes.length - 1].stop).name;
    let realTimeClass = this.props.realTime ? 'stop-time-row-real-time' : '';

    return <div className={'stop-time-row' + ' ' + realTimeClass} theme={theme} onClick={onStopTimeSelected}>
      <span className="stop-time-row-time">{hours}:{minutes}</span><span className="stop-time-row-time-separator" /><span className="stop-time-row-container">{SNCFData.getTrip(this.props.stopTime.trip).mission} - {lastStop}</span>
    </div>
  }
}

export default StopTimeRow;
