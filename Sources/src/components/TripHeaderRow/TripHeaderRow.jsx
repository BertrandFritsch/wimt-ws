import React from 'react';
import theme from './TripHeaderRow.css';

class TripHeaderRow extends React.Component {
  render = () => {
    return (
      <div className="trip-header-row">
        <span className="trip-header-row-text">{this.props.trip.mission}</span>
      </div>
    )
  }
}

export default TripHeaderRow;
