import React from 'react';
import SNCFData from '../../SNCFData.js';
import { RealTimeStatus } from '../../store/tripsStates/states.js';
import './TripHeaderRow.css';

const TripHeaderRow = React.createClass({
  propTypes: {
    status: React.PropTypes.any,
    state: React.PropTypes.string,
    trip: React.PropTypes.array
  },

  render() {
    let tripHeaderRowClasses = [ 'trip-header-row', this.props.status === RealTimeStatus.ONLINE ? 'trip-real-time' : this.props.status === RealTimeStatus.CHECKING ? 'trip-real-time-checking' : 'trip-no-real-time' ].join(' ');

    return (
      <div className={tripHeaderRowClasses}>
        <span className="trip-header-row-text">{SNCFData.getTripMission(this.props.trip)} - {SNCFData.getTripNumber(this.props.trip)}</span>
        <span className="trip-header-row-state">{this.props.state}</span>
        <span className="trip-header-row-arrow" />
      </div>
    );
  }
});

export default TripHeaderRow;
