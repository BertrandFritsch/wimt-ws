import React from 'react';
import TripHeaderRow from './../TripHeaderRow/TripHeaderRow';
import TripStopRow from './../TripStopRow/TripStopRow';
import SNCFData from '../../SNCFData.js';
//import { updateDebuggingInfo } from '../../actions/actions.js';
import { realTimeStateDisplay, DELAYED_TRIP, RUNNING_TRIP, ARRIVED_TRIP } from '../../actions/actions.js';
import './Trip.css';
import { ViewTripAccessor } from '../../reducers/viewTrip.js';

const PIXELS_PER_MINUTE = 15;

const Trip = React.createClass({
  propTypes: {
    viewTrip: React.PropTypes.any
  },

  getInitialState() {
    return {
      showTrainPosition: 0
    };
  },

  componentWillUnmount() {
    this.cancelTrainPosition = true;
  },

  render() {
    const viewTrip = ViewTripAccessor.create(this.props.viewTrip);
    const tripState = viewTrip.trip.getState();
    const trip = viewTrip.trip.getTrip();
    const hasTripState = !!(tripState && tripState.state);
    const isRunning = hasTripState && (tripState.state.type === RUNNING_TRIP || tripState.state.type === ARRIVED_TRIP);
    let stopTimeReached = false;
    const rows = SNCFData.getTripStopTimes(trip).map(stopTime => {
      if (!stopTimeReached && isRunning && stopTime === tripState.state.stopTime) {
        stopTimeReached = true;
      }

      return {
        trainHasPassedBy: false && !stopTimeReached,
        delayedMinutes: stopTimeReached && this.state.showTrainPosition > 0 ? (tripState.state.delayed || 0) : 0,
        delayed: stopTimeReached ? tripState.state.delayed !== 0 : false
      };
    });

    const stopTimeTime0 = SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(trip));
    const tripContainerStyles = {
      height: (SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(trip)) + (isRunning && tripState.state.delayed || 0) - stopTimeTime0) * PIXELS_PER_MINUTE
    };

    return (
      <div data-g-layout-container='' className="trip-frame">
        <div data-g-layout-item='"row": 0'>
          <TripHeaderRow trip={trip}
                         state={hasTripState && realTimeStateDisplay(tripState.state)}
                         status={hasTripState && tripState.realTimeStatus}/>

          <div className="trip-frame-top-space"/>
        </div>
        <div ref="tripScrollEl" style={{ overflowY: 'auto' }} data-g-layout-item='"row": 1, "isXSpacer": true'
             data-g-layout-policy='"heightHint": "*", "heightPolicy": "Fixed"'>
          <div className="trip-frame-center">
            <div className="trip-timeline"/>
            <div className="trip-container" style={tripContainerStyles}>
              {
                SNCFData.getTripStopTimes(trip).map((stopTime, index) => {
                  let gap = SNCFData.getStopTimeTime(stopTime) + rows[index].delayedMinutes - stopTimeTime0;
                  return (<TripStopRow key={index} top={gap * PIXELS_PER_MINUTE} stopTime={stopTime}
                                      delayedMinutes={rows[index].delayedMinutes}
                                      delayed={rows[index].delayed || false}
                                      trainHasPassedBy={rows[index].trainHasPassedBy} />);
                })
              }
              {(() => {
                let delayed = isRunning ? tripState.state.delayed : 0;
                let tripTrainStyles = null;
                let hasTrainPosition = hasTripState && (isRunning || tripState.state.type === DELAYED_TRIP);
                if (this.state.showTrainPosition) {
                  if (hasTrainPosition) {
                    let stopTimeTime = SNCFData.getStopTimeTime(tripState.state.stopTime) + delayed - stopTimeTime0;
                    let stopTimePosition = stopTimeTime * PIXELS_PER_MINUTE;
                    let now = ((Date.now() - SNCFData.getDateByMinutes(0)) / (60 * 1000)) - stopTimeTime0;
                    let nowPosition = now * PIXELS_PER_MINUTE;
                    //let trainPosition = (this.state.trainPosition || 0) * PIXELS_PER_MINUTE;
                    //if (trainPosition > 0 && this.initialTrainPositionning && this.refs.tripScrollEl) {
                    //  $(this.refs.tripScrollEl).animate({ scrollTop: `${trainPosition}px` }, 2000);
                    //}


                    if (this.state.showTrainPosition === 1 && !this.initialTrainPositionPromise) {
                      this.registerInitialTrainPosition(2000).then(() => this.setState({ showTrainPosition: 2 }));
                    }

                    tripTrainStyles = {
                      transitionDuration: `${this.state.showTrainPosition === 1 ? 2000 : Math.max(0, stopTimeTime - now) * 60 * 1000}ms`,
                      transform: `translateY(${this.state.showTrainPosition === 1 ? Math.min(Math.max(0, nowPosition), stopTimePosition) : stopTimePosition}px)`
                    };
                    console.log('showTrainPosition: ', this.state.showTrainPosition, ' - ', this.state.showTrainPosition === 1 ? Math.min(Math.max(0, nowPosition), stopTimePosition) : stopTimePosition);
                  }
                }
                else if (!this.initialTrainPositionPromise) {
                  this.registerInitialTrainPosition(10).then(() => this.setState({ showTrainPosition: 1 }));
                }

                let tripClasses = [ 'trip-train-frame', hasTrainPosition ? this.state.showTrainPosition === 1 ? 'trip-train-position-initial-animation' : 'trip-train-position-progression-animation' : '' ].join(' ');
                let trainClasses = hasTrainPosition ? 'trip-train-position' : null;

                return (
                  <div className={tripClasses} style={tripTrainStyles}>
                    <div className={trainClasses}/>
                  </div>
                );
              })()
              }
            </div>
          </div>
        </div>
        <div data-g-layout-item='"row": 2'>
          <div className="trip-frame-bottom-space"/>
        </div>
      </div>
    );
  },

  registerInitialTrainPosition(timeout) {
    console.log('showTrainPosition: ', this.state.showTrainPosition, ' - ', 'timeout: ', timeout);
    this.initialTrainPositionPromise = new Promise(resolve => {
      setTimeout(() => {
        delete this.initialTrainPositionPromise;
        if (!this.cancelTrainPosition) {
          resolve();
        }
      }, timeout);
    });
    this.cancelTrainPosition = false;
    return this.initialTrainPositionPromise;
  }
});

export default Trip;
