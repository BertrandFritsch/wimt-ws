import React from 'react';
import SNCFData from './../../SNCFData';
import DateHelpers from './../../DateHelpers';
import { realTimeStateDisplay } from '../formatters.js';
import './StopTimeRow.css';

const StopTimeRow = React.createClass({
  propTypes: {
    // invariants -- known at construction time
    date: React.PropTypes.instanceOf(Date).isRequired,
    trip: React.PropTypes.string.isRequired,
    stop: React.PropTypes.array.isRequired,
    onStopTimeSelected: React.PropTypes.func.isRequired,

    // dynamic state
    tripState: React.PropTypes.any
  },

  render() {
    const trip = SNCFData.getTripById(this.props.trip),
          tripState = this.props.tripState && this.props.tripState.state;

    return (
      <div className={[ 'stop-time-row', tripState && 'stop-time-row-real-time' ].join(' ')}
           onClick={() => this.props.onStopTimeSelected(this.props.trip, this.props.date)}>
        <span className="stop-time-row-time">{(DateHelpers.getDateByMinutes(SNCFData.getStopTimeTime(SNCFData.getStopStopTimeByTrip(this.props.stop, trip)), this.props.date)).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="stop-time-row-time-separator"/>
        <span className="stop-time-row-container">{SNCFData.getTripMission(trip)} - {SNCFData.getTripNumber(trip)} - {SNCFData.getStopName(SNCFData.getStopTimeStop(SNCFData.getTripLastStopTime(trip)))}</span>
        <span className="stop-time-row-state">{realTimeStateDisplay(tripState, false, false)}</span>
      </div>
    );
  }
});

export default StopTimeRow;
