import React from 'react';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import './SelectedTrips.css';
import { viewStopNextTrips } from '../../actions/actions.js';
import { ViewTripAccessor } from '../../reducers/viewTrip.js';
import { connectToLayoutObserver } from '../LayoutContainer/LayoutObserver.jsx';

const InfiniteComponent = connectToLayoutObserver(Infinite, 'height', 250, 'containerHeight');

const SelectedTrips = React.createClass({
  propTypes: {
    viewTrip: React.PropTypes.any,
    onStopTimeSelected: React.PropTypes.func,
    actionDispatcher: React.PropTypes.func
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
                               stop={viewTrip.stop.getDepartureStop()}
                               tripState={viewTrip.states.getTripState(e.trip, e.date.getTime())}
                               onStopTimeSelected={this.props.onStopTimeSelected}/>);

        return rows;
      }, []);
    })();

    return (
      <InfiniteComponent elementHeight={50}
                infiniteLoadBeginEdgeOffset={200}
                onInfiniteLoad={() => this.props.actionDispatcher(viewStopNextTrips(20))}>
        {rows}
      </InfiniteComponent>
    );
  }
});

export default SelectedTrips;
