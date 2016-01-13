import React from 'react';
import './DayHeaderRow.css';

const DayHeaderRow = React.createClass({
  propTypes: {
    date: React.PropTypes.object
  },

  render() {
    return (
      <div className="day-header-row">
        <span className="day-header-row-text">{this.props.date.toLocaleString('fr-FR', { weekday: 'long' })}</span>
        <span className="day-header-row-arrow" />
      </div>
    );
  }
});

export default DayHeaderRow;
