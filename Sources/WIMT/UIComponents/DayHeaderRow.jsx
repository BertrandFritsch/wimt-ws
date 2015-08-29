/** @jsx React.DOM */

var DayHeaderRow = React.createClass({
  render: function () {
    return (
      <div className="day-header-row">{this.props.date.toLocaleString('fr-FR', { weekday: 'long' })}</div>
      )
  }
});
