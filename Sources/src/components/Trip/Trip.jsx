import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import TripHeaderRow from './../TripHeaderRow/TripHeaderRow';
import TripStopRow from './../TripStopRow/TripStopRow';
import GridLayout from '../../gridlayout/gridlayout';
import SNCFData, { RealTimeRequester } from '../SNCFData';
import { updateDebuggingInfo } from '../../actions/actions.js';
import theme from './Trip.css'

const PIXELS_PER_MINUTE = 15;

class Trip extends React.Component {
  constructor(props) {
    super(props);

    GridLayout.resizeListeners.add(this.onResize);
    this.state = this.state || {};
  }

  componentWillUnmount = () => {
    GridLayout.resizeListeners.remove(this.onResize);
  }

  render = () => {
    function scrollToPosition(el, tripScrollEl) {
      if (el !== null) {
        console.log("Train: ", el.getBoundingClientRect().top);
        console.log("ScrollEl: ", tripScrollEl && tripScrollEl.getBoundingClientRect().height);
      }
    }

    let stopTimeReached = false;
    let rows = SNCFData.getTripStopTimes(this.props.trip).map(stopTime => {
      if (!stopTimeReached && stopTime === this.state.stopTime) {
        stopTimeReached = true;
      }

      return {
        trainHasPassedBy: !stopTimeReached,
        delayedMinutes: stopTimeReached ? (this.state.delayedMinutes || 0) : 0,
        delayed: stopTimeReached ? this.state.delayed : false
      }
    })

    let time = SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.props.trip));
    let tripContainerStyles = {
      height: (SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(this.props.trip)) + (this.state.delayedMinutes || 0) - time) * PIXELS_PER_MINUTE
    }

    let tripFrameClasses = ['trip-frame', !this.state.noRealTime ? 'trip-real-time' : 'trip-no-real-time'].join(' ');

    return (
      <div data-g-layout-container='' className={tripFrameClasses}>
        <div data-g-layout-item='"row": 0'>
          <TripHeaderRow trip={this.props.trip}
                       state={this.state.notScheduled ? 'Non planifié' : this.state.cancelled ? 'Supprimé' : this.state.delayed ? 'Retardé' : this.state.delayedMinutes ? String.format("{0} mn", this.state.delayedMinutes) : this.state.noRealTime ? 'Théorique' : "A l'heure"} />
          <div className="trip-frame-top-space"/>
        </div>
        <div ref="tripScrollEl" style={{overflowY: 'auto'}} data-g-layout-item='"row": 1, "isXSpacer": true' data-g-layout-policy='"heightHint": "*", "heightPolicy": "Fixed"'>
          <div className="trip-frame-center">
            <div className="trip-timeline"/>
            <div className="trip-container" style={tripContainerStyles}>
              {
                SNCFData.getTripStopTimes(this.props.trip).map((stopTime, index) => {
                  let gap = SNCFData.getStopTimeTime(stopTime) + rows[index].delayedMinutes - time;
                  return <TripStopRow key={index} top={gap * PIXELS_PER_MINUTE} stopTime={stopTime}
                                      delayedMinutes={rows[index].delayedMinutes}
                                      delayed={rows[index].delayed || false}
                                      trainHasPassedBy={rows[index].trainHasPassedBy} />
                  })
                }
              {(() => {
                  if (!this.state.notScheduled) {
                    let trainPosition = (this.state.trainPosition || 0) * PIXELS_PER_MINUTE;
                    if (trainPosition > 0 && this.state.isInitialComputing && this.refs.tripScrollEl) {
                      $(this.refs.tripScrollEl).animate({ scrollTop: String.format("{0}px", trainPosition) }, 2000);
                    }

                    let tripTrainStyles = {
                      transitionDuration: String.format("{0}ms", this.state.isInitialComputing ? 2000 : Math.max(6000, Math.min(60000, this.state.timeUntilStop))),
                      transform: String.format("translateY({0}px)", trainPosition)
                    }

                    let tripClasses = ['trip-train-frame', this.state.isInitialComputing ? 'trip-train-position-initial-animation' : 'trip-train-position-progression-animation'].join(' ');

                    return <div className={tripClasses} style={tripTrainStyles}>
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
}

export default Trip;
