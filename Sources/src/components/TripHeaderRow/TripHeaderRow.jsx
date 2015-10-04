import React from 'react';
import theme from './TripHeaderRow.css';

class TripHeaderRow extends React.Component {
  render = () => {
    return (
      <div className="trip-header-row">
        <span className="trip-header-row-text">{this.props.trip.mission}</span>
        <span className="trip-header-row-state">{this.props.state}</span>
        <span className="trip-header-row-arrow" />
      </div>
    )
  }
}

export default TripHeaderRow;
