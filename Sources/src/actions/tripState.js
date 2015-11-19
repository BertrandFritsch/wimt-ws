import SNCFData, { RealTimeRequester } from '../components/SNCFData.jsx'
import { plannedTrip, PLANNED_TRIP } from './actions.js';

export function tripStateSetUp(trip, dispatch, getState) {
  let state =  new RealTimeTrainState(trip, dispatch, getState);
  return () => state.transition(RealTimeTrainState.Events.TERMINATE);
}

class RealTimeTrainState {
  constructor(trip, dispatch, getState) {
    this.dispatch = dispatch;
    this.trip = SNCFData.getTrip(trip);
    this.getState = getState;

    setTimeout(_ => this.transition(RealTimeTrainState.Events.INITIAL_EVENT), 10);
  }

  state = RealTimeTrainState.States.INITIAL_STATE;

  transition(event, param1) {
    switch (this.state) {
      case RealTimeTrainState.States.INITIAL_STATE:
        switch (event) {
          case RealTimeTrainState.Events.INITIAL_EVENT:
            this.startupProcess();
            break;

          case RealTimeTrainState.Events.TRIP_PLANNED:
            // the train is not running but is planned for a further trip
            this.nextCheckAt(this.getNextDepartureCheck(param1, true));
            this.dispatch(plannedTrip(this.trip, param1));
            this.state = RealTimeTrainState.States.TRIP_PLANNED;
            break;

          case RealTimeTrainState.Events.TRIP_NOT_PLANNED:
            // the train is no more planned
            this.dispatch(notPlannedTrip(this.trip));
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
            this.checkTripRealTime(SNCFData.getTripFirstStop(this.trip));
            break;

          case RealTimeTrainState.Events.GOT_TRIP_REAL_TIME:
            this.processRealTimeData(SNCFData.getTripFirstStop(this.trip), param1);
            break;

          case RealTimeTrainState.Events.CANCELLED:
            // the train has been cancelled
            this.dispatch(cancelledTrip(this.trip));
            this.dispatch(newTripRealTimeState(true));
            this.state = RealTimeTrainState.States.FINAL_STATE;
            break;

          case RealTimeTrainState.Events.DELAYED:
            // the train has been delayed
            this.dispatch(delayedTrip(this.trip, param1));
            this.dispatch(newTripRealTimeState(true));
            this.locateDelayedTrainPosition()
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
  }

  invalidTransitionEvent(event) {
    throw new Error(String.format("RealTimeTrainState: state: {0} - invalid transition event '{1}'", this.state, event));
  }

  processRealTimeData(stopTime, train) {
    if (train) {
      if (train.state === 'Supprimé') {
        this.transition(RealTimeTrainState.Events.CANCELLED);
      }
      else if (train.state === 'Retardé') {
        this.transition(RealTimeTrainState.Events.DELAYED, stopTime);
      }
      else {

      }
    }
  }

  checkTripRealTime(stop) {
    RealTimeRequester.get(stop, SNCFData.getTripLastStop(this.trip), trains => {
      this.transition(RealTimeTrainState.Events.GOT_TRIP_REAL_TIME, trains.find(train => train.number === SNCFData.getTripNumber(this.trip)));
    });
  }

  nextCheckAt(time) {
    this.timeoutId = setTimeout(_ => {
      this.timeoutId = 0;
      this.transition(RealTimeTrainState.Events.TIMEOUT);
    }, time - Date.now());
  }

  cancelTimeout() {
    if (this.timeoutId) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = 0;
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
    }
  }

  /**
   * Determine the next time the real time has to be checked
   * @param date {Date} the next trip date
   * @returns {number}
   */
  getNextDepartureCheck(date, initialCheck) {
    let time = date.getTime();
    let now = Date.now();

    const _2H = 2 * 60 * 60 * 1000;
    const _1_5H = 1.5 * 60 * 60 * 1000;
    const _1H = 1 * 60 * 60 * 1000;
    const _30M = 30 * 60 * 1000;
    const _15M = 15 * 60 * 1000;
    const _10M = 10 * 60 * 1000;
    const _5M = 5 * 60 * 1000;
    const _1M = 1 * 60 * 1000;

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
      return Math.min(now + _1M, time);
    }
  }

  static States = {
    TRIP_PLANNED: -1,
    INITIAL_STATE: 0,
    FINAL_STATE: 1,
    TRIP_NOT_PLANNED: 2,         // the train is no longer planned
    WAITING_FOR_NEXT_CHECK: 3,    // the train is not yet running
    GETTING_REAL_TIME: 4,         // getting the real time of a station
    GETTING_INITIAL_REAL_TIME: 5  // getting the initial real time of a station
  }

  static Events = {
    INITIAL_EVENT: -1,         // initial event
    TIMEOUT: -2,
    GOT_TRIP_REAL_TIME: -3,
    TRIP_NOT_PLANNED: 0,      // the train is not longer planned
    WAIT_FOR_NEXT_CHECK: 1,    // time to check the real time of the train
    GET_REAL_TIME: 2,          // get the real time of the train at the stop
    TRAIN_CANCELED: 3,         // train canceled, get the next occurrence of this trip
    TRAIN_SCHEDULED: 4,        // the train is scheduled at date, but has not started yet
    TRAIN_NOT_SCHEDULED: 5,    // the train is not scheduled at date
    TERMINATE: 6  // it's the end
  }
}