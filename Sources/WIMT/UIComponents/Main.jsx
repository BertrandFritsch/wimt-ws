﻿/** @jsx React.DOM */

var SNCFData = {};

var Main = React.createClass({
  loadData: function () {
    var me = this,
      dataToLoad = 4;

    function complete(prop, responseText) {
      SNCFData[prop] = JSON.parse(responseText);

      if (--dataToLoad === 0) {
        me.setState({
          stops: (function () {
            var stops = [], stop;

            for (stop in SNCFData.stops) {
              stops.push(SNCFData.stops[stop]);
            }

            return stops.sort(function (stop1, stop2) {
              return stop1.name < stop2.name ? -1 : 1;
            });
          })(),

          departureStop: SNCFData.stops['8738288']
        });
      }
    }

    // TODO: handle errors
    // TODO: get the data from the script tags
    $.ajax({
      url: 'SNCFData/routes.json',
      complete: function (xhr, status) {
        complete('routes', xhr.responseText);
      }
    });

    $.ajax({
      url: 'SNCFData/services.json',
      complete: function (xhr, status) {
        complete('services', xhr.responseText);
      }
    });

    $.ajax({
      url: 'SNCFData/stops.json',
      complete: function (xhr, status) {
        complete('stops', xhr.responseText);
      }
    });

    $.ajax({
      url: 'SNCFData/trips.json',
      complete: function (xhr, status) {
        complete('trips', xhr.responseText);
      }
    });
  },

  getInitialState: function () {
    var me = this;

    me.loadData();

    return {
      stops: [],
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
            <Trips stops={this.state.stops}
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