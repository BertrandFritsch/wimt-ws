/* global Services */
/* global Stops */
/* global Trips */

import DateHelpers from './DateHelpers';
import ParisTimeZone from './ParisTimezone';

/**
 * Data structures:
 *   - Trip:
 *       0: id
 *       1: number
 *       2: service
 *       3: mission
 *       4: direction, 0 - forward, 1 - backward
 *       5: [stopTime, stop]
 *
 *   - Stop:
 *       0: id
 *       1: name
 *       2: [stopTime, sequence, trip]
 *
 *   - Service:
 *       0: start date
 *       1: end date
 *       2: days,
 *       3: [day, type]
 *
 */

function parseParisLocalDate(time) {
  const matches = /(\d\d)\/(\d\d)\/(\d\d\d\d) (\d\d):(\d\d)/.exec(time);
  return new Date(`${matches[3]}-${matches[2]}-${matches[1]}T${matches[4]}:${matches[5]}${ParisTimeZone.getParisTimeZoneStr()}`);
}

// SNCFData interface
function getStopTimeTrip(stopTime) {
  return stopTime[2];
}

function getStopTimeTime(stopTime) {
  return stopTime[0] - ParisTimeZone.getParisJetlag();
}

function getStopTimeStop(stopTime) {
  return Stops[stopTime[1]];
}

function getStopStopTimeByTrip(stop, trip) {
  const tripIndex = Trips.indexOf(trip);
  return stop[2].find(t => t[2] === tripIndex);
}

function getStopTimeSequence(stopTime) {
  return stopTime[1];
}

function getStop(index) {
  return Stops[index];
}

function getStopById(id) {
  return Stops.find(s => s[0] === id);
}

function getStopName(stop) {
  return stop[1];
}

function getStopId(stop) {
  return stop[0];
}

function getStopUICCode(stop) {
  return stop[0];
}

function getStopTrips(stop) {
  return stop[2];
}

function getStopsArray() {
  return Stops.slice(0).sort((stop1, stop2) => stop1[1] < stop2[1] ? -1 : 1);
}

function getTrip(index) {
  return Trips[index];
}

function getTripById(id) {
  return Trips.find(t => t !== null && t[0] === id);
}

function getTripId(trip) {
  return trip[0];
}

function getTripStopTimes(trip) {
  return trip[5];
}

function getTripFirstStopTime(trip) {
  return trip[5][0];
}

function isTripFirstStopTime(trip, stopTime) {
  return trip[5][0] === stopTime;
}

function getTripLastStopTime(trip) {
  return trip[5][trip[5].length - 1];
}

function getTripMission(trip) {
  return trip[3];
}

function getTripNumber(trip) {
  return trip[1];
}

function getTripNextStopTime(trip, stopTime) {
  let i = trip[5].indexOf(stopTime);

  if (i === -1) {
    throw new Error('Invalid trip stop time');
  }

  return i < trip[5].length ? trip[5][i + 1] : null;
}

function getTripPrevStopTime(trip, stopTime) {
  let i = trip[5].indexOf(stopTime);

  if (i === -1) {
    throw new Error('Invalid trip stop time');
  }

  return i > 0 ? trip[5][i - 1] : null;
}

function isTripByNumber(trip, number) {
  return trip[1] === number;
}

function getTripFirstStop(trip) {
  return getStop(getTripFirstStopTime(trip)[1]);
}

function getTripLastStop(trip) {
  return getStop(getTripLastStopTime(trip)[1]);
}

/**
 * gets the trip departure date of the stop time
 * @param {Array} stopTime any stop time of the trip
 * @param {Date} date the date of the stop time
 * @returns {Date} the departure date
 */
// function getTripDepartureDateByStopTime(stopTime, date = new Date()) {
//   const minutesPerDay = 24 * 60;
//
//   //be aware of trips that starts the day before
//   if (getStopTimeTime(stopTime) >= minutesPerDay) {
//     date = new Date(date.getTime());
//     date.setDate(date.getDate() - 1);
//   }
//
//   return DateHelpers.getDateByMinutes(getStopTimeTime(getTripFirstStopTime(getTrip(getStopTimeTrip(stopTime)))), date);
// }

function getService(id) {
  return Services[id];
}

function doesRunAt(trip, date) {
  const minutesPerDay = 24 * 60;
  const stopTime = trip[5][0];

  let day = DateHelpers.getDateAsDays(date);

  // be aware of trips that starts the day before
  if (stopTime[0] >= minutesPerDay) {
    --day;
  }

  let service = Services[trip[2]];
  let exception = service[3] && service[3].find(e => e[0] === day);
  let doesRunAt = exception && exception[1];

  return doesRunAt
    || ((doesRunAt === null || doesRunAt === undefined) && (function () {
      if (service[0] && service[0] <= day) {
        let endDay = service[1] + 1;
        if (day < endDay) {
          if (service[2][(day - 3) % 7]) {
            return true;
          }
        }
      }

      return false;
    }()));
}

// get the next run date of the trip after the provided date
function getNextRunDate(trip, date) {
  let day = DateHelpers.getDateAsDays(date);
  let service = Services[trip[2]];
  let startDay = service[0];
  let endDay = service[1];
  let days = service[2];

  // get the first running exception
  let firstRunningException = (() => {
    let exception = service[3] && service[3].find(e => e[0] >= day && e[1]);
    return exception && exception[0];
  })();

  // get the first running date in the period if the period starts before the first running exception
  // undefined is returned is no date has been found
  startDay = (() => {
    if (startDay && (!firstRunningException || startDay < firstRunningException)) {
      endDay = Math.min(endDay, firstRunningException || endDay);
      for (startDay = Math.max(day, startDay); startDay <= endDay; ++startDay) {
        let exception = service[3] && service[3].find(e => e[0] === startDay);
        if (!exception && days[(startDay - 3) % 7] || exception && exception[1]) {
          return startDay;
        }
      }
    }
  })();

  // if no date has been found in the period, use the first running exception if any
  if (!startDay) {
    startDay = firstRunningException;
  }

  if (startDay) {
    return DateHelpers.getDateByDays(startDay);
  }
}

export default {
  parseParisLocalDate,
  getStopsArray,
  getStop,
  getStopById,
  getStopId,
  getStopName,
  getStopUICCode,
  getStopTrips,
  getTripLastStopTime,
  getTripNextStopTime,
  getTripPrevStopTime,
  getTripFirstStop,
  getTripLastStop,
  isTripByNumber,
  getStopTimeStop,
  getStopStopTimeByTrip,
  getStopTimeSequence,
  getStopTimeTrip,
  getStopTimeTime,
  getTripStopTimes,
  getTripFirstStopTime,
  isTripFirstStopTime,
  getTripNumber,
  getTripMission,
  getTrip,
  getTripById,
  getTripId,
  getService,
  doesRunAt,
  getNextRunDate
};
