import React from 'react';
import SNCFData from '../SNCFData.jsx';
import { RealTimeStatus } from '../../actions/actions.js'
import theme from './TripHeaderRow.css';

class TripHeaderRow extends React.Component {
  constructor(props) { super(props); }

  render = () => {
    let tripHeaderRowClasses = ['trip-header-row', this.props.status === RealTimeStatus.ONLINE ? 'trip-real-time' : this.props.status === RealTimeStatus.CHECKING ? 'trip-real-time-checking' : 'trip-no-real-time'].join(' ');

    return (
      <div className={tripHeaderRowClasses}>
        <span className="trip-header-row-text">{SNCFData.getTripMission(this.props.trip)} - {SNCFData.getTripNumber(this.props.trip)}</span>
        <span className="trip-header-row-state">{this.props.state}</span>
        <span className="trip-header-row-arrow" />
      </div>
    )
  }
}

export default TripHeaderRow;
