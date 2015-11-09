import React from 'react';
import AutoCompleteSelector from './../AutoCompleteSelector/AutoCompleteSelector';
import SelectedTrips from './../SelectedTrips/SelectedTrips';
import SNCFData from './../SNCFData';
import theme from './Trips.css';

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
        // use a map to make stops being unique
        let stopsMap = SNCFData.getStopTrips(this.props.departureStop).reduce((res, trip) => {
          return SNCFData.getTripStopTimes(SNCFData.getStopTimeTrip(trip)).reduce((res, stopTime) => {
            if (SNCFData.getStopTimeStop(stopTime) !== this.props.departureStop) {
              res[SNCFData.getStopUICCode(SNCFData.getStopTimeStop(stopTime))] = SNCFData.getStopTimeStop(stopTime);
            }

            return res;
          }, res)
        }, {});

        // use the initial stops list to keep the arrival stop list sorted
        return departureStops.filter(function (stop) {
          return stopsMap[SNCFData.getStopUICCode(stop)] !== undefined;
        });
      })();

      startStopTimes = SNCFData.getStopTrips(this.props.departureStop);

      if (this.props.arrivalStop) {
        startStopTimes = startStopTimes.filter(stopTime => {
          return SNCFData.getTripStopTimes(SNCFData.getStopTimeTrip(stopTime)).find(stopTime => {
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
            <div className="trips-debug-info">UICCode : {this.props.departureStop ? SNCFData.getStopUICCode(this.props.departureStop) : ''}</div>
            <AutoCompleteSelector placeholder="De..."
                                  data={departureStops}
                                  value={this.props.departureStop}
                                  onStopChange={onDepartureStopChange} />
          </div>
          <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
            <SelectedTrips departureStop={this.props.departureStop}
                           startStopTimes={startStopTimes}
                           arrivalStop={this.props.arrivalStop}
                           onStopTimeSelected={this.props.onStopTimeSelected} />
          </div>
          <div data-g-layout-item='"row": 2'>
            <AutoCompleteSelector placeholder="Vers..."
                                  data={arrivalStops}
                                  value={this.props.arrivalStop}
                                  onStopChange={onArrivalStopChange} />
          </div>
        </div>
      )
  }
}

export default Trips;
