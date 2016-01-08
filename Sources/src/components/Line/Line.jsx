import React from 'react';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeLine from './../StopTimeLine/StopTimeLine';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData.js';
import './Line.css';
import { viewLineNextTrips } from '../../store/actions/actions.js';
import FontAwesome from 'react-fontawesome';
import { ViewTripAccessor } from '../../store/reducers/viewTrip.js';
import { createMeasurer, connectToLayoutMeasurer } from '../LayoutContainer/LayoutMeasurer.jsx';
import { connectToLayoutWrapper } from '../LayoutContainer/LayoutWrapper.jsx';

const DecoratedInfinite = connectToLayoutMeasurer(connectToLayoutWrapper(Infinite), createMeasurer('height', 250), 'containerHeight');
const DecoratedStopTimeLine = connectToLayoutMeasurer(StopTimeLine, createMeasurer('width', 0), 'stopsContainerWidth');

const Line = React.createClass({
  propTypes: {
    // invariants -- known at construction time
    onStopTimeSelected: React.PropTypes.func,
    actionDispatcher: React.PropTypes.func,

    // dynamic state
    viewTrip: React.PropTypes.any
  },

  render() {
    const viewTrip = ViewTripAccessor.create(this.props.viewTrip);
    const rows = (() => {
      let date;

      return viewTrip.line.getTrips().reduce((rows, e, index) => {
        if (date !== e.date) {
          date = e.date;
          rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
        }

        rows.push(<DecoratedStopTimeLine key={index}
                                         trip={SNCFData.getTripById(e.trip)}
                                         date={e.date}
                                         tripState={viewTrip.states.getState(e.trip, e.date.getTime())}
                                         onStopTimeSelected={this.props.onStopTimeSelected}/>);

        return rows;
      }, []);
    })();

    return (
      <div data-g-layout-container='' className="line-frame">
        <div data-g-layout-item='"row": 0'>
          <div className="line-header">{viewTrip.line.getDepartureStop() && SNCFData.getStopName(viewTrip.line.getDepartureStop())}<FontAwesome className="line-header-separator" name="arrow-circle-o-right" size="lg" />{viewTrip.line.getArrivalStop() && SNCFData.getStopName(viewTrip.line.getArrivalStop())}</div>
        </div>
        <div ref="line-container" className="line-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <DecoratedInfinite elementHeight={50}
                             infiniteLoadBeginEdgeOffset={200}
                             onInfiniteLoad={() => this.props.actionDispatcher(viewLineNextTrips(20))}>
            {rows}
          </DecoratedInfinite>
        </div>
      </div>
    );
  }
});

export default Line;
