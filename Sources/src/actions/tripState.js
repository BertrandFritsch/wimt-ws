﻿import SNCFData, { RealTimeRequester } from '../components/SNCFData.jsx'
import { RealTimeStatus, plannedTrip, notPlannedTrip, runningTrip, arrivedTrip, newTripRealTimeState } from './actions.js';

export function tripStateSetUp(trip, dispatch, getState) {
  let state =  new RealTimeTrainState(trip, dispatch, getState);
  return () => state.transition(RealTimeTrainState.Events.TERMINATE);
}

const _2H = 2 * 60 * 60 * 1000;
const _1_5H = 1.5 * 60 * 60 * 1000;
const _1H = 1 * 60 * 60 * 1000;
const _30M = 30 * 60 * 1000;
const _15M = 15 * 60 * 1000;
const _10M = 10 * 60 * 1000;
const _5M = 5 * 60 * 1000;
const _1M = 1 * 60 * 1000;

class RealTimeTrainState {
  constructor(trip, dispatch, getState) {
    this.dispatch = dispatch;
    this.trip = SNCFData.getTrip(trip);
    this.getState = getState;

    setTimeout(_ => this.transition(RealTimeTrainState.Events.INITIAL_EVENT), 10);
    this.dispatch(newTripRealTimeState(RealTimeStatus.OFFLINE));
  }

  state = RealTimeTrainState.States.INITIAL_STATE;

