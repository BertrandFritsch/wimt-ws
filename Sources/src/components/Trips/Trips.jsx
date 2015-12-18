import React from 'react';
import AutoCompleteSelector from './../AutoCompleteSelector/AutoCompleteSelector';
import SelectedTrips from './../SelectedTrips/SelectedTrips';
import SNCFData from './../../SNCFData';
import { ViewTripAccessor } from '../../reducers/viewTrip.js';
import './Trips.css';

let Trips = React.createClass({
  propTypes: {
    stops: React.PropTypes.arrayOf(React.PropTypes.array).isRequired,
    onDepartureStopChange: React.PropTypes.func.isRequired,
    onArrivalStopChange: React.PropTypes.func.isRequired,
    viewTrip: React.PropTypes.any,
    onStopTimeSelected: React.PropTypes.func,
    actionDispatcher: React.PropTypes.func
  },

  render() {
    const departureStops = this.props.stops;

    const stopState = ViewTripAccessor.create(this.props.viewTrip).stop;
    const departureStop = stopState.getDepartureStop();
    const arrivalStop = stopState.getArrivalStop();
    let arrivalStops;

    if (departureStop) {
      // filter the possible arrival stops
      arrivalStops = (() => {
        // use a map to make stops being unique
        let stopsMap = SNCFData.getStopTrips(departureStop).reduce((res, trip) => {
          return SNCFData.getTripStopTimes(SNCFData.getTrip(SNCFData.getStopTimeTrip(trip))).reduce((res, stopTime) => {
            if (SNCFData.getStopTimeStop(stopTime) !== departureStop) {
              res[SNCFData.getStopUICCode(SNCFData.getStopTimeStop(stopTime))] = SNCFData.getStopTimeStop(stopTime);
            }

            return res;
          }, res);
        }, {});

        // use the initial stops list to keep the arrival stop list sorted
        return departureStops.filter(stop => stopsMap[SNCFData.getStopUICCode(stop)] !== undefined);
      })();
    }
    else {
      arrivalStops = departureStops;
    }

    return (
      <div data-g-layout-container='' className="trips-frame">
        <div data-g-layout-item='"row": 0'>
          <AutoCompleteSelector placeholder="De..."
                                data={departureStops}
                                value={departureStop}
                                onStopChange={this.props.onDepartureStopChange}/>
        </div>
        <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <SelectedTrips actionDispatcher={this.props.actionDispatcher}
                         viewTrip={this.props.viewTrip}
                         onStopTimeSelected={this.props.onStopTimeSelected}/>
        </div>
        <div data-g-layout-item='"row": 2'>
          <AutoCompleteSelector placeholder="Vers..."
                                data={arrivalStops}
                                value={arrivalStop}
                                onStopChange={this.props.onArrivalStopChange}/>
        </div>
      </div>
    );
  }
});

export default Trips;
