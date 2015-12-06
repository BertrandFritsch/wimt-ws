import SNCFData from '../components/SNCFData.jsx'
import { viewLines } from '../actions/actions.js'

export function lineStateSetUp(departureStopLine, arrivalStopLine, dispatch, getState) {
  let state =  new LineState(departureStopLine, arrivalStopLine, dispatch, getState);
  return () => state.nextTrips();
}

const minutesPerDay = 24 * 60;

class LineState {
  constructor(departureStopLine, arrivalStopLine, dispatch, getState) {
    this.dispatch = dispatch;
    this.getState = getState;

    this.tripsGenerator = function* () {
      let trips = [];
      let date = new Date();
      let now = (date.getTime() - SNCFData.getDateByMinutes(0).getTime()) / 1000 / 60;

      date = SNCFData.getDateByMinutes(0, date);

      if (!departureStopLine) {
        departureStopLine = arrivalStopLine;
        arrivalStopLine = null;
      }

      if (departureStopLine) {
        trips = SNCFData.getStopTrips(SNCFData.getStopById(departureStopLine));

        if (arrivalStopLine) {
          // filter trips that pass by the arrival stop too
          let arrivalTrips = SNCFData.getStopTrips(SNCFData.getStopById(arrivalStopLine));
          trips = trips.filter(departureStopTime => {
            let trip = SNCFData.getStopTimeTrip(departureStopTime);
            let arrivalTrip = arrivalTrips.find(arrivalStopTime => SNCFData.getStopTimeTrip(arrivalStopTime) === trip);
            return arrivalTrip && SNCFData.getStopTimeSequence(departureStopTime) < SNCFData.getStopTimeSequence(arrivalTrip);
          });
        }

        // get the next very first arrival trip
        let cursor = trips.findIndex(t => {
          let lastStopTime = SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(SNCFData.getTrip(SNCFData.getStopTimeTrip(t))));

          if (lastStopTime >= minutesPerDay) {
            lastStopTime -= minutesPerDay;
          }

          return now <= lastStopTime;
        });

        if (cursor < 0) {
          cursor = trips.length;
        }

        // use startCursor to prevent infinite cycling

        for (let startCursor = cursor ;; ) {
          if (cursor === trips.length) {
            cursor = 0;
            date = new Date(date);
            date.setDate(date.getDate() + 1);
          }

          let trip = SNCFData.getTrip(SNCFData.getStopTimeTrip(trips[cursor]));
          if (SNCFData.doesRunAt(trip, date)) {
            startCursor = cursor;
            yield { date, trip };
          }

          ++cursor;

          if (startCursor === cursor) {
            break;
          }
        }
      }
    };

    this.nextTrips(40);
  }

  nextTrips(count) {
    let trips = [];
    for (let t of this.tripsGenerator()) {
      trips.push(t);
      if (--count <= 0) break;
    }

    this.dispatch(viewLines(trips));
  }
}