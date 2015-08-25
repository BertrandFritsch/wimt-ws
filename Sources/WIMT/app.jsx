/** @jsx React.DOM */

var AutoCompleteSelector = React.createClass({
  getDefaultProps: function () {
    return {
      placeholder: '',
      data: [],
      value: null
    }
  },

  componentDidMount: function () {
    var me = this;

    $(this.getDOMNode()).kendoAutoComplete({
      placeholder: this.props.placeholder,
      dataSource: this.props.data,
      value: this.props.value,
      dataTextField: 'name',
      filter: 'contains',
      select: function (e) {
        me.props.onStopChange(this.dataItem(e.item.index()));
      }
    });
  },

  componentWillReceiveProps: function (nextProps) {
    if(nextProps.data !== this.props.data) {
      $(this.getDOMNode()).data("kendoAutoComplete").dataSource.data(nextProps.data);
    }

    if (nextProps.value !== this.props.value) {
      $(this.getDOMNode()).data("kendoAutoComplete").value(nextProps.value);
    }
  },

  render: function () {
    return (
      <input style={{width:100 + '%'}} />
      )
  }
});

var Trips = React.createClass({
  render: function () {
    var me = this,
        departureStops = me.props.stops,
        arrivalStops;

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
          <div data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true' />
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

React.render(<Main />, document.body);
GridLayout.initialize();
