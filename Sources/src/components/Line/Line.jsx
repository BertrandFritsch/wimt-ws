import React from 'react';
import ReactDOM from 'react-dom';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData.js';
import GridLayout from '../../gridlayout/gridlayout';
import './Line.css';
import { viewLineNextTrips, realTimeStateDisplay } from '../../actions/actions.js';
import FontAwesome from 'react-fontawesome';

const Line = React.createClass({
  propTypes: {
    viewTrip: React.PropTypes.any,
    onStopTimeSelected: React.PropTypes.func,
    actionDispatcher: React.PropTypes.func
  },

  getInitialState() {
    return {
      containerHeight: 250
    };
  },

  componentWillMount() {
    GridLayout.resizeListeners.add(this.onResize);
  },

  componentWillUnmount() {
    GridLayout.resizeListeners.remove(this.onResize);
  },

  render() {
    const rows = (() => {
      let date;
      return this.props.viewTrip.line.trips.reduce((rows, e, index) => {
        if (date !== e.date) {
          date = e.date;
          rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
        }

        const trip = SNCFData.getTripById(e.trip);
        const tripState = this.props.viewTrip.tripsStates && this.props.viewTrip.tripsStates[e.trip];
        let stopStopTime = tripState.state && tripState.state.stopTime || SNCFData.getTripFirstStopTime(trip);
        let tripStopTime = SNCFData.getStopStopTimeByTrip(SNCFData.getStopTimeStop(stopStopTime), trip);

        rows.push(<StopTimeRow key={index}
                               displayStopTime={stopStopTime}
                               stopTime={tripStopTime}
                               realTimeState={tripState && tripState.state && realTimeStateDisplay(tripState.state, true) || ''}
                               date={SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopStopTime), e.date)}
                               onStopTimeSelected={this.props.onStopTimeSelected}/>);

        return rows;
      }, []);
    })();


    return (
      <div data-g-layout-container='' className="line-frame">
        <div data-g-layout-item='"row": 0'>
          <div className="line-header">{SNCFData.getStopName(SNCFData.getStopById(this.props.viewTrip.line.departureStop))}<FontAwesome className="line-header-separator" name="arrow-circle-o-right" size="lg" />{SNCFData.getStopName(SNCFData.getStopById(this.props.viewTrip.line.arrivalStop))}</div>
        </div>
        <div className="line-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <Infinite elementHeight={50}
                    containerHeight={this.state.containerHeight}
                    infiniteLoadBeginEdgeOffset={200}
                    onInfiniteLoad={() => this.props.actionDispatcher(viewLineNextTrips(40))}>
            {rows}
          </Infinite>
        </div>
      </div>
    );
  },

  onResize() {
    this.setState({
      containerHeight: ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }
});

export default Line;
