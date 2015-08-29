/** @jsx React.DOM */

var Main = React.createClass({
  getDefaultProps: function () {
    return {
      stops: (function () {
        var stops = [], stop;

        for (stop in Stops) {
          stops.push(Stops[stop]);
        }

        return stops.sort(function (stop1, stop2) {
          return stop1.name < stop2.name ? -1 : 1;
        });
      })()
    };
  },

  getInitialState: function () {
    return {
      departureStop: null,
      arrivalStop: null
    };
  },

  onDepartureStopChange: function (stop) {
    this.setState({
      departureStop: stop
    });
  },

  onArrivalStopChange: function (stop) {
    this.setState({
      arrivalStop: stop
    });
  },

  render: function () {
    return (
        <div id="gGridLayoutRoot"
             className="gLayoutMeasuring"
             data-g-layout-container="">
          <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true' />
          <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true'
               data-g-layout-policy='"widthPolicy": "Container", "widthHint": "600px"'
               className="root-container">
            <Trips stops={this.props.stops}
                  departureStop={this.state.departureStop}
                  arrivalStop={this.state.arrivalStop}
                  onDepartureStopChange={this.onDepartureStopChange}
                  onArrivalStopChange={this.onArrivalStopChange} />
          </div>
          <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true' />
        </div>
      )
  }
});
