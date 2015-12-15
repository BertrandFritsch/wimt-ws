import React from 'react';
import SNCFData from './../../SNCFData';
import './StopTimeRow.css';

function stopTimeProp(numberOfElements, isRequired) {
  return function stopTimeProp(props, propName /*, componentName */) {
    if (props[propName] && props[propName].length !== numberOfElements) {
      return new Error('Bad number of stop time elements!');
    }

    // make the stopTime required here as the chained validator method - createChainableTypeChecker - is not exposed by the react framework
    if (isRequired && !props[propName]) {
      return new Error(`${propName} is required!`);
    }
  };
}

const StopTimeRow = React.createClass({
  propTypes: {
    date: React.PropTypes.instanceOf(Date).isRequired,
    stopTime: stopTimeProp(3, true),
    displayStopTime: stopTimeProp(2, true),
    realTimeState: React.PropTypes.string,
    onStopTimeSelected: React.PropTypes.func
  },

  render() {
    var hours   = Math.floor(SNCFData.getStopTimeTime(this.props.stopTime) / 60),
        minutes = SNCFData.getStopTimeTime(this.props.stopTime) - (hours * 60);

    if (hours >= 24) {
      hours -= 24;
    }

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    const displayStop = SNCFData.getStopName(SNCFData.getStopTimeStop(this.props.displayStopTime));

    return (
      <div className={[ 'stop-time-row', this.props.realTimeState && 'stop-time-row-real-time' ].join(' ')}
           onClick={() => this.props.onStopTimeSelected(this.props.stopTime, this.props.date)}>
        <span className="stop-time-row-time">{hours}:{minutes}</span>
        <span className="stop-time-row-time-separator"/>
      <span
        className="stop-time-row-container">{SNCFData.getTripMission(SNCFData.getTrip(SNCFData.getStopTimeTrip(this.props.stopTime)))} - {SNCFData.getTripNumber(SNCFData.getTrip(SNCFData.getStopTimeTrip(this.props.stopTime)))} - {displayStop}</span>
        <span className="stop-time-row-state">{this.props.realTimeState}</span>
      </div>
    );
  }
});

export default StopTimeRow;
