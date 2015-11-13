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
    this.automate = new RealTimeTrainState(this, props.trip);
    this.state = this.state || {};
  }

  componentWillUnmount = () => {
    GridLayout.resizeListeners.remove(this.onResize);
    this.automate.transition(RealTimeTrainState.Events.COMPONENT_WILL_UNMOUNT);
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

  updateState = (state) => {
    if (this.state === undefined) {
      this.state = state;
    }
    else {
      this.setState(state);
    }
  }
}

export default Trip;

class RealTimeTrainState {
  constructor(tripComp, trip) {
    this.tripComp = tripComp;
    this.trip = trip;

    this.initialTransition();
  }

  state = RealTimeTrainState.States.INITIAL_STATE;

  initialTransition() {
    let date = new Date();

    if (SNCFData.doesRunAt(this.trip, date)) {
      // localization of the train

      // look for the nearest stop that the train has still to pass by
      let stopTime = SNCFData.getTripStopTimes(this.trip).find(stopTime => date.getTime() <= SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime)).getTime());
      if (stopTime === undefined) {
        // the train has already passed today
        this.transition(RealTimeTrainState.Events.TRAIN_NOT_SCHEDULED);
      }
      else if (SNCFData.isTripFirstStopTime(this.trip, stopTime)) {
        // the train has not yet started
        this.transition(RealTimeTrainState.Events.TRAIN_SCHEDULED);
      }
      else {
        this.transition(RealTimeTrainState.Events.GET_REAL_TIME, {stopTime: stopTime});
      }
    }
    else {
      this.transition(RealTimeTrainState.Events.TRAIN_NOT_SCHEDULED);
    }
  }

  getNextTripDate() {
    //TODO: do it!
  }

  scheduleNextCheck(date) {
    //TODO: do it!
  }

  abortWaitings() {
    var me = this;

    clearTimeout(this.timer);
    delete this.timer;

    if (process.env.NODE_ENV !== 'production' && this.debugTimer !== undefined) {
      clearTimeout(this.debugTimer);
      delete this.debugTimer;
      setTimeout(() => {
        me.tripComp.props.actionDispatcher(updateDebuggingInfo('Prochaine vérification', null));
      }, 1);
    }
  }

  checkRealTimeAt(context) {
    let stop = SNCFData.getStopTimeStop(context.stopTime),
      lastStop = SNCFData.getTripLastStop(this.trip);

    if (stop === lastStop) {
      setTimeout(() => {
        // specific case for the last stop as it is never announced by the real time API
        // simulate the train position based on the planned time augmented by the last known delayed time
        let time = SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(context.stopTime) + (context.delayedMinutes || 0));
        let train = (time.getTime() >= new Date().getTime())
          ? {
              "time": time,
              "mode": context.delayedTime !== undefined ? "R" : '',
              "state": context.delayed ? 'Retardé' : context.cancelled ? 'Supprimé' : ''
            }
          : undefined;

        this.processRealTime(context, train);
      }, 1);
    }
    else {
      RealTimeRequester.get(stop, lastStop, trains => {
        this.processRealTime(context, trains.find(train => train.number === SNCFData.getTripNumber(this.trip)));
      });
    }
  }

  processRealTime(context, train) {
    if (!train) {
      // the train is not part of the real time announced trains
      // assume the train is not announced if the planned time has not passed yet

      if (!context.delayed && (context.noRealTime || context.prevStopTime !== undefined)) {
        // the train is not announced at 2 stops, assume it is not announced by the real times
        this.transition(RealTimeTrainState.Events.WAIT_FOR_NEXT_CHECK, {
          stopTime: context.prevStopTime || context.stopTime,
          noRealTime: true
        });
      }
      else {
        if (context.delayed) {
          // the train has been delayed
          this.transition(RealTimeTrainState.Events.WAIT_FOR_NEXT_CHECK, { stopTime: context.prevStopTime || context.stopTime, delayed: true, delayedMinutes: context.delayedMinutes });
        }
        else {
          let nextStopTime = SNCFData.getTripNextStopTime(this.trip, context.stopTime);
          if (!nextStopTime) {
            // it's the last stop of the train, the trip has probably ended
            this.transition(RealTimeTrainState.Events.TRAIN_NOT_SCHEDULED);
          }
          else {
            // look for the next station the train has to reach
            this.transition(RealTimeTrainState.Events.GET_REAL_TIME, {
              stopTime: nextStopTime,
              prevStopTime: context.stopTime,
              delayedMinutes: context.delayedMinutes
            });
          }
        }
      }
    }
    else {
      // the train is scheduled: check the time
      if (train.state === 'Supprimé') {
        // the train is not running
        this.transition(RealTimeTrainState.Events.TRAIN_CANCELED);
      }
      else {
        let prevStopTime = SNCFData.getTripPrevStopTime(this.trip, context.stopTime);
        if (prevStopTime) {
          if (train.state === 'Retardé') {
            // the train has been delayed; looking for the first station where the train is announced
            this.transition(RealTimeTrainState.Events.GET_REAL_TIME, {
              stopTime: prevStopTime,
              prevStopTime: context.stopTime,
              delayed: true
            });
          }
          else {
            let theoricalTime = SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(context.stopTime));
            let prevTheoricalTime = SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(prevStopTime));
            let deltaTime = train.time.getTime() - theoricalTime.getTime();
            let realPositionTime = train.time.getTime() - deltaTime;
            if (realPositionTime < prevTheoricalTime.getTime()) {
              // the train has not yet reached the previous station
              this.transition(RealTimeTrainState.Events.GET_REAL_TIME, {
                stopTime: context.stopTime,
                realTime: train.time,
                prevStopTime: prevStopTime
              });
            }
            else {
              // the train is between prevStopTime and stopTime
              this.transition(RealTimeTrainState.Events.WAIT_FOR_NEXT_CHECK, {
                stopTime: context.stopTime,
                delayedMinutes: deltaTime / (1000 * 60)
              });
            }
          }
        }
        else {
          // the train is still announced at the departure station
          this.transition(RealTimeTrainState.Events.WAIT_FOR_NEXT_CHECK, {
            stopTime: context.stopTime
          });
        }
      }
    }
  }

  waitFotNextCheck(context, delay) {
    var me = this;

    this.timer = setTimeout(() => {
      delete this.timer;
      this.transition(RealTimeTrainState.Events.GET_REAL_TIME, context);
    }, delay);

    if (process.env.NODE_ENV !== 'production') {
      if (me.debugTimer) {
        clearTimeout(this.debugTimer);
      }
      
      (function _setTimeout(delay) {
        me.debugTimer = setTimeout(() => {
          me.tripComp.props.actionDispatcher(updateDebuggingInfo('Prochaine vérification', RealTimeTrainState.formatDelay(delay)));
          delete me.debugTimer;
          if (delay > 1) {
            _setTimeout(delay - 1);
          }
        }, 1000);
      })(Math.floor(delay / 1000));
    }
  }

  static formatDelay(delay) {
    let seconds = delay % 60;
    delay = Math.floor(delay / 60);

    let minutes = delay % 60;
    delay = Math.floor(delay / 60);

    let hours = delay % 24;
    let days = Math.floor(delay / 24);

    seconds < 10 ? seconds = '0' + seconds : seconds;
    minutes > 0 && minutes < 10 ? minutes = '0' + minutes : minutes;
    hours > 0 && hours < 10 ? hours = '0' + hours : hours;

    return String.format("{0}{1}{2}{3}",
      days != 0 ? String.format("{0} jours ", days) : '',
      hours != 0 ? String.format("{0}:", hours) : '',
      minutes != 0 ? String.format("{0}:", minutes) : '',
      String.format("{0}", seconds));
  }

  computeTrainPosition(context) {
    let now = new Date().getTime();
    let timeToStopTime = SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(context.stopTime) + (context.delayedMinutes || 0)).getTime();
    let timeToDepartureStop = SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.trip))).getTime();
    context.timeUntilStop = Math.max(0, timeToStopTime - now);
    // don't go forward if the stop has already been reached but still announced, thus not passed by
    context.trainPosition = (Math.min(now + (context.isInitialComputing ? 0 : 60000), timeToStopTime) - timeToDepartureStop) / (60 * 1000);
    return context;
  }

  transition(event, param1) {
    switch (this.state) {
      case RealTimeTrainState.States.FINAL_STATE:
        // ignore all events
        break;

      case RealTimeTrainState.States.INITIAL_STATE:
        switch (event) {
          case RealTimeTrainState.Events.COMPONENT_WILL_UNMOUNT:
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRAIN_NOT_SCHEDULED:
            this.tripComp.updateState({ notScheduled: true });
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRAIN_SCHEDULED:
            let context = { stopTime: SNCFData.getTripFirstStopTime(this.trip) };
            this.tripComp.updateState(context);
            // check the real time of the train at least 1mn before
            this.waitFotNextCheck(context, Math.max(1000, SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.trip))).getTime() - new Date().getTime() - 60000));
            this.state = RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK;
            break;

          case RealTimeTrainState.Events.GET_REAL_TIME:
            this.checkRealTimeAt(param1);
            this.state = RealTimeTrainState.States.GETTING_INITIAL_REAL_TIME;
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      case RealTimeTrainState.States.TRAIN_NOT_PLANNED:
        switch (event) {
          case RealTimeTrainState.Events.COMPONENT_WILL_UNMOUNT:
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          default:
            // ignore all other events
            break;
        }
        break;

      case RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK:
        switch (event) {
          case RealTimeTrainState.Events.COMPONENT_WILL_UNMOUNT:
            this.abortWaitings();
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.GET_REAL_TIME:
            this.checkRealTimeAt(param1);
            this.state = RealTimeTrainState.States.GETTING_REAL_TIME;
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      case RealTimeTrainState.States.GETTING_REAL_TIME:
        switch (event) {
          case RealTimeTrainState.Events.COMPONENT_WILL_UNMOUNT:
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRAIN_NOT_SCHEDULED:
            this.tripComp.updateState({ notScheduled: true });
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRAIN_CANCELED:
            this.tripComp.updateState({ cancelled: true });
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.WAIT_FOR_NEXT_CHECK:
            let context = { stopTime: param1.stopTime, delayedMinutes: param1.delayedMinutes, isInitialComputing: false, cancelled: false, delayed: param1.delayed, noRealTime: param1.noRealTime };
            this.tripComp.updateState(this.computeTrainPosition(context));
            // check the time in 60s max, except if there is less than 60s until the next stop, but not if the next stop has still been reached
            this.waitFotNextCheck(context, Math.min(60000, context.timeUntilStop > 0 ? context.timeUntilStop : 60000));
            this.state = RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK;
            break;

          case RealTimeTrainState.Events.GET_REAL_TIME:
            this.checkRealTimeAt(param1);
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      case RealTimeTrainState.States.GETTING_INITIAL_REAL_TIME:
        switch (event) {
          case RealTimeTrainState.Events.COMPONENT_WILL_UNMOUNT:
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRAIN_NOT_SCHEDULED:
            this.tripComp.updateState({ notScheduled: true });
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRAIN_CANCELED:
            this.tripComp.updateState({ cancelled: true });
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.WAIT_FOR_NEXT_CHECK:
            let context = { stopTime: param1.stopTime, delayedMinutes: param1.delayedMinutes, isInitialComputing: true, cancelled: false, delayed: param1.delayed, noRealTime: param1.noRealTime };
            this.tripComp.updateState(this.computeTrainPosition(context));
            this.waitFotNextCheck(context, Math.min(2000, context.timeUntilStop));
            this.state = RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK;
            break;

          case RealTimeTrainState.Events.GET_REAL_TIME:
            this.checkRealTimeAt(param1);
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      default:
        this.invalidTransitionEvent(event);
    }
  }

  invalidTransitionEvent(event) {
    throw new Error(String.format("RealTimeTrainState: state: {0} - invalid transition event '{1}'", this.state, event));
  }

  static States = {
    INITIAL_STATE: 0,
    FINAL_STATE: 1,
    TRAIN_NOT_PLANNED: 2,         // the train is no longer planned
    WAITING_FOR_NEXT_CHECK: 3,    // the train is not yet running
    GETTING_REAL_TIME: 4,         // getting the real time of a station
    GETTING_INITIAL_REAL_TIME: 5  // getting the initial real time of a station
  }

  static Events = {
    TRAIN_NOT_PLANNED: 0,      // the train is not longer planned
    WAIT_FOR_NEXT_CHECK: 1,    // time to check the real time of the train
    GET_REAL_TIME: 2,          // get the real time of the train at the stop
    TRAIN_CANCELED: 3,         // train canceled, get the next occurrence of this trip
    TRAIN_SCHEDULED: 4,        // the train is scheduled at date, but has not started yet
    TRAIN_NOT_SCHEDULED: 5,    // the train is not scheduled at date
    COMPONENT_WILL_UNMOUNT: 6  // it's the end
  }

}