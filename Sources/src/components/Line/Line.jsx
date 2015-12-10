import React from 'react';
import ReactDOM from 'react-dom';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData.js';
import GridLayout from '../../gridlayout/gridlayout';
import theme from './Line.css';
import { viewLineNextTrips, realTimeStateDisplay } from '../../actions/actions.js';

const Line = React.createClass({
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
    const rows = (_ => {
      let date;
      return this.props.viewTrip.line.trips.reduce((rows, e, index) => {
        if (date !== e.date) {
          date = e.date;
          rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
        }

        const trip = SNCFData.getTripById(e.trip);
        const tripState = this.props.viewTrip.tripsStates && this.props.viewTrip.tripsStates[e.trip];
        let stopTime = tripState && tripState.stopTime || SNCFData.getTripFirstStopTime(trip);

        // convert the trip stop time to a stop stop time expected by the StopTimeRow component
        stopTime = SNCFData.getStopStopTimeByTime(SNCFData.getStopTimeStop(stopTime), SNCFData.getStopTimeTime(stopTime));

        rows.push(<StopTimeRow key={index}
                               stopTime={stopTime}
                               realTimeState={realTimeStateDisplay(tripState && tripState.state || '', false)}
                               date={SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime), e.date)}
                               onStopTimeSelected={this.props.onStopTimeSelected} />);

        return rows;
      }, []);
    })();


    return (
      <div className="trip-frame">
        <Infinite elementHeight={50}
                  containerHeight={this.state.containerHeight}
                  infiniteLoadBeginEdgeOffset={200}
                  onInfiniteLoad={() => this.props.actionDispatcher(viewLineNextTrips(40))}>
          {rows}
        </Infinite>
      </div>
    )
  },

  onResize() {
    this.setState({
      containerHeight: ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }
});

export default Line;