  transition(event, param1, param2) {
    console.group("RealTimeTrainState.transition");
    console.log(String.format("%c State: {0} - Event: {1}", this.state, event), "color: " + (event === RealTimeTrainState.Events.TIMEOUT ? "#4CAF50" : "#03A9F4") + "; font-weight: bold", { param1, param2 });
    switch (this.state) {
      case RealTimeTrainState.States.INITIAL_STATE:
        switch (event) {
          case RealTimeTrainState.Events.INITIAL_EVENT:
            this.startupProcess();
            break;

          case RealTimeTrainState.Events.TRIP_PLANNED:
            // the train is not running but is planned for a further trip
            this.nextCheckAt(RealTimeTrainState.getNextCheckTimeout(param1, true), SNCFData.getTripFirstStopTime(this.trip));
            this.dispatch(plannedTrip(this.trip, param1));
            this.state = RealTimeTrainState.States.TRIP_PLANNED;
            break;

          case RealTimeTrainState.Events.TRIP_NOT_PLANNED:
            // the train is no more planned
            this.dispatch(notPlannedTrip(this.trip));
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRIP_RUNNING:
            // the train is running
            this.checkTripRealTime(param1);
            this.state = RealTimeTrainState.States.TRIP_RT_RUNNING;
            break;

          case RealTimeTrainState.Events.TRIP_ARRIVED:
            // the end station has been reached
            this.dispatch(arrivedTrip(this.trip, SNCFData.getTripLastStopTime(this.trip), 0));
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TERMINATE:
            this.cancelTimeout();
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      case RealTimeTrainState.States.TRIP_PLANNED:
        switch (event) {
          case RealTimeTrainState.Events.TERMINATE:
            this.cancelTimeout();
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TIMEOUT:
            this.checkTripRealTime(param1);
            break;

          case RealTimeTrainState.Events.GOT_TRIP_REAL_TIME:
            this.processRealTimeData(param1, param2);
            break;

          case RealTimeTrainState.Events.TRIP_RT_CANCELLED:
            // the train has been cancelled
            this.dispatch(cancelledTrip(this.trip));
            this.dispatch(newTripRealTimeState(RealTimeStatus.ONLINE));
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRIP_RT_DELAYED:
            // the train has been delayed
            this.dispatch(delayedTrip(this.trip, param1));
            this.dispatch(newTripRealTimeState(RealTimeStatus.ONLINE));
            this.locateDelayedTrainPosition(param1);
            break;

          case RealTimeTrainState.Events.TRIP_RT_RUNNING:
            // the train is running
            this.dispatch(runningTrip(this.trip, param1, param2 / (1000 * 60)));
            this.dispatch(newTripRealTimeState(RealTimeStatus.ONLINE));
            this.nextCheckAt(RealTimeTrainState.getNextCheckTimeout(SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(param1) + (param2 / (1000 * 60))), false), param1);
            break;

          case RealTimeTrainState.Events.TRIP_RT_NONE:
            // no real time
            this.dispatch(runningTrip(this.trip, param1, 0));
            this.dispatch(newTripRealTimeState(RealTimeStatus.OFFLINE));
            this.nextCheckAt(RealTimeTrainState.getNextCheckTimeout(SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(param1)), false));
            this.state = RealTimeTrainState.States.TRIP_RUNNING;
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      case RealTimeTrainState.States.TRIP_RT_RUNNING:
        switch (event) {
          case RealTimeTrainState.Events.TERMINATE:
            this.cancelTimeout();
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TIMEOUT:
            this.checkTripRealTime(param1);
            break;

          case RealTimeTrainState.Events.GOT_TRIP_REAL_TIME:
            this.processRealTimeData(param1, param2);
            break;

          case RealTimeTrainState.Events.TRIP_RT_CANCELLED:
            // the train has been cancelled
            this.dispatch(cancelledTrip(this.trip));
            this.dispatch(newTripRealTimeState(RealTimeStatus.ONLINE));
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TRIP_RT_DELAYED:
            // the train has been delayed
            this.dispatch(delayedTrip(this.trip, param1));
            this.dispatch(newTripRealTimeState(RealTimeStatus.ONLINE));
            this.locateDelayedTrainPosition(param1);
            break;

          case RealTimeTrainState.Events.TRIP_RT_RUNNING:
            // the train is running
            this.dispatch(runningTrip(this.trip, param1, param2 / (1000 * 60)));
            this.dispatch(newTripRealTimeState(RealTimeStatus.ONLINE));
            this.nextCheckAt(RealTimeTrainState.getNextCheckTimeout(SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(param1) + (param2 / (1000 * 60))), false), param1);
            break;

          case RealTimeTrainState.Events.TRIP_RT_NONE:
            // no real time -- look for the train at the next stop
            this.checkTripRealTime(SNCFData.getTripNextStopTime(this.trip, param1));
            this.state = RealTimeTrainState.States.TRIP_RT_NONE;
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      case RealTimeTrainState.States.TRIP_RT_NONE:
        switch (event) {
          case RealTimeTrainState.Events.TERMINATE:
            this.cancelTimeout();
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.TIMEOUT:
            this.checkTripRealTime(param1);
            break;

          case RealTimeTrainState.Events.GOT_TRIP_REAL_TIME:
            this.processRealTimeData(param1, param2);
            break;

          case RealTimeTrainState.Events.TRIP_RT_CANCELLED:
          case RealTimeTrainState.Events.TRIP_RT_DELAYED:
          case RealTimeTrainState.Events.TRIP_RT_RUNNING:
            // delegate those events to the the TRIP_RT_RUNNING state
            this.state = RealTimeTrainState.States.TRIP_RT_RUNNING;
            this.transition(event, param1, param2);
            break;

          case RealTimeTrainState.Events.TRIP_RT_NONE:
            // no real time -- for the second time, assume there is no real time for now
            this.dispatch(newTripRealTimeState(RealTimeStatus.OFFLINE));
            this.nextPlannedCheck((this.getState().viewTrip.state && this.getState().viewTrip.state.delayed) || 0);
            break;

          case RealTimeTrainState.Events.TRIP_RUNNING:
            // another planned stop has to be reached
            this.dispatch(runningTrip(this.trip, param1, (this.getState().viewTrip.state && this.getState().viewTrip.state.delayed) || 0));
            this.nextCheckAt(RealTimeTrainState.getNextCheckTimeout(SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(param1) + this.getState().viewTrip.state.delayed), false), param1);
            break;

          case RealTimeTrainState.Events.TRIP_ARRIVED:
            // the end station has been reached
            this.dispatch(arrivedTrip(this.trip, SNCFData.getTripLastStopTime(this.trip), (this.getState().viewTrip.state && this.getState().viewTrip.state.delayed) || 0));
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          default:
            this.invalidTransitionEvent(event);
        }
        break;

      case RealTimeTrainState.States.FINAL_STATE:
        // ignore all events
        break;

      default:
        this.invalidTransitionEvent(event);
    }
    console.log(String.format("State: {0}", this.state));
    console.groupEnd();
  }

  invalidTransitionEvent(event) {
    throw new Error(String.format("RealTimeTrainState: state: {0} - invalid transition event '{1}'", this.state, event));
  }

  processRealTimeData(stopTime, train) {
    if (train) {
      if (train.state === 'Supprimé') {
        this.transition(RealTimeTrainState.Events.TRIP_RT_CANCELLED);
      }
      else if (train.state === 'Retardé') {
        this.transition(RealTimeTrainState.Events.TRIP_RT_DELAYED, stopTime);
      }
      else {
        this.transition(RealTimeTrainState.Events.TRIP_RT_RUNNING, stopTime, train.time.getTime() - SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime)).getTime());
      }
    }
    else {
      this.transition(RealTimeTrainState.Events.TRIP_RT_NONE, stopTime);
    }
  }

  checkTripRealTime(stopTime) {
    // TODO: handle the last stop case
    this.dispatch(newTripRealTimeState(RealTimeStatus.CHECKING));
    RealTimeRequester.get(SNCFData.getStopTimeStop(stopTime), SNCFData.getTripLastStop(this.trip), trains => {
      this.transition(RealTimeTrainState.Events.GOT_TRIP_REAL_TIME, stopTime, trains.find(train => train.number === SNCFData.getTripNumber(this.trip)));
    });
  }

  nextCheckAt(duration, stopTime) {
    this.timeoutId = setTimeout(_ => {
      this.timeoutId = 0;
      this.transition(RealTimeTrainState.Events.TIMEOUT, stopTime, duration);
    }, duration);
  }

  cancelTimeout() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = 0;
    }
  }

  /**
   * Get the next planned stop the train has not already passed by
   * according to the accumulated delay
   * @param delayed {Integer} Accumulated delay
   */
  nextPlannedCheck(delayed) {
    let now = new Date();

    // determine the next planned stop the train has not already passed by
    let stopTime = SNCFData.getTripStopTimes(this.trip).find((stopTime) => {
      return SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime) + delayed).getTime() > now.getTime();
    });

    if (stopTime) {
      this.transition(RealTimeTrainState.Events.TRIP_RUNNING, stopTime);
    }
    else {
      this.transition(RealTimeTrainState.Events.TRIP_ARRIVED);
    }
  }

  startupProcess() {
    let now = new Date();

    if (!SNCFData.doesRunAt(this.trip, now)) {
      // if the train does not run today, determine the next run
      let nextRunDate = SNCFData.getNextRunDate(this.trip, now);
      if (!nextRunDate) {
        // the train does no more run
        this.transition(RealTimeTrainState.Events.TRIP_NOT_PLANNED);
      }
      else {
        // next run is at nextRunDate
        this.transition(RealTimeTrainState.Events.TRIP_PLANNED, SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.trip)), nextRunDate));
      }
    }
    else {
      // the trip is planned today
      let departureDate = SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(SNCFData.getTripFirstStopTime(this.trip)));
      if (departureDate.getTime() > now.getTime()) {
        // the trip has not yet started
        this.transition(RealTimeTrainState.Events.TRIP_PLANNED, departureDate);
      }
      else {
        // determine the last planned stop the train has just passed
        let prevStopTime = SNCFData.getTripStopTimes(this.trip).reduce((r, stopTime) => {
          return SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime)).getTime() < now.getTime() ? stopTime : r;
        }, null);

        if (prevStopTime !== SNCFData.getTripLastStopTime(this.trip)) {
          this.transition(RealTimeTrainState.Events.TRIP_RUNNING, prevStopTime);
        }
        else {
          this.transition(RealTimeTrainState.Events.TRIP_ARRIVED);
        }
      }
    }
  }

  /**
   * Determine the next time the real time has to be checked
   * @param date {Date} the next trip date
   * @param initialCheck {boolean} true if its the initial check to immediately inform about the train status
   * @returns {number}
   */
  static getNextCheckTimeout(date, initialCheck) {
    let time = date.getTime();
    let now = Date.now();

    if (initialCheck && time - now < _2H) {
      // check immediately to display the accurate information as soon as possible
      return now + 10;
    }

    if (time - now > _2H) {
      return time - _2H;
    }
    else if (time - now > _1_5H) {
      return time - _1_5H;
    }
    else if (time - now > _1H) {
      return time - _1H;
    }
    else if (time - now > _30M) {
      return time - _30M;
    }
    else if (time - now > _15M) {
      return time - _15M;
    }
    else if (time - now > _10M) {
      return time - _10M;
    }
    else if (time - now > _5M) {
      return time - _5M;
    }
    else {
      let duration = Math.min(now + _1M, time) - now;
      return duration > 0 ? duration : _1M;
    }
  }

  static States = {
    TRIP_PLANNED: 'TRIP_PLANNED',
    TRIP_RT_RUNNING: 'TRIP_RT_RUNNING',
    TRIP_RT_NONE: 'TRIP_RT_NONE',       // the train has not been found at the current stop
    TRIP_RUNNING: 'TRIP_RUNNING',       // the train is running but there is no real time data for now
    INITIAL_STATE: 'INITIAL_STATE',
    FINAL_STATE: 'FINAL_STATE',
    TRIP_NOT_PLANNED: 'TRIP_NOT_PLANNED',         // the train is no longer planned
    WAITING_FOR_NEXT_CHECK: 'WAITING_FOR_NEXT_CHECK',    // the train is not yet running
    GETTING_REAL_TIME: 'GETTING_REAL_TIME',         // getting the real time of a station
    GETTING_INITIAL_REAL_TIME: 'GETTING_INITIAL_REAL_TIME'  // getting the initial real time of a station
  }

  static Events = {
    INITIAL_EVENT: 'INITIAL_EVENT',         // initial event
    TIMEOUT: 'TIMEOUT',
    GOT_TRIP_REAL_TIME: 'GOT_TRIP_REAL_TIME',
    TRIP_RT_RUNNING: 'TRIP_RT_RUNNING',
    TRIP_RT_DELAYED: 'TRIP_RT_DELAYED',
    TRIP_RT_NONE: 'TRIP_RT_NONE',         // no real time
    TRIP_RUNNING: 'TRIP_RUNNING',
    TRIP_ARRIVED: 'TRIP_ARRIVED',
    TRIP_NOT_PLANNED: 'TRIP_NOT_PLANNED',      // the train is not longer planned
    WAIT_FOR_NEXT_CHECK: 'WAIT_FOR_NEXT_CHECK',    // time to check the real time of the train
    GET_REAL_TIME: 'GET_REAL_TIME',          // get the real time of the train at the stop
    TRIP_RT_CANCELLED: 'TRIP_RT_CANCELLED',         // train canceled, get the next occurrence of this trip
    TRAIN_SCHEDULED: 'TRAIN_SCHEDULED',        // the train is scheduled at date, but has not started yet
    TRAIN_NOT_SCHEDULED: 'TRAIN_NOT_SCHEDULED',    // the train is not scheduled at date
    TERMINATE: 'TERMINATE'  // it's the end
  }
}