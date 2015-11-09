import React from 'react';
import $ from 'jquery';
import SNCFData from './../SNCFData';
import Trips from './../Trips/Trips';
import Trip from './../Trip/Trip';
import LayoutContainer from './../LayoutContainer/LayoutContainer.jsx';
import theme from './Main.css';
import { connect } from 'react-redux'

class Main extends React.Component {
  constructor(props) {
    super(props);

    setTimeout(() => {
      let departureStop = null,
        arrivalStop = null,
        trip = null;

      if (document.location.hash && document.location.hash.match(/(#|&)trip=/)) {
        let matches = /(#|&)trip=(.*?)(&|$)/.exec(document.location.hash);
        if (matches[2]) {
          trip = SNCFData.getTrip(matches[2]);
          //TODO: report bad trip id
          if (trip) {
            departureStop = SNCFData.getStopTimeStop(SNCFData.getTripFirstStopTime(trip));
            arrivalStop = SNCFData.getStopTimeStop(SNCFData.getTripLastStopTime(trip));
          }
        }
      }
      else {
        departureStop = SNCFData.getStopById(87382887);
        arrivalStop = SNCFData.getStopById(87382218);
      }

      this.setState({
        stops: SNCFData.getStopsArray(),

        trip: trip,
        departureStop: departureStop,
        arrivalStop: arrivalStop
      });
    }, 1);

    this.setUpHistoryNavigation();
  }

  state = {
    stops: [],
    departureStop: null,
    arrivalStop: null
  }

  render = () => {
    return (
      <div id="gGridLayoutRoot" className="gLayoutMeasuring" data-g-layout-container="">
        <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true'/>
        <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true' data-g-layout-policy='"widthPolicy": "Container", "widthHint": "600px"' className="root-container">
          <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false'>
            {(() => { if (this.state.stops.length > 0) {
              return (
                  <LayoutContainer>
                    <Trips stops={this.state.stops}
                           departureStop={this.state.departureStop}
                           arrivalStop={this.state.arrivalStop}
                           onDepartureStopChange={this.onDepartureStopChange}
                           onArrivalStopChange={this.onArrivalStopChange}
                           onStopTimeSelected={this.onStopTimeSelected} />
                  </LayoutContainer>
                )
            } })()}
            {(() => {
              if (this.state.stops.length > 0 && this.state.trip) {
                return (
                  <LayoutContainer>
                    <Trip trip={this.state.trip} departureStop={this.state.departureStop} arrivalStop={this.state.arrivalStop} />
                  </LayoutContainer>
                )
              }
            })()}
            {(() => {
              if (this.state.stops.length === 0) {
                return <p>The data are loading...</p>
              }
            })()}
          </div>
        </div>
        <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true'/>
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
      trip: SNCFData.getStopTimeTrip(stopTime)
    });

    window.history.pushState({
      trip: SNCFData.getStopTimeTrip(stopTime)
    }, "Voyage d'un train", String.format("#trip={0}", SNCFData.getTripId(SNCFData.getStopTimeTrip(stopTime))));
  }
}

function select(state) {
  debugger;
  return state;
}

export default connect(select)(Main);
