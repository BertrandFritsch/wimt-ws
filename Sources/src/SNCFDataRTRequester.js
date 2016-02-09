import axios from 'axios';
import assert from 'assert';
import SNCFData from './SNCFData.js';

//TODO: clean the cache periodically by removing the entries that have not been requested after N mn

const freshingDelay = 30 * 1000; // 30 s
const Requests = {};

function isFresh(url) {
  return Requests[url] && (Requests[url].fetchTime + freshingDelay) >= Date.now();
}

function isRequesting(url) {
  return Requests[url] && Requests[url].requesting;
}

function dispatch(data, listeners) {
  listeners.forEach(listener => listener(data));
}

function requesting(url) {
  let request = Requests[url] || (Requests[url] = { fetchTime: 0 });

  axios
    .get(url, {
      headers: {
        "Authorization": "Basic dG5odG4xNzk6alNIMjV2Yjg=",
        "Accept": "application/vnd.sncf.transilien.od.depart+xml;vers=1",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      responseType: 'document' // XML document
    })
    .then(response => {
      request.data = Array.from(response.data.getElementsByTagName('train')).map(train => {
        return {
          number: train.getElementsByTagName('num')[0].textContent,
          mission: train.getElementsByTagName('miss')[0].textContent,
          term: train.getElementsByTagName('term')[0].textContent,
          time: SNCFData.parseParisLocalDate(train.getElementsByTagName('date')[0].textContent),
          mode: train.getElementsByTagName('date')[0].attributes['mode'].nodeValue,
          state: train.getElementsByTagName('etat').length ? train.getElementsByTagName('etat')[0].textContent : ''
        };
      });
      request.fetchTime = Date.now();
      request.requesting = false;

      dispatch(request.data, request.listeners);
      request.listeners.empty();
    })
    .catch(() => {
      request.requesting = false;
      // in case of error, dispatch the previous data if any
      dispatch(request.data || [], request.listeners);
      request.listeners.empty();

      //TODO: handle Retry-After header to not retry this URL before that time in seconds
    });

  request.requesting = true;
}

function listening(url, listener) {
  let request = Requests[url];

  assert(request, "The request should have been created before!");

  let listeners = request.listeners || (request.listeners = []);
  listeners.push(listener);
}

function get(departureStop, arrivalStop, result) {
  assert(departureStop, "departureStop is required");

  let url = `http://localhost:8082/gare/${departureStop[0]}/depart/`;
  if (arrivalStop) {
    url = `${url}${arrivalStop[0]}/`;
  }

  if (!isFresh(url)) {
    if (!isRequesting(url)) {
      requesting(url);
    }

    listening(url, result);
  }
  else {
    // defer the call to accommodate the caller
    setTimeout(() => dispatch(Requests[url].data, [ result ]), 1);
  }
}

export default {
  get: get
};