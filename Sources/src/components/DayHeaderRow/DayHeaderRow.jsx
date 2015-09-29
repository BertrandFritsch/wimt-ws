import React from 'react';
import theme from './DayHeaderRow.css';

class DayHeaderRow extends React.Component {
  render = () => {
    return (
      <div className="day-header-row">
        <span className="day-header-row-text">{this.props.date.toLocaleString('fr-FR', {weekday: 'long'})}</span>
        <span className="day-header-row-arrow" />
      </div>
    )
  }
}

export default DayHeaderRow;
