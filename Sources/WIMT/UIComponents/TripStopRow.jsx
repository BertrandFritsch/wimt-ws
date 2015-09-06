/** @jsx React.DOM */

var TripStopRow = React.createClass({
  render: function () {
    var me = this,
      hours = Math.floor(this.props.stopTime.time / 60),
      minutes = this.props.stopTime.time - (hours * 60),
      lastStop;

    function onStopTimeSelected() {
      me.props.onStopTimeSelected(me.props.stopTime);
    }

    if (hours >= 24) {
      hours -= 24;
    }

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    return (
      <div className="trip-stop-row">{hours}:{minutes} - {SNCFData.stops[this.props.stopTime.stop].name}</div>
      )
  }
});
