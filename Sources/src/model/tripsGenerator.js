import SNCFData from '../SNCFData.js';
import DateHelpers from '../DateHelpers';
import ParisTimezone from '../ParisTimezone';

export function tripsGenerator(departureStop, arrivalStop, date) {
  let tripsGenerator = (function* () {
//    const minutesPerDay = 24 * 60;
    let trips = [];
    const now = (date.getTime() - DateHelpers.getDateByMinutes(0).getTime()) / 1000 / 60;

    date = ParisTimezone.toParisTimezone(date);
    date = DateHelpers.getDateByMinutes(0, date);

    if (!departureStop) {
      departureStop = arrivalStop;
      arrivalStop = null;
    }

    if (departureStop) {
      trips = SNCFData.getStopTrips(SNCFData.getStopById(departureStop));

      if (arrivalStop) {
        // filter trips that pass by the arrival stop too
        const arrivalTrips = SNCFData.getStopTrips(SNCFData.getStopById(arrivalStop));
        trips = trips.filter(departureStopTime => {
          const trip = SNCFData.getStopTimeTrip(departureStopTime);
          const arrivalTrip = arrivalTrips.find(arrivalStopTime => SNCFData.getStopTimeTrip(arrivalStopTime) === trip);
          return arrivalTrip && SNCFData.getStopTimeSequence(departureStopTime) < SNCFData.getStopTimeSequence(arrivalTrip);
        });
      }

      // get the next very first arrival trip
      let cursor = trips.findIndex(t => {
        let lastStopTime = SNCFData.getStopTimeTime(SNCFData.getTripLastStopTime(SNCFData.getTrip(SNCFData.getStopTimeTrip(t))));

        // if (lastStopTime >= minutesPerDay) {
        //   lastStopTime -= minutesPerDay;
        // }

        return now <= lastStopTime;
      });

      if (cursor < 0) {
        cursor = trips.length;
      }

      // use startCursor to prevent infinite cycling

      for (let startCursor = cursor; true;) {
        if (cursor === trips.length) {
          cursor = 0;
          date = new Date(date.getTime());
          date.setDate(date.getDate() + 1);
        }

        const trip = SNCFData.getTrip(SNCFData.getStopTimeTrip(trips[cursor]));
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
  }());

  return count => {
    const trips = [];
    for (let i = 0; i < count; ++i) {
      const item = tripsGenerator.next();
      if (item.value !== undefined) {
        trips.push(item.value);
      }

      if (item.done) {
        break;
      }
    }

    return trips;
  };
}
