/** @jsx React.DOM */

var Trips = React.createClass({
  render: function () {
    var me = this,
        departureStops = me.props.stops,
        arrivalStops,
        startStopTimes;

    function onStopChange(stop, eventToCall) {
      var index;

      //TODO: ensure the name has been found
      me.props[eventToCall](stop);
    }

    function onDepartureStopChange(stop) {
      onStopChange(stop, 'onDepartureStopChange');
    }

    function onArrivalStopChange(stop) {
      onStopChange(stop, 'onArrivalStopChange');
    }

    if (me.props.departureStop) {
      // filter the possible arrival stops
      arrivalStops = (function () {
        var stopsMap;

        // use a map to make stops being unique
        stopsMap = me.props.departureStop.getTrips().reduce(function (res, trip) {
          return trip.getStopTimes().reduce(function (res, stopTime) {
            // !!! stop object references cannot be compared as they are two distinct objects !!!
            if (stopTime.stop.id !== me.props.departureStop.id) {
              res[stopTime.stop.id] = stopTime.stop;
            }

            return res;
          }, res)
        }, {});

        // use the initial stops list to keep the arrival stop list sorted
        return departureStops.filter(function (stop) {
          return stopsMap[stop.id] !== undefined;
        });
      })();

      startStopTimes = me.props.departureStop.getStopTimes();
    }
    else {
      arrivalStops = departureStops;
    }

    return (
        <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false' className="main-frame">
          <div data-g-layout-item='"row": 0'>
            <AutoCompleteSelector ref="from"
                                  placeholder="De..."
                                  data={departureStops}
                                  value={this.props.departureStop}
                                  onStopChange={onDepartureStopChange} />
          </div>
          <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
            <SelectedTrips departureStop={this.props.departureStop}
                           startStopTimes={startStopTimes}
                           arrivalStop={this.props.arrivalStop} />
          </div>
          <div data-g-layout-item='"row": 2'>
            <AutoCompleteSelector ref="to"
                                  placeholder="Vers..."
                                  data={arrivalStops}
                                  value={this.props.arrivalStop}
                                  onStopChange={onArrivalStopChange} />
          </div>
        </div>
      )
  }
});
