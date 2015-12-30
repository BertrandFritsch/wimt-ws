import React from 'react';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import './SelectedTrips.css';
import { createMeasurer, connectToLayoutMeasurer } from '../LayoutContainer/LayoutMeasurer.jsx';
import { connectToLayoutWrapper } from '../LayoutContainer/LayoutWrapper.jsx';

const DecoratedInfinite = connectToLayoutMeasurer(connectToLayoutWrapper(Infinite), createMeasurer('height', 250), 'containerHeight');

const SelectedTrips = React.createClass({
  propTypes: {
    // invariants -- known at construction time
    onStopTimeSelected: React.PropTypes.func.isRequired,

    // dynamic state
    departureStop: React.PropTypes.number,
    tripStates: React.PropTypes.object
  },

  componentWillReceiveProps(nextProps) {
    const viewTrip = ViewTripAccessor.create(this.props.viewTrip);
    const nextViewTrip = ViewTripAccessor.create(nextProps.viewTrip);

    if ((viewTrip.stop.getDepartureStop() !== nextViewTrip.stop.getDepartureStop()
        || viewTrip.stop.getArrivalStop() !== nextViewTrip.stop.getArrivalStop())
    && (nextViewTrip.stop.getDepartureStop()
        || nextViewTrip.stop.getArrivalStop())) {
      this.props.actionDispatcher(viewStopNextTrips(20));
    }
  },

  render() {
    const viewTrip = ViewTripAccessor.create(this.props.viewTrip);
    const rows = (() => {
      let date;

      return viewTrip.stop.getTrips().reduce((rows, e, index) => {
        if (date !== e.date) {
          date = e.date;
          rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
        }

        rows.push(<StopTimeRow key={index}
                               trip={e.trip}
                               date={e.date}
                               stop={this.props.departureStop && SNCFData.getStopById(this.props.departureStop)}
                               tripState={viewTrip.states.getTripState(e.trip, e.date.getTime())}
                               onStopTimeSelected={this.props.onStopTimeSelected}/>);

        return rows;
      }, []);
    })();

    return (
      <DecoratedInfinite elementHeight={50}
                infiniteLoadBeginEdgeOffset={200}
                onInfiniteLoad={() => this.props.actionDispatcher(viewStopNextTrips(20))}>
        {rows}
      </DecoratedInfinite>
    );
  }
});

export default SelectedTrips;
