import React from 'react';
import AutoCompleteSelector from './../AutoCompleteSelector/AutoCompleteSelector';
import SelectedTrips from './../SelectedTrips/SelectedTrips';
import SNCFData from './../../SNCFData';
import './Trips.css';

let Trips = React.createClass({
  propTypes: {
    stops: React.PropTypes.arrayOf(React.PropTypes.array).isRequired,
    departureStop: React.PropTypes.array,
    arrivalStop: React.PropTypes.array,
    onStopTimeSelected: React.PropTypes.func
  },

  render() {
    var departureStops = this.props.stops;

    let onStopChange = (stop, eventToCall) => {
      //TODO: ensure the name has been found
      this.props[eventToCall](stop);
    };

    let onDepartureStopChange = (stop) => {
      onStopChange(stop, 'onDepartureStopChange');
    };

    let onArrivalStopChange = (stop) => {
      onStopChange(stop, 'onArrivalStopChange');
    };

    let arrivalStops, startStopTimes;

    if (this.props.departureStop) {
      // filter the possible arrival stops
      arrivalStops = (() => {
        // use a map to make stops being unique
        let stopsMap = SNCFData.getStopTrips(this.props.departureStop).reduce((res, trip) => {
          return SNCFData.getTripStopTimes(SNCFData.getTrip(SNCFData.getStopTimeTrip(trip))).reduce((res, stopTime) => {
            if (SNCFData.getStopTimeStop(stopTime) !== this.props.departureStop) {
              res[SNCFData.getStopUICCode(SNCFData.getStopTimeStop(stopTime))] = SNCFData.getStopTimeStop(stopTime);
            }

            return res;
          }, res);
        }, {});

        // use the initial stops list to keep the arrival stop list sorted
        return departureStops.filter(stop => stopsMap[SNCFData.getStopUICCode(stop)] !== undefined);
      })();

      startStopTimes = SNCFData.getStopTrips(this.props.departureStop);

      if (this.props.arrivalStop) {
        startStopTimes = startStopTimes.filter(stopTime => {
          return SNCFData.getTripStopTimes(SNCFData.getTrip(SNCFData.getStopTimeTrip(stopTime))).find(stopTime => {
            return SNCFData.getStopTimeStop(stopTime) === this.props.arrivalStop;
          }) !== undefined;
        });
      }
    }
    else {
      arrivalStops = departureStops;
    }

    return (
      <div data-g-layout-container='' className="trips-frame">
        <div data-g-layout-item='"row": 0'>
          <AutoCompleteSelector placeholder="De..."
                                data={departureStops}
                                value={this.props.departureStop}
                                onStopChange={onDepartureStopChange}/>
        </div>
        <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <SelectedTrips departureStop={this.props.departureStop}
                         startStopTimes={startStopTimes}
                         arrivalStop={this.props.arrivalStop}
                         onStopTimeSelected={this.props.onStopTimeSelected}/>
        </div>
        <div data-g-layout-item='"row": 2'>
          <AutoCompleteSelector placeholder="Vers..."
                                data={arrivalStops}
                                value={this.props.arrivalStop}
                                onStopChange={onArrivalStopChange}/>
        </div>
      </div>
    );
  }
});

export default Trips;
