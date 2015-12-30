import React from 'react';
import AutoCompleteSelector from './../AutoCompleteSelector/AutoCompleteSelector';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { createMeasurer, connectToLayoutMeasurer } from '../LayoutContainer/LayoutMeasurer.jsx';
import { connectToLayoutWrapper } from '../LayoutContainer/LayoutWrapper.jsx';
import { viewStopNextTrips } from '../../actions/actions.js';
import { ViewTripAccessor } from '../../reducers/viewTrip.js';
import './Trips.css';

const DecoratedInfinite = connectToLayoutMeasurer(connectToLayoutWrapper(Infinite), createMeasurer('height', 250), 'containerHeight');

let Trips = React.createClass({
  propTypes: {
    // invariants -- known at construction time
    stops: React.PropTypes.arrayOf(React.PropTypes.array).isRequired,
    actions: React.PropTypes.shape({
      onStopTimeSelected: React.PropTypes.func.isRequired,
      viewStopNextTrips: React.PropTypes.func.isRequired
    }).isRequired,

    // dynamic state
    departureStop: React.PropTypes.array,
    arrivalStop: React.PropTypes.array
  },

  getDefaultProps() {
    return {
      stops: SNCFData.getStopsArray()
    };
  },

  getInitialState() {
    return {
      departureStop: null,
      arrivalStop: null
    };
  },

  componentWillMount() {
    if (this.props.departureStop || this.props.arrivalStop) {
      this.props.actions.viewStopNextTrips()
    }

    this.setState({
      departureStop: this.props.departureStop,
      arrivalStop: this.props.arrivalStop,

    });
  },

  componentWillReceiveProps(nextProps, nextState) {
    if ((this.state.departureStop !== nextState.departureStop
      || this.state.arrivalStop !== nextState.arrivalStop)
    && (nextState.departureStop || nextState.arrivalStop)) {
      this.props.viewStopNextTrips(20);
    }
  },

  shouldComponentUpdate(nextProps, nextState) {
    return this.state.departureStop !== nextState.departureStop
        || this.state.arrivalStop !== nextState.arrivalStop;
  },

  render() {
    const departureStops = this.props.stops;

    const departureStop = this.props.departureStop;
    const arrivalStop = this.props.arrivalStop;
    let arrivalStops;

    if (departureStop) {
      // filter the possible arrival stops
      arrivalStops = (() => {
        // use a map to make stops being unique
        let stopsMap = SNCFData.getStopTrips(departureStop).reduce((res, trip) => {
          return SNCFData.getTripStopTimes(SNCFData.getTrip(SNCFData.getStopTimeTrip(trip))).reduce((res, stopTime) => {
            if (SNCFData.getStopTimeStop(stopTime) !== departureStop) {
              res[SNCFData.getStopUICCode(SNCFData.getStopTimeStop(stopTime))] = SNCFData.getStopTimeStop(stopTime);
            }

            return res;
          }, res);
        }, {});

        // use the initial stops list to keep the arrival stop list sorted
        return departureStops.filter(stop => stopsMap[SNCFData.getStopUICCode(stop)] !== undefined);
      })();
    }
    else {
      arrivalStops = departureStops;
    }

    //const rows = (() => {
    //  let date;
    //
    //  return viewTrip.stop.getTrips().reduce((rows, e, index) => {
    //    if (date !== e.date) {
    //      date = e.date;
    //      rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
    //    }
    //
    //    rows.push(<StopTimeRow key={index}
    //                           trip={e.trip}
    //                           date={e.date}
    //                           stop={departureStop}
    //                           tripState={viewTrip.states.getTripState(e.trip, e.date.getTime())}
    //                           onStopTimeSelected={this.props.onStopTimeSelected}/>);
    //
    //    return rows;
    //  }, []);
    //})();
    const rows = [];

    return (
      <div data-g-layout-container='' className="trips-frame">
        <div data-g-layout-item='"row": 0'>
          <AutoCompleteSelector placeholder="De..."
                                data={departureStops}
                                value={departureStop}
                                onStopChange={() => ({})}/>
        </div>
        <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <DecoratedInfinite elementHeight={50}
                             infiniteLoadBeginEdgeOffset={200}
                             onInfiniteLoad={() => this.props.actions.viewStopNextTrips(20)}>
            {rows}
          </DecoratedInfinite>
        </div>
        <div data-g-layout-item='"row": 2'>
          <AutoCompleteSelector placeholder="Vers..."
                                data={arrivalStops}
                                value={arrivalStop}
                                onStopChange={() => ({})}/>
        </div>
      </div>
    );
  }
});

function checkValidStop(stopStr) {
  let stop = parseInt(stopStr);
  if (!(stop = SNCFData.getStopById(stop))) {
    console.warn(`The stop id '${stopStr}' is invalid!`);
  }
  else {
    return stop;
  }
}

function mapStateToProps(state, ownProps) {
  return {
    departureStop: ownProps.routeParams.departureStop && checkValidStop(ownProps.routeParams.departureStop),
    arrivalStop: ownProps.routeParams.arrivalStop && checkValidStop(ownProps.routeParams.arrivalStop)
  };
}

function onStopTimeSelected() {
  var debug = true;
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ onStopTimeSelected, viewStopNextTrips }, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Trips);
