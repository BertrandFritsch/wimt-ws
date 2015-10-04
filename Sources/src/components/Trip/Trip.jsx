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
    this.state = {
      delayedMinutes: null,
      delayed: false,
      cancelled: false
    };
    this.automate = new RealTimeTrainState(this, props.trip);
  }

  componentWillUnmount = () => {
    this.automate.transition(RealTimeTrainState.Events.COMPONENT_WILL_UNMOUNT);
  }

  render = () => {
    let stopTimeReached = false;
    let rows = this.props.trip.stopTimes.map(stopTime => {
      if (stopTimeReached || stopTime === this.state.stopTime) {
        stopTimeReached = true;
      }

      return { delayedMinutes: stopTimeReached ? this.state.delayedMinutes : null, delayed: stopTimeReached ? this.state.delayed : null }
    })

    return (
      <div className="trip-frame">
        <TripHeaderRow trip={this.props.trip} state={this.state.cancelled ? 'Supprimé' : this.state.delayed ? 'Retardé' : this.state.delayedMinutes ? String.format("{0} mn", this.state.delayedMinutes) : "A l'heure"}/>
        {
          this.props.trip.stopTimes.map((stopTime, index) => {
            return <TripStopRow key={index} stopTime={stopTime} delayedMinutes={rows[index].delayedMinutes || null} delayed={rows[index].delayed || false}/> })
        }
      </div>
    )
  }

  onResize = () => {
    this.setState({
      containerHeight: React.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }

  updateState = (stopTime, delayedMinutes, cancelled, delayed) => {
    this.setState({
      stopTime: stopTime,
      delayedMinutes: delayedMinutes,
      cancelled: cancelled,
      delayed: delayed
    });
  }
}

export default Trip;

class RealTimeTrainState {
  constructor(tripComp, trip) {
    this.tripComp = tripComp;
    this.trip = trip;

    this.initialTransition();
  }

  state = RealTimeTrainState.States.INITIAL_STATE

  initialTransition() {
    if (SNCFData.doesRunAt(this.trip, new Date())) {
      // localization of the train
      let date = new Date();

      // look for the nearest stop that the train has still to pass by
      let stopTime = this.trip.stopTimes.find(stop => date.getTime() <= SNCFData.getDateByMinutes(stop.time).getTime());
      if (stopTime === undefined || stopTime === this.trip.stopTimes[0]) {
        // the train has already passed today, or it not yet running, waiting for the next trip
        this.transition(RealTimeTrainState.Events.TRAIN_NOT_RUNNING);
      }
      else {
        this.transition(RealTimeTrainState.Events.GET_REAL_TIME, { stopTime: stopTime });
      }
    }
    else {
      this.transition(RealTimeTrainState.Events.TRAIN_NOT_RUNNING);
    }
  }

  getNextTripDate() {
    //TODO: do it!
  }

  scheduleNextCheck(date) {
    //TODO: do it!
  }

  abortWaitings() {
    //TODO: do it!
  }

  checkRealTimeAt(context) {
    let stop = SNCFData.getStop(context.stopTime.stop),
      lastStop = SNCFData.getLastStop(this.trip);

    if (stop === lastStop) {
      // specific case for the last stop as it is never announced by the real time API
      //TODO: handle the case
      debugger;
    }

    RealTimeRequester.get(stop, lastStop, trains => {
      //TODO: handle the case where the request has failed

      let train = trains.find(train => train.number === this.trip.number);
      if (!train) {
        // the train is not part of the real time announced trains
        let nextStopTime = SNCFData.getNextStopTime(this.trip, context.stopTime);
        if (!nextStopTime) {
          // it's the last stop of the train, the trip has probably ended
          this.transition(RealTimeTrainState.Events.TRAIN_NOT_RUNNING);
        }
        else {
          // look for the next station the train has to reach
          this.transition(RealTimeTrainState.Events.GET_REAL_TIME, nextStopTime);
        }
      }
      else {
        // the train is scheduled: check the time
        if (train.state === 'Supprimé') {
          // the train is not running
          this.transition(RealTimeTrainState.States.TRAIN_CANCELED);
        }
        else if (train.mode === 'R') {
          let prevStopTime = SNCFData.getPrevStopTime(this.trip, context.stopTime);
          if (prevStopTime) {
            if (train.state === 'Retardé') {
              // the train has been delayed; looking for the first station where the train is announced
              this.transition(RealTimeTrainState.Events.GET_REAL_TIME, {stopTime: context.stopTime, prevStopTime: prevStopTime, delayed: true});
            }
            else {
              let theoricalTime = SNCFData.getDateByMinutes(context.stopTime.time);
              let prevTheoricalTime = SNCFData.getDateByMinutes(prevStopTime.time);
              let deltaTime = train.time.getTime() - theoricalTime.getTime();
              let realPositionTime = train.time.getTime() - deltaTime;
              if (realPositionTime < prevTheoricalTime.getTime()) {
                // the train has not yet reached the previous station
                this.transition(RealTimeTrainState.Events.GET_REAL_TIME, {stopTime: context.stopTime, realTime: train.time, prevStopTime: prevStopTime});
              }
              else {
                // the train is between prevStopTime and stopTime
                this.transition(RealTimeTrainState.Events.TRAIN_ANNOUNCED, {stopTime: context.stopTime, delayedMinutes: deltaTime / (1000 * 60)});
              }
            }
          }
          else {
            // the train is still announced at the departure station
            this.transition(RealTimeTrainState.Events.TRAIN_NOT_RUNNING);
          }
        }
        else {
          // there is no real time
        }
      }
    });

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

          case RealTimeTrainState.Events.TRAIN_NOT_RUNNING:
            let nextTripDate = this.getNextTripDate();
            if (nextTripDate) {
              this.scheduleNextCheck(nextTripDate);
              this.state = RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK;
            }
            else {
              this.state = RealTimeTrainState.States.TRAIN_NOT_PLANNED;
            }
            break;

          case RealTimeTrainState.Events.GET_REAL_TIME:
            this.checkRealTimeAt(param1);
            this.state = RealTimeTrainState.States.GETTING_REAL_TIME;
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

          case RealTimeTrainState.Events.CHECK_TRAIN_REAL_TIME:
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

          case RealTimeTrainState.Events.TRAIN_NOT_RUNNING:
          {
            let nextTripDate = this.getNextTripDate();
            if (nextTripDate) {
              this.scheduleNextCheck(nextTripDate);
              this.state = RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK;
            }
            else {
              this.state = RealTimeTrainState.States.TRAIN_NOT_PLANNED;
            }
            break;
          }

          case RealTimeTrainState.Events.GET_REAL_TIME:
            this.checkRealTimeAt(param1);
            this.state = RealTimeTrainState.States.GETTING_REAL_TIME;
            break;

          case RealTimeTrainState.Events.TRAIN_CANCELED:
          {
            this.tripComp.updateState(null, null, true, false);
            let nextTripDate = this.getNextTripDate();
            if (nextTripDate) {
              this.scheduleNextCheck(nextTripDate);
              this.state = RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK;
            }
            else {
              this.state = RealTimeTrainState.States.TRAIN_NOT_PLANNED;
            }
            break;
          }

          case RealTimeTrainState.Events.TRAIN_ANNOUNCED:
            this.tripComp.updateState(param1.stopTime, param1.delayedMinutes, false, false);
            this.state = RealTimeTrainState.States.WAITING_FOR_NEXT_CHECK;
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
    TRAIN_NOT_PLANNED: 2,      // the train is no longer planned
    WAITING_FOR_NEXT_CHECK: 3, // the train is not yet running
    GETTING_REAL_TIME: 4,      // getting the real time of a station
    TRAIN_RUNNING: 5           // the train has been localized
  }

  static Events = {
    TRAIN_NOT_PLANNED: 0,      // the train is not longer planned
    CHECK_TRAIN_REAL_TIME: 1,  // time to check the real time of the train
    GET_REAL_TIME: 2,          // get the real time of the train at the stop
    TRAIN_NOT_RUNNING: 3,      // schedule next check
    TRAIN_CANCELED: 4,         // train canceled, get the next occurrence of this trip
    TRAIN_ANNOUNCED: 5,        // the train is announced
    COMPONENT_WILL_UNMOUNT: 6  // it's the end
  }

}