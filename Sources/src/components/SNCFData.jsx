import $ from 'jquery';

let SNCFData = {};

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

export default SNCFData;