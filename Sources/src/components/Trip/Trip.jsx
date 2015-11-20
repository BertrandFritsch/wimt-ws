import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import TripHeaderRow from './../TripHeaderRow/TripHeaderRow';
import TripStopRow from './../TripStopRow/TripStopRow';
import GridLayout from '../../gridlayout/gridlayout';
import SNCFData, { RealTimeRequester } from '../SNCFData';
import { updateDebuggingInfo } from '../../actions/actions.js';
import { RealTimeStatus, PLANNED_TRIP, NOT_PLANNED_TRIP, DELAYED_TRIP, CANCELLED_TRIP, RUNNING_TRIP } from '../../actions/actions.js'
import theme from './Trip.css'

const PIXELS_PER_MINUTE = 15;

class Trip extends React.Component {
  constructor(props) {
    super(props);

    GridLayout.resizeListeners.add(this.onResize);
  }

  state = { initialTrainPosition: true }

  componentWillUnmount = () => {
    GridLayout.resizeListeners.remove(this.onResize);
  }

  render = () => {
    let hasTripState = this.props.viewTrip.state;
    let isRunning = hasTripState && this.props.viewTrip.state.type === RUNNING_TRIP;
    let stopTimeReached = false;
    let rows = SNCFData.getTripStopTimes(this.props.viewTrip.trip).map(stopTime => {
      if (!stopTimeReached && isRunning && stopTime === this.props.viewTrip.state.stopTime) {
        stopTimeReached = true;
      }

      return {
        trainHasPassedBy: false && !stopTimeReached,
        delayedMinutes: stopTimeReached ? (this.props.viewTrip.state.delayed || 0) : 0,
        delayed: stopTimeReached ? this.props.viewTrip.state.delayed !== 0 : false
      }
    });

    let stopTimeTime0 = SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.props.viewTrip.trip));
    let tripContainerStyles = {
      height: (SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(this.props.viewTrip.trip)) + (isRunning && this.props.viewTrip.state.delayedMinutes || 0) - stopTimeTime0) * PIXELS_PER_MINUTE
    };

    let tripFrameClasses = ['trip-frame', this.props.viewTrip.realTimeStatus === RealTimeStatus.ONLINE ? 'trip-real-time' : this.props.viewTrip.realTimeStatus === RealTimeStatus.CHECKING ? 'trip-real-time-checking' : 'trip-no-real-time'].join(' ');

    let state = (_ => {
      if (this.props.viewTrip.state) {
        switch (this.props.viewTrip.state.type) {
          case PLANNED_TRIP:
            return Trip.formatDate(this.props.viewTrip.state.date);

          case NOT_PLANNED_TRIP:
            return "Non planifié !";

          case DELAYED_TRIP:
            return "Retardé";

          case CANCELLED_TRIP:
            return "Supprimé";

          case RUNNING_TRIP:
            return this.props.viewTrip.state.delayed === 0 ? "A l'heure" : String.format('{0}mn', this.props.viewTrip.state.delayed * 60 * 1000);
        }
      }
    })();

    return (
      <div data-g-layout-container='' className={tripFrameClasses}>
        <div data-g-layout-item='"row": 0'>
          <TripHeaderRow trip={this.props.viewTrip.trip}
                         state={state} />
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
                  let delayed = isRunning ? this.props.viewTrip.state.delayed : 0;
                  if (hasTripState && (isRunning || this.props.viewTrip.state.type === DELAYED_TRIP)) {
                    let stopTimeTime = SNCFData.getStopTimeTime(this.props.viewTrip.state.stopTime) + delayed - stopTimeTime0;
                    let stopTimePosition = stopTimeTime * PIXELS_PER_MINUTE;
                    let now = ((Date.now() - SNCFData.getDateByMinutes(0)) / (60 * 1000)) - stopTimeTime0;
                    let nowPosition = now * PIXELS_PER_MINUTE;
                    //let trainPosition = (this.state.trainPosition || 0) * PIXELS_PER_MINUTE;
                    //if (trainPosition > 0 && this.initialTrainPositionning && this.refs.tripScrollEl) {
                    //  $(this.refs.tripScrollEl).animate({ scrollTop: String.format("{0}px", trainPosition) }, 2000);
                    //}


                     let transitionEnd = this.state.initialTrainPosition ? _ => { debugger; this.setState({ initialTrainPosition: false }) } : null;

                    let tripTrainStyles = {
                      transitionDuration: String.format("{0}ms", this.state.initialTrainPosition ? 2000 : Math.max(0, stopTimeTime - now) * 60 * 1000),
                      transform: String.format("translateY({0}px)", this.state.initialTrainPosition ? Math.min(Math.max(0, nowPosition), stopTimePosition) : stopTimePosition)
                    };

                    let tripClasses = ['trip-train-frame', this.state.initialTrainPosition ? 'trip-train-position-initial-animation' : 'trip-train-position-progression-animation'].join(' ');

                    return <div className={tripClasses} sty onTransitionEnd={transitionEnd} style={tripTrainStyles}>
                      <div className="trip-train-position"/>
                    </div>
                  }
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
    //  return String.format('{0mn}', (time - now) / (1000 * 60));
    //}
  }
}

export default Trip;
