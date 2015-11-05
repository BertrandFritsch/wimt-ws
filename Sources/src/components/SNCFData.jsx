import $ from 'jquery';
//import Routes from '../SNCFData/routes.js'
//import Services from '../SNCFData/routes.js'
//import Stops from '../SNCFData/stops.js'
//import Trips from '../SNCFData/trips.js'

export class RealTimeRequester {
  static get(departureStop, arrivalStop, result) {
    if (departureStop) {
      let url = String.format('http://localhost:82/gare/{0}/depart/', departureStop.U);
      if (arrivalStop) {
        url = String.format('{0}{1}/', url, arrivalStop.U);
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
    if (Trips[key].i === id) {
      return Trips[key];
    }
  }
}

function getTripId(trip) {
  return trip.i;
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
  if ($.isPlainObject(trip) && $.isArray(trip.t)) {
    return trip.t;
  }
  else if ($.isArray(trip)) {
    return Trips[trip[2]].t;
  }
  else {
    return Trips[trip].t;
  }
}

function getTripFirstStopTime(trip) {
  return trip.t[0];
}

function isTripFirstStopTime(trip, stopTime) {
  return trip.t[0] === stopTime;
}

function getTripLastStopTime(trip) {
  return trip.t[trip.t.length - 1];
}

function getTripMission(trip) {
  return trip.m;
}

function getTripLastStop(trip) {
  return getStop(getTripLastStopTime(trip)[0]);
}

function getTripNumber(trip) {
  return trip.n;
}

function getTripNextStopTime(trip, stopTime) {
  let i = trip.t.indexOf(stopTime);

  if (i === -1) {
    throw new Error("Invalid trip stop time");
  }

  return i < trip.t.length ? trip.t[i + 1] : null;
}

function getTripPrevStopTime(trip, stopTime) {
  let i = trip.t.indexOf(stopTime);

  if (i === -1) {
    throw new Error("Invalid trip stop time");
  }

  return i > 0 ? trip.t[i - 1] : null;
}

function isTripByNumber(trip, number) {
  return trip.n === number;
}

function getStop(id) {
  return Stops[id];
}

function getStopName(stop) {
  return stop.n;
}

function getStopUICCode(stop) {
  return stop.U;
}

function getStopTrips(stop) {
  return stop.t;
}

function getStopsArray() {
  let stops = [];

  for (let stop in Stops) {
    stops.push(Stops[stop]);
  }

  return stops.sort((stop1, stop2) => stop1.n < stop2.n ? -1 : 1);
}

function getService(id) {
  return Services[id];
}

function doesRunAt(trip, date) {
  const minutesPerDay = 24 * 60,
    stopTime = trip.t[0];

  // be aware of trips that starts the day before
  if (stopTime[0] >= minutesPerDay) {
    date = new Date(date.getTime());
    date.setDate(date.getDate() - 1);
  }

  let doesRunAt = trip.e && trip.e[getDateAsDays(date)];

  return doesRunAt
    || (doesRunAt === undefined && (function () {

      let service;
      if ((service = Services[trip.s]) !== undefined) {
        if (new Date(service.s).getTime() <= date.getTime()) {
          let endDate = service.e;
          endDate = new Date(endDate);
          endDate = new Date(endDate.getTime());
          endDate.setDate(endDate.getDate() + 1);

          if (date.getTime() < endDate.getTime()) {
            if (service.d[date.getDay()]) {
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

function getDateByMinutes(time) {
  const minutesPerDay = 24 * 60;

  let date = new Date();

  // be aware of trips that starts the day before
  if (time >= minutesPerDay) {
    date.setDate(date.getDate() - 1);
  }

  return new Date(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() + (time * 60 * 1000));
}
