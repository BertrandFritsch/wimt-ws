import React from 'react';

class DayHeaderRow extends React.Component {
  render = () => {
    return <div className="day-header-row">{this.props.date.toLocaleString('fr-FR', { weekday: 'long' })}</div>;
  }
}

export default DayHeaderRow;
