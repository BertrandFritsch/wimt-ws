import React from 'react';
import $ from 'jquery';
import SNCFData from './../SNCFData';
import Trips from './../Trips/Trips';
import Trip from './../Trip/Trip';
import theme from './Main.css';

class Main extends React.Component {
  constructor(props) {
    super(props);

    SNCFData.loadData(() => {
      let departureStop = null,
        arrivalStop = null,
        trip = null;

      if (document.location.hash && document.location.hash.match(/(#|&)trip=/)) {
        let matches = /(#|&)trip=(.*?)(&|$)/.exec(document.location.hash);
        if (matches[2]) {
          trip = SNCFData.getTrip(matches[2]);
          //TODO: report bad trip id
          if (trip) {
            departureStop = SNCFData.getStop(trip.stopTimes[0].stop);
            arrivalStop = SNCFData.getStop(trip.stopTimes[trip.stopTimes.length - 1].stop);
          }
        }
      }
      else {
        //departureStop = SNCFData.stops['8738288'];
        //arrivalStop = SNCFData.stops['8738221'];
      }

      this.setState({
        stops: SNCFData.getStopsArray(),

        trip: trip,
        departureStop: departureStop,
        arrivalStop: arrivalStop
      });
    });

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
              if (this.state.trip) {
                return <Trip trip={this.state.trip} departureStop={this.state.departureStop} arrivalStop={this.state.arrivalStop} />;
              }
            })()}
          </div>
        </div>
        <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true' />
      </div>
    )
  }

  setUpHistoryNavigation = () => {
    window.addEventListener('popstate', (event) => {
      event.preventDefault();
      
      this.setState({
        trip: event.state && event.state.trip
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
      trip: SNCFData.getTrip(stopTime.trip)
    });

    window.history.pushState({
      trip: SNCFData.getTrip(stopTime.trip)
    }, "Voyage d'un train", String.format("#trip={0}", stopTime.trip));
  }
}

export default Main;
