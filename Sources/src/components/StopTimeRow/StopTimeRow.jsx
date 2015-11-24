import React from 'react';
import SNCFData from './../SNCFData';
import theme from './StopTimeRow.css';

class StopTimeRow extends React.Component {
  constructor(props) { super(props); }

  render = () => {
    var hours = Math.floor(SNCFData.getStopTimeTime(this.props.stopTime) / 60),
      minutes = SNCFData.getStopTimeTime(this.props.stopTime) - (hours * 60);

    let onStopTimeSelected = () => {
      this.props.onStopTimeSelected(this.props.stopTime, this.props.date);
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

    let lastStop = SNCFData.getStopName(SNCFData.getStopTimeStop(SNCFData.getTripLastStopTime(SNCFData.getStopTimeTrip(this.props.stopTime))));
    let realTimeClass = this.props.realTime ? 'stop-time-row-real-time' : '';

    return <div className={'stop-time-row' + ' ' + realTimeClass} theme={theme} onClick={onStopTimeSelected}>
      <span className="stop-time-row-time">{hours}:{minutes}</span><span className="stop-time-row-time-separator" /><span className="stop-time-row-container">{SNCFData.getTripMission(SNCFData.getStopTimeTrip(this.props.stopTime))} - {SNCFData.getTripNumber(SNCFData.getStopTimeTrip(this.props.stopTime))} - {lastStop}</span>
    </div>
  }
}

export default StopTimeRow;
