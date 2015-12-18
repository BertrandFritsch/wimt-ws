import React from 'react';
import SNCFData from './../../SNCFData';
import { realTimeStateDisplay } from '../../actions/actions.js';
import './StopTimeRow.css';

const StopTimeRow = React.createClass({
  propTypes: {
    date: React.PropTypes.instanceOf(Date).isRequired,
    trip: React.PropTypes.string.isRequired,
    stop: React.PropTypes.array.isRequired,
    tripState: React.PropTypes.any,
    onStopTimeSelected: React.PropTypes.func.isRequired
  },

  render() {
    const trip = SNCFData.getTripById(this.props.trip);

    return (
      <div className={[ 'stop-time-row', this.props.tripState && 'stop-time-row-real-time' ].join(' ')}
           onClick={() => this.props.onStopTimeSelected(this.props.trip, this.props.date)}>
        <span className="stop-time-row-time">{(SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(SNCFData.getStopStopTimeByTrip(this.props.stop, trip)), this.props.date)).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
        <span className="stop-time-row-time-separator"/>
        <span className="stop-time-row-container">{SNCFData.getTripMission(trip)} - {SNCFData.getTripNumber(trip)} - {SNCFData.getStopName(SNCFData.getStopTimeStop(SNCFData.getTripLastStopTime(trip)))}</span>
        <span className="stop-time-row-state">{realTimeStateDisplay(this.props.tripState)}</span>
      </div>
    );
  }
});

export default StopTimeRow;
