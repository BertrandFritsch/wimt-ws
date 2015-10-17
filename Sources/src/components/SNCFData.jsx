import $ from 'jquery';

export class RealTimeRequester {
  static get(departureStop, arrivalStop, result) {
    if (departureStop) {
      let url = String.format('http://localhost:82/gare/{0}/depart/', departureStop.UICCode);
      if (arrivalStop) {
        url = String.format('{0}{1}/', url, arrivalStop.UICCode);
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

// SNCF Data
let SNCFData = {};
function loadData(onLoaded) {
  var nbScriptToLoad = 0;
  Array.prototype.forEach.call(document.getElementsByTagName('script'), script => {
    if (/^application\/json(;|$)/.test(script.type)) {
      ++nbScriptToLoad;

      $.ajax({
        url: script.src,
        complete: (xhr, status) => {
          // TODO: check the status code
          SNCFData[script.dataset.rel] = JSON.parse(xhr.responseText);

          if (--nbScriptToLoad === 0) {
            onLoaded();
          }
        }
      });
    }
  });
}

// SNCFData interface
function getTrip(id) {
  return SNCFData.trips[id];
}

function getLastStopTime(trip) {
  return trip.stopTimes[trip.stopTimes.length - 1];
}

function getLastStop(trip) {
  return getStop(getLastStopTime(trip).stop);
}

function getNextStopTime(trip, stopTime) {
  let i = trip.stopTimes.indexOf(stopTime);

  if (i === -1) {
    throw new Error("Invalid trip stop time");
  }

  return i < trip.stopTimes.length ? trip.stopTimes[i + 1] : null;
}

function getPrevStopTime(trip, stopTime) {
  let i = trip.stopTimes.indexOf(stopTime);

  if (i === -1) {
    throw new Error("Invalid trip stop time");
  }

  return i > 0 ? trip.stopTimes[i - 1] : null;
}

function getStop(id) {
  return SNCFData.stops[id];
}

function getStopsArray() {
  let stops = [];

  for (let stop in SNCFData.stops) {
    stops.push(SNCFData.stops[stop]);
  }

  return stops.sort((stop1, stop2) => stop1.name < stop2.name ? -1 : 1);
}

function getService(id) {
  return SNCFData.services[id];
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

function doesRunAt(trip, date) {
  const minutesPerDay = 24 * 60,
    stopTime = trip.stopTimes[0];

  // be aware of trips that starts the day before
  if (stopTime.time >= minutesPerDay) {
    date = new Date(date.getTime());
    date.setDate(date.getDate() - 1);
  }

  let doesRunAt = trip.serviceExceptions[getDateAsString(date)];

  return doesRunAt === true
    || (doesRunAt === undefined && (function () {

      let service;
      if ((service = SNCFData.services[trip.service]) !== undefined) {
        if (new Date(service.startDate).getTime() <= date.getTime()) {
          let endDate = service.endDate;
          endDate = new Date(endDate);
          endDate = new Date(endDate.getTime());
          endDate.setDate(endDate.getDate() + 1);

          if (date.getTime() < endDate.getTime()) {
            if (service.days[date.getDay()]) {
              return true;
            }
          }
        }
      }

      return false;
    })())
}

export default {
  loadData: loadData,
  getStopsArray: getStopsArray,
  getStop: getStop,
  getLastStopTime: getLastStopTime,
  getNextStopTime: getNextStopTime,
  getPrevStopTime: getPrevStopTime,
  getLastStop: getLastStop,
  getTrip: getTrip,
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
