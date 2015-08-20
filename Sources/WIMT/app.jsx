/** @jsx React.DOM */

var AutoCompleteSelector = React.createClass({
  getDefaultProps: function () {
    return {
      placeholder: '',
      data: []
    }
  },

  componentDidMount: function () {
    var me = this;

    $(this.getDOMNode()).kendoAutoComplete({
      placeholder: this.props.placeholder,
      dataSource: this.props.data,
      filter: 'contains',
      select: function (e) {
        me.props.onStopChange(this.dataItem(e.item.index()));
      }
    });
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
      stops = this.props.stops.map(function (stop) {
      return stop.name;
    });

    function onStopChange(stopName, eventToCall) {
      var index;

      index = stops.indexOf(stopName);
      //TODO: ensure the name has been found
      me.props[eventToCall](me.props.stops[index]);
    }

    function onDepartureStopChange(stopName) {
      onStopChange(stopName, 'onDepartureStopChange');
    }

    function onArrivalStopChange(stopName) {
      onStopChange(stopName, 'onArrivalStopChange');
    }

    return (
        <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false' className="main-frame">
          <div data-g-layout-item='"row": 0'>
            <AutoCompleteSelector ref="from"
                                  placeholder="De..."
                                  data={stops}
                                  onStopChange={onDepartureStopChange}
                                   />
          </div>
          <div data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true' />
          <div data-g-layout-item='"row": 2'>
            <AutoCompleteSelector ref="to"
                                  placeholder="Vers..."
                                  data={stops}
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

  getInitialState: function() {
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
