import React from 'react';
import AutoCompleteSelector from './../AutoCompleteSelector/AutoCompleteSelector';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData';
import { createMeasurer, connectToLayoutMeasurer } from '../LayoutContainer/LayoutMeasurer.jsx';
import { connectToLayoutWrapper } from '../LayoutContainer/LayoutWrapper.jsx';
import DayHeaderRow from '../DayHeaderRow/DayHeaderRow.jsx';
import StopTimeRow from '../StopTimeRow/StopTimeRow.jsx';
import connectToLayoutContainer from '../LayoutContainer/LayoutContainer.jsx';
import { connectWithTripState } from '../../store/tripsStates/connect.js';
import './Trips.css';

const DecoratedInfinite = connectToLayoutMeasurer(connectToLayoutWrapper(Infinite), createMeasurer('height', 250), 'containerHeight');

let Trips = connectToLayoutContainer(React.createClass({
  propTypes: {
    // invariants -- known at construction time
    stops: React.PropTypes.arrayOf(React.PropTypes.array).isRequired,
    onStopTimeSelected: React.PropTypes.func.isRequired,
    selectStops: React.PropTypes.func.isRequired,
    generateNextTrips: React.PropTypes.func.isRequired,

    // dynamic state
    departureStop: React.PropTypes.array,
    arrivalStop: React.PropTypes.array,
    trips: React.PropTypes.array
  },

  getDefaultProps() {
    return {
      stops: SNCFData.getStopsArray()
    };
  },

  componentWillReceiveProps(nextProps) {
    if ((this.props.departureStop !== nextProps.departureStop
      || this.props.arrivalStop !== nextProps.arrivalStop)
    && (nextProps.departureStop || nextProps.arrivalStop)) {
      nextProps.generateNextTrips(20);
    }
  },

  render() {
    const departureStops = this.props.stops;

    const departureStop = this.props.departureStop;
    const arrivalStop = this.props.arrivalStop;
    const trips = this.props.trips || [];

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

    const rows = (() => {
      let date;

      return trips.reduce((rows, e, index) => {
        if (date !== e.date) {
          date = e.date;
          rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
        }

        const ConnectedStopTimeRow = connectWithTripState(StopTimeRow);
        rows.push(<ConnectedStopTimeRow key={index}
                                        trip={e.trip}
                                        date={e.date}
                                        stop={departureStop}
                                        onStopTimeSelected={this.props.onStopTimeSelected}/>);

        return rows;
      }, []);
    })();

    return (
      <div data-g-layout-container='' className="trips-frame">
        <div data-g-layout-item='"row": 0'>
          <AutoCompleteSelector placeholder="De..."
                                data={departureStops}
                                value={departureStop}
                                onStopChange={stop => this.props.selectStops(stop, this.props.arrivalStop)}/>
        </div>
        <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <DecoratedInfinite elementHeight={50}
                             infiniteLoadBeginEdgeOffset={200}
                             onInfiniteLoad={() => this.props.generateNextTrips(20)}>
            {rows}
          </DecoratedInfinite>
        </div>
        <div data-g-layout-item='"row": 2'>
          <AutoCompleteSelector placeholder="Vers..."
                                data={arrivalStops}
                                value={arrivalStop}
                                onStopChange={stop => this.props.selectStops(this.props.departureStop, stop)}/>
        </div>
      </div>
    );
  }
}));

export default Trips;
