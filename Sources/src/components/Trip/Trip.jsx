import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import TripHeaderRow from './../TripHeaderRow/TripHeaderRow';
import TripStopRow from './../TripStopRow/TripStopRow';
import GridLayout from '../../gridlayout/gridlayout';
import SNCFData, { RealTimeRequester } from '../../SNCFData';
import { updateDebuggingInfo } from '../../actions/actions.js';
import { RealTimeStatus, PLANNED_TRIP, NOT_PLANNED_TRIP, DELAYED_TRIP, CANCELLED_TRIP, RUNNING_TRIP, ARRIVED_TRIP } from '../../actions/actions.js'
import theme from './Trip.css'

const PIXELS_PER_MINUTE = 15;

class Trip extends React.Component {
  constructor(props) {
    super(props);

    GridLayout.resizeListeners.add(this.onResize);
  }

  state = { initialTrainPosition: true }

  componentWillUnmount = () => {
    this.cancelSecondTrainPosition = true;
    GridLayout.resizeListeners.remove(this.onResize);
  }

  render = () => {
    let tripState = this.props.viewTrip.tripsStates && this.props.viewTrip.tripsStates[SNCFData.getTripId(this.props.viewTrip.trip)] && this.props.viewTrip.tripsStates[SNCFData.getTripId(this.props.viewTrip.trip)].state;
    let hasTripState = !!tripState;
    let isRunning = hasTripState && (tripState.type === RUNNING_TRIP || tripState.type === ARRIVED_TRIP);
    let stopTimeReached = false;
    let rows = SNCFData.getTripStopTimes(this.props.viewTrip.trip).map(stopTime => {
      if (!stopTimeReached && isRunning && stopTime === tripState.stopTime) {
        stopTimeReached = true;
      }

      return {
        trainHasPassedBy: false && !stopTimeReached,
        delayedMinutes: stopTimeReached ? (tripState.delayed || 0) : 0,
        delayed: stopTimeReached ? tripState.delayed !== 0 : false
      }
    });

    let stopTimeTime0 = SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.props.viewTrip.trip));
    let tripContainerStyles = {
      height: (SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(this.props.viewTrip.trip)) + (isRunning && tripState.delayed || 0) - stopTimeTime0) * PIXELS_PER_MINUTE
    };

    let state = (_ => {
      if (tripState) {
        switch (tripState.type) {
          case PLANNED_TRIP:
            return Trip.formatDate(tripState.date);

          case NOT_PLANNED_TRIP:
            return "Non planifié !";

          case DELAYED_TRIP:
            return "Retardé";

          case CANCELLED_TRIP:
            return "Supprimé";

          case RUNNING_TRIP:
            return tripState.delayed === 0 ? "A l'heure" : `${tripState.delayed} mn`;

          case ARRIVED_TRIP:
            return "Arrivé";
        }
      }
    })();

    return (
      <div data-g-layout-container='' className="trip-frame">
        <div data-g-layout-item='"row": 0'>
          <TripHeaderRow trip={this.props.viewTrip.trip}
                         state={state}
                         status={this.props.viewTrip.realTimeStatus}/>
          <div className="trip-frame-top-space"/>
        </div>
        <div ref="tripScrollEl" style={{overflowY: 'auto'}} data-g-layout-item='"row": 1, "isXSpacer": true' data-g-layout-policy='"heightHint": "*", "heightPolicy": "Fixed"'>
          <div className="trip-frame-center">
            <div className="trip-timeline"/>
            <div className="trip-container" style={tripContainerStyles}>
              {
                SNCFData.getTripStopTimes(this.props.viewTrip.trip).map((stopTime, index) => {
                  let gap = SNCFData.getStopTimeTime(stopTime) + rows[index].delayedMinutes - stopTimeTime0;
                  return <TripStopRow key={index} top={gap * PIXELS_PER_MINUTE} stopTime={stopTime}
                                      delayedMinutes={rows[index].delayedMinutes}
                                      delayed={rows[index].delayed || false}
                                      trainHasPassedBy={rows[index].trainHasPassedBy} />
                  })
                }
              {(() => {
                  let delayed = isRunning ? tripState.delayed : 0;
                  let tripTrainStyles = null;
                  let hasTrainPosition = hasTripState && (isRunning || tripState.type === DELAYED_TRIP);
                  if (hasTrainPosition) {
                    let stopTimeTime = SNCFData.getStopTimeTime(tripState.stopTime) + delayed - stopTimeTime0;
                    let stopTimePosition = stopTimeTime * PIXELS_PER_MINUTE;
                    let now = ((Date.now() - SNCFData.getDateByMinutes(0)) / (60 * 1000)) - stopTimeTime0;
                    let nowPosition = now * PIXELS_PER_MINUTE;
                    //let trainPosition = (this.state.trainPosition || 0) * PIXELS_PER_MINUTE;
                    //if (trainPosition > 0 && this.initialTrainPositionning && this.refs.tripScrollEl) {
                    //  $(this.refs.tripScrollEl).animate({ scrollTop: `${trainPosition}px` }, 2000);
                    //}


                    if (this.state.initialTrainPosition) {
                      this.registerInitialTrainPosition(2000);
                    }

                    tripTrainStyles = {
                      transitionDuration: `${this.state.initialTrainPosition ? 2000 : Math.max(0, stopTimeTime - now) * 60 * 1000}ms`,
                      transform: `translateY(${this.state.initialTrainPosition ? Math.min(Math.max(0, nowPosition), stopTimePosition) : stopTimePosition}px)`
                    };
                  }

                  let tripClasses = ['trip-train-frame', hasTrainPosition ? this.state.initialTrainPosition ? 'trip-train-position-initial-animation' : 'trip-train-position-progression-animation' : ''].join(' ');
                  let trainClasses = hasTrainPosition ? 'trip-train-position' : null;

                  return <div className={tripClasses} style={tripTrainStyles}>
                    <div className={trainClasses}/>
                  </div>
                })()
              }
            </div>
          </div>
        </div>
        <div data-g-layout-item='"row": 2'>
          <div className="trip-frame-bottom-space"/>
        </div>
      </div>
    )
  }

  onResize = () => {
    this.setState({
      containerHeight: ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }

  registerInitialTrainPosition = timeout => {
    setTimeout(_ => {
      if (!this.cancelSecondTrainPosition) {
        this.setState({ initialTrainPosition: false });
      }
    }, timeout);
    this.cancelSecondTrainPosition = false;
  }

  /**
   * Format the date
   * @param date
   * @returns {String}
   */
  static formatDate(date) {
    const _1H = 1 * 60 * 60 * 1000;

    let today = new Date();
    let midnight = (_ => {
      let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      d.setDate(d.getDate() + 1);
      return d;
    })();

    let midnightTime = midnight.getTime();
    let time = date.getTime();
    let now = today.getTime();

    if (time >= midnightTime) {
      // the date is later than today, show the date
      return date.toLocaleString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
    }
    else { //if (time - now >= _1H) {
      // the date is later than 1 hour from now, show the hours and minutes
      return date.toLocaleString('fr-FR', {hour: '2-digit', minute: '2-digit'});
    }
    //else {
    //  // the date is less than 1 hour, show the minutes
    //  return `${(time - now) / (1000 * 60)}0mn`;
    //}
  }
}

export default Trip;
