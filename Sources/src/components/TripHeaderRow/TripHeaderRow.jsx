import React from 'react';
import SNCFData from '../SNCFData.jsx';
import theme from './TripHeaderRow.css';

class TripHeaderRow extends React.Component {
  constructor(props) { super(props); }

  render = () => {
    return (
      <div className="trip-header-row">
        <span className="trip-header-row-text">{SNCFData.getTripMission(this.props.trip)} - {SNCFData.getTripNumber(this.props.trip)}</span>
        <span className="trip-header-row-state">{this.props.state}</span>
        <span className="trip-header-row-arrow" />
      </div>
    )
  }
}

export default TripHeaderRow;
