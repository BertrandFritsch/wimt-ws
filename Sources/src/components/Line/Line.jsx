import React from 'react';
import FontAwesome from 'react-fontawesome';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData';
import { createMeasurer, connectToLayoutMeasurer } from '../LayoutContainer/LayoutMeasurer.jsx';
import { connectToLayoutWrapper } from '../LayoutContainer/LayoutWrapper.jsx';
import DayHeaderRow from '../DayHeaderRow/DayHeaderRow.jsx';
import StopTimeLine from './../StopTimeLine/StopTimeLine';
import connectToLayoutContainer from '../LayoutContainer/LayoutContainer.jsx';
import { connectWithTripState } from '../../store/tripsStates/connect.js';
import './Line.css';

const DecoratedInfinite = connectToLayoutMeasurer(connectToLayoutWrapper(Infinite), createMeasurer('height', 250), 'containerHeight');
const DecoratedStopTimeLine = connectToLayoutMeasurer(StopTimeLine, createMeasurer('width', 0), 'stopsContainerWidth');

const Line = connectToLayoutContainer(React.createClass({
  propTypes: {
    // invariants -- known at construction time
    onStopTimeSelected: React.PropTypes.func.isRequired,
    selectStops: React.PropTypes.func.isRequired,
    generateNextTrips: React.PropTypes.func.isRequired,

    // dynamic state
    departureStop: React.PropTypes.array,
    arrivalStop: React.PropTypes.array,
    trips: React.PropTypes.array
  },

  componentWillReceiveProps(nextProps) {
    if ((this.props.departureStop !== nextProps.departureStop
        || this.props.arrivalStop !== nextProps.arrivalStop)
        && (nextProps.departureStop || nextProps.arrivalStop)) {
      nextProps.generateNextTrips(20);
    }
  },

  render() {
    const trips = this.props.trips || [];
    const rows = (() => {
      let date;

      return trips.reduce((rows, e, index) => {
        if (date !== e.date) {
          date = e.date;
          rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
        }

        const ConnectedStopTimeLine = connectWithTripState(DecoratedStopTimeLine);
        rows.push(<ConnectedStopTimeLine key={index}
                                         trip={e.trip}
                                         date={e.date}
                                         onStopTimeSelected={this.props.onStopTimeSelected}/>);

        return rows;
      }, []);
    })();

    return (
      <div data-g-layout-container='' className="line-frame">
        <div data-g-layout-item='"row": 0'>
          <div className="line-header">{this.props.departureStop && SNCFData.getStopName(this.props.departureStop)}<FontAwesome className="line-header-separator" name="arrow-circle-o-right" size="lg" />{this.props.arrivalStop && SNCFData.getStopName(this.props.arrivalStop)}</div>
        </div>
        <div ref="line-container" className="line-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <DecoratedInfinite elementHeight={50}
                             infiniteLoadBeginEdgeOffset={200}
                             onInfiniteLoad={() => this.props.generateNextTrips(20)}>
            {rows}
          </DecoratedInfinite>
        </div>
      </div>
    );
  }
}));

export default Line;
