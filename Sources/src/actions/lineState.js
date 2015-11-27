import SNCFData from '../components/SNCFData.jsx'

export function lineStateSetUp(departureStopLine, arrivalStopLine, dispatch, getState) {
  let state =  new LineState(departureStopLine, arrivalStopLine, dispatch, getState);
  return () => state.nextTrips();
}

class LineState {
  constructor(departureStopLine, arrivalStopLine, dispatch, getState) {
    this.dispatch = dispatch;
    this.getState = getState;

    this.tripsGenerator = function* () {
      let trips = [];

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
      }
      else {
        // neither departure stop nor arrival stop has been specified, generate an empty array and end the generator
        yield trips;
      }
    }
  }

  nextTrips() {

  }
}