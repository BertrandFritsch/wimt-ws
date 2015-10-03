import React from 'react';
import TripHeaderRow from './../TripHeaderRow/TripHeaderRow';
import TripStopRow from './../TripStopRow/TripStopRow';
import GridLayout from '../../gridlayout/gridlayout';
import SNCFData, { RealTimeRequester } from './../SNCFData';
import theme from './Trip.css'

class Trip extends React.Component {
  constructor(props) {
    super(props);
    
    GridLayout.resizeListeners.add(this.onResize);
  }

  componentWillMount = () => {
    this.checkRealTimes(this.props);
  }

  render = () => {
    return (
        <div className="trip-frame">
          <TripHeaderRow trip={this.props.trip} />
          {(() => {
            return this.props.trip.stopTimes.map((stopTime, index) => <TripStopRow key={index} stopTime={stopTime} />);
          })()}
        </div>
        )
  }

  onResize = () => {
    this.setState({
      containerHeight: React.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }

  checkRealTimes = (props) => {
    let me = this,
      trip = props.trip,
      arrivalStop = SNCFData.stops[trip.stopTimes[trip.stopTimes.length - 1].stop];

    /**
     *   1. Localizing the current position of the train.
     *      The localization id based on the current time.
     *      When is this train currently running?
     *      Start 1h30 before the start of train at most.
      */
    let tripStartTime = trip.stopTimes[0].time;

    trip.stopTimes.forEach(stopTime => {
      let stop = SNCFData.stops[stopTime.stop];
      RealTimeRequester.get(stop, arrivalStop, trains => {
        let train = trains.find(train => train.number === trip.number);
        let s = stop;
        let t = train;

        //for (let i = 0, iTrain = 0, iLength = me.state.generator.stopTimes.length, iTrainsLength = trains.length; i < iLength; ++i) {
        //  let stop = me.state.generator.stopTimes[i];
        //  if (iTrain < iTrainsLength) {
        //    let train = trains[iTrain];
        //    let trip = SNCFData.trips[stop.stopTime.trip];
        //    if (trip.number === train.number) {
        //      stop.realTime = {
        //        time: train.time,
        //        mode: train.mode,
        //        state: train.state
        //      };
        //
        //      ++iTrain;
        //    }
        //    else {
        //      // no more real times available for this stop time, ensure that no real time is still attached on this train
        //      delete stop.realTime;
        //    }
        //  }
        //  else {
        //    // no more real times available, ensure that no real time is still attached on this train
        //    delete stop.realTime;
        //  }
        //}
        //
        //me.setState({
        //  rows: me.transformToElements(me.state.generator.stopTimes)
        //});
      });
    });
  }
}

export default Trip;
