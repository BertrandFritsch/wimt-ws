import React from 'react';
import ReactDOM from 'react-dom';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData.js';
import RealTimeRequester from './../../SNCFDataRTRequester.js';
import GridLayout from '../../gridlayout/gridlayout';
import theme from './SelectedTrips.css';
import { viewStopNextTrips } from '../../actions/actions.js';
import { ViewTripAccessor } from '../../reducers/viewTrip.js';

class SelectedTrips extends React.Component {
  constructor(props) {
    super(props);

    GridLayout.resizeListeners.add(this.onResize);

    this.state = {
      containerHeight: 250
    };
  }

  //static propTypes: {
  //  viewTrip: React.PropTypes.any,
  //  onStopTimeSelected: React.PropTypes.func,
  //  actionDispatcher: React.PropTypes.func
  //},

  componentWillUnmount() {
    GridLayout.resizeListeners.remove(this.onResize);
  }

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
      <Infinite elementHeight={50}
                containerHeight={this.state.containerHeight}
                infiniteLoadBeginEdgeOffset={200}
                onInfiniteLoad={() => this.props.actionDispatcher(viewStopNextTrips(40))}>
        {rows}
      </Infinite>
    )
  }

  onResize = () => {
    const containerHeight = ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect().height;
    if (this.state.containerHeight !== containerHeight) {
      this.setState({
        containerHeight: containerHeight
      });
    }
  }
};

export default SelectedTrips;
