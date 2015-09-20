import React from 'react';
import $ from 'jquery';
import SNCFData from './SNCFData';
import Trips from './Trips';
import Trip from './Trip';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.loadData();
    this.setUpHistoryNavigation();
  }

  state = {
    stops: [],
    departureStop: null,
    arrivalStop: null
  }

  render = () => {
    return (
      <div id="gGridLayoutRoot"
           className="gLayoutMeasuring"
           data-g-layout-container="">
        <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true' />
        <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true'
             data-g-layout-policy='"widthPolicy": "Container", "widthHint": "600px"'
             className="root-container">
          <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false'>
            <Trips stops={this.state.stops}
                   departureStop={this.state.departureStop}
                   arrivalStop={this.state.arrivalStop}
                   onDepartureStopChange={this.onDepartureStopChange}
                   onArrivalStopChange={this.onArrivalStopChange}
                   onStopTimeSelected={this.onStopTimeSelected} />
            {(() => {
              if (this.state.selectedStopTime) {
                return <Trip trip={SNCFData.trips[this.state.selectedStopTime.trip]} selectedStopTime={this.state.selectedStopTime} />;
              }
            })()}
          </div>
        </div>
        <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true' />
      </div>
    )
  }

  loadData = () => {
    var dataToLoad = 4;

    let complete = (prop, responseText) => {
      SNCFData[prop] = JSON.parse(responseText);

      if (--dataToLoad === 0) {
        this.setState({
          stops: (() => {
            var stops = [], stop;

            for (stop in SNCFData.stops) {
              stops.push(SNCFData.stops[stop]);
            }

            return stops.sort((stop1, stop2) => stop1.name < stop2.name ? -1 : 1);
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
  }

  setUpHistoryNavigation = () => {
    window.addEventListener('popstate', (event) => {
      event.preventDefault();
      
      this.setState({
        selectedStopTime: event.state && event.state.selectedStopTime
      });
    });
  }

  onDepartureStopChange = (stop) => {
    this.setState({
      departureStop: stop
    });
  }

  onArrivalStopChange = (stop) => {
    this.setState({
      arrivalStop: stop
    });
  }

  onStopTimeSelected = (stopTime) => {
    this.setState({
      selectedStopTime: stopTime
    });

    window.history.pushState({
      selectedStopTime: stopTime
    }, 'Voyage d\'un train', '#selectedTrip');
  }
}

export default Main;
