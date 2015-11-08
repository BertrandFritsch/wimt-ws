import $ from 'jquery';
//import Routes from '../SNCFData/routes.js'
//import Services from '../SNCFData/routes.js'
//import Stops from '../SNCFData/stops.js'
//import Trips from '../SNCFData/trips.js'

/**
 * Data structures:
 *   - Trip:
 *       0: id
 *       1: number
 *       2: service
 *       3: mission
 *       4: direction, 0 - forward, 1 - backward
 *       5: {service exceptions}
 *       6: [stopTime, stop]
 *
 *   - Stop:
 *       0: id
 *       1: name
 *       2: [stopTime, sequence, trip]
 *
 *   - Service:
 *       0: start date
 *       1: end date
 *       2: days
 *
 */


export class RealTimeRequester {
  static get(departureStop, arrivalStop, result) {
    if (departureStop) {
      let url = String.format('http://localhost:82/gare/{0}/depart/', departureStop[0]);
      if (arrivalStop) {
        url = String.format('{0}{1}/', url, arrivalStop[0]);
      }
      $.ajax({
        url: url,
        headers: {
          "Authorization": "Basic dG5odG4xNzk6alNIMjV2Yjg=",
          "Accept": "application/vnd.sncf.transilien.od.depart+xml;vers=1",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        complete: function (xhr, status) {
          let trains = xhr.responseXML.getElementsByTagName('train');
          result(Array.prototype.map.call(trains, train => {
            return {
              number: train.getElementsByTagName('num')[0].textContent,
              mission: train.getElementsByTagName('miss')[0].textContent,
              term: train.getElementsByTagName('term')[0].textContent,
              time: RealTimeRequester.parseRealTime(train.getElementsByTagName('date')[0].textContent),
              mode: train.getElementsByTagName('date')[0].attributes['mode'].nodeValue,
              state: train.getElementsByTagName('state').length ? train.getElementsByTagName('state')[0].textContent : ''
            }
          }));
        }
      });
    }
  }

  static parseRealTime(time) {
    let matches = /(\d\d)\/(\d\d)\/(\d\d\d\d) (\d\d):(\d\d)/.exec(time);
    return new Date(Number(matches[3]), Number(matches[2]) - 1, Number(matches[1]), Number(matches[4]), Number(matches[5]));
  }

}

// SNCFData interface
function getTrip(id) {
  for (let key in Trips) {
    if (Trips[key][0] === id) {
      return Trips[key];
    }
  }
}

function getTripId(trip) {
  return trip[0];
}

function getStopTimeTrip(stopTime) {
  return Trips[stopTime[2]];
}

function getStopTimeTime(stopTime) {
  return stopTime[0];
}

function getStopTimeStop(stopTime) {
  return Stops[stopTime[1]];
}

function getStopTimeSequence(stopTime) {
  return stopTime[1];
}

function getTripStopTimes(trip) {
  return trip[6];
}

function getTripFirstStopTime(trip) {
  return trip[6][0];
}

function isTripFirstStopTime(trip, stopTime) {
  return trip[6][0] === stopTime;
}

function getTripLastStopTime(trip) {
  return trip[6][trip[6].length - 1];
}

function getTripMission(trip) {
  return trip[3];
}

function getTripLastStop(trip) {
  return getStop(getTripLastStopTime(trip)[0]);
}

function getTripNumber(trip) {
  return trip[1];
}

function getTripNextStopTime(trip, stopTime) {
  let i = trip[6].indexOf(stopTime);

  if (i === -1) {
    throw new Error("Invalid trip stop time");
  }

  return i < trip[6].length ? trip[6][i + 1] : null;
}

function getTripPrevStopTime(trip, stopTime) {
  let i = trip[6].indexOf(stopTime);

  if (i === -1) {
    throw new Error("Invalid trip stop time");
  }

  return i > 0 ? trip[6][i - 1] : null;
}

function isTripByNumber(trip, number) {
  return trip[1] === number;
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

function getStopUICCode(stop) {
  return stop[0];
}

function getStopTrips(stop) {
  return stop[2];
}

function getStopsArray() {
  return Stops.slice(0).sort((stop1, stop2) => stop1[1] < stop2[1] ? -1 : 1);
}

function getService(id) {
  return Services[id];
}

function doesRunAt(trip, date) {
  const minutesPerDay = 24 * 60,
        stopTime = trip[6][0];

  let day = getDateAsDays(date);

  // be aware of trips that starts the day before
  if (stopTime[0] >= minutesPerDay) {
    --day;
  }

  let doesRunAt = trip[5] && trip[5][day];

  return doesRunAt
    || ((doesRunAt === null || doesRunAt === undefined) && (function () {

      let service;
      if ((service = Services[trip[2]]) !== undefined) {
        if (service[0] <= day) {
          let endDay = service[1] + 1;
          if (day < endDay) {
            if (service[2][(day - 3) % 7]) {
              return true;
            }
          }
        }
      }

      return false;
    })())
}

export default {
  getStopsArray: getStopsArray,
  getStop: getStop,
  getStopById: getStopById,
  getStopName: getStopName,
  getStopUICCode: getStopUICCode,
  getStopTrips: getStopTrips,
  getTripLastStopTime: getTripLastStopTime,
  getTripNextStopTime: getTripNextStopTime,
  getTripPrevStopTime: getTripPrevStopTime,
  getTripLastStop: getTripLastStop,
  isTripByNumber: isTripByNumber,
  getStopTimeStop: getStopTimeStop,
  getStopTimeSequence: getStopTimeSequence,
  getStopTimeTrip: getStopTimeTrip,
  getStopTimeTime: getStopTimeTime,
  getTripStopTimes: getTripStopTimes,
  getTripFirstStopTime: getTripFirstStopTime,
  isTripFirstStopTime: isTripFirstStopTime,
  getTripNumber: getTripNumber,
  getTripMission: getTripMission,
  getTrip: getTrip,
  getTripId: getTripId,
  getService: getService,
  doesRunAt: doesRunAt,
  getDateByMinutes: getDateByMinutes
};

// utils
function getDateAsString(date) {
  var year = date.getFullYear(),
    month = date.getMonth() + 1,
    day = date.getDate();

  if (month < 10) {
    month = '0' + month;
  }

  if (day < 10) {
    day = '0' + day;
  }

  return day + '/' + month + '/' + year;
}

// gets the number of days since 01/01/1970
function getDateAsDays(date) {
  return Math.floor(date.getTime() / 1000 / 60 / 60 / 24);
}

// gets the date according the number of days since 01/01/1970
function getDateByDays(days) {
  return new Date(days * 24 * 60 * 60 * 1000);
}

function getDateByMinutes(time) {
  const minutesPerDay = 24 * 60;

  let date = new Date();

  // be aware of trips that starts the day before
  if (time >= minutesPerDay) {
    date.setDate(date.getDate() - 1);
  }

  return new Date(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() + (time * 60 * 1000));
}
