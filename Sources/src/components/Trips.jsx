import React from 'react';
import SelectedTrips from './SelectedTrips';
import SNCFData from './SNCFData';

class Trips extends React.Component {
  render = () => {
    var departureStops = this.props.stops,
        arrivalStops,
        startStopTimes;

    let onStopChange = (stop, eventToCall) => {
      var index;

      //TODO: ensure the name has been found
      this.props[eventToCall](stop);
    }

    let onDepartureStopChange = (stop) => {
      onStopChange(stop, 'onDepartureStopChange');
    }

    let onArrivalStopChange = (stop) => {
      onStopChange(stop, 'onArrivalStopChange');
    }

    if (this.props.departureStop) {
      // filter the possible arrival stops
      arrivalStops = (() => {
        var stopsMap;

        // use a map to make stops being unique
        stopsMap = this.props.departureStop.trips.reduce((res, trip) => {
          return SNCFData.trips[trip].stopTimes.reduce((res, stopTime) => {
            // !!! stop object references cannot be compared as they are two distinct objects !!!
            if (SNCFData.stops[stopTime.stop].id !== this.props.departureStop.id) {
              res[SNCFData.stops[stopTime.stop].id] = SNCFData.stops[stopTime.stop];
            }

            return res;
          }, res)
        }, {});

        // use the initial stops list to keep the arrival stop list sorted
        return departureStops.filter(function (stop) {
          return stopsMap[stop.id] !== undefined;
        });
      })();

      startStopTimes = this.props.departureStop.stopTimes;
    }
    else {
      arrivalStops = departureStops;
    }

    return (
        <div data-g-layout-container='' className="trips-frame">
          <div data-g-layout-item='"row": 0'>
          </div>
          <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
            <SelectedTrips departureStop={this.props.departureStop}
                           startStopTimes={startStopTimes}
                           arrivalStop={this.props.arrivalStop}
                           onStopTimeSelected={this.props.onStopTimeSelected} />
          </div>
          <div data-g-layout-item='"row": 2'>
          </div>
        </div>
      )
  }
}

export default Trips;
