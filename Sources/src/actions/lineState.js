import SNCFData from '../SNCFData.js'

export function lineTripsGenerator(departureStopLine, arrivalStopLine) {
  function* tripsGenerator() {
    const minutesPerDay = 24 * 60;
    let trips = [];
    let date = new Date();
    const now = (date.getTime() - SNCFData.getDateByMinutes(0).getTime()) / 1000 / 60;

    date = SNCFData.getDateByMinutes(0, date);

    if (!departureStopLine) {
      departureStopLine = arrivalStopLine;
      arrivalStopLine = null;
    }

    if (departureStopLine) {
      trips = SNCFData.getStopTrips(SNCFData.getStopById(departureStopLine));

      if (arrivalStopLine) {
        // filter trips that pass by the arrival stop too
        const arrivalTrips = SNCFData.getStopTrips(SNCFData.getStopById(arrivalStopLine));
        trips = trips.filter(departureStopTime => {
          const trip = SNCFData.getStopTimeTrip(departureStopTime);
          const arrivalTrip = arrivalTrips.find(arrivalStopTime => SNCFData.getStopTimeTrip(arrivalStopTime) === trip);
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
  }

  return (count) => {
    const trips = [];
    for (const t of tripsGenerator()) {
      trips.push(t);
      if (--count <= 0) break;
    }

    return trips;
  }
}
