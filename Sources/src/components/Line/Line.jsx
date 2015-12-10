import React from 'react';
import ReactDOM from 'react-dom';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData.js';
import GridLayout from '../../gridlayout/gridlayout';
import theme from './Line.css';
import { viewLineNextTrips } from '../../actions/actions.js';

class Line extends React.Component {
  constructor(props) {
    super(props);

    GridLayout.resizeListeners.add(this.onResize);

    this.state = {
      containerHeight: 250
    };
  }

  componentWillUnmount = () => {
    GridLayout.resizeListeners.remove(this.onResize);
  }

  render = () => {
    return (
      <div className="trip-frame">
        <Infinite elementHeight={50}
                  containerHeight={this.state.containerHeight}
                  infiniteLoadBeginEdgeOffset={200}
                  onInfiniteLoad={() => this.props.actionDispatcher(viewLineNextTrips(40))}>
          {this.transformToElements()}
        </Infinite>
      </div>
    )
  }

  onResize = () => {
    this.setState({
      containerHeight: ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }

  transformToElements = () => {
    let date;
    return this.props.viewTrip.line.trips.reduce((rows, e, index) => {
      if (date !== e.date) {
        date = e.date;
        rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
      }

      let trip = SNCFData.getTripById(e.trip);
      let tripState = this.props.viewTrip.tripsStates && this.props.viewTrip.tripsStates[e.trip];
      let stopTime = tripState && tripState.stopTime || SNCFData.getTripFirstStopTime(trip);

      rows.push(<StopTimeRow key={index}
                             stopTime={stopTime}
                             realTime={SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime) + (tripState && tripState.delayedMinutes || 0), e.date)}
                             date={SNCFData.getDateByMinutes(SNCFData.getStopTimeTime(stopTime), e.date)}
                             onStopTimeSelected={this.props.onStopTimeSelected} />);

      return rows;
    }, []);

    var length, i,
        rows = [];

    length = stopTimes.length;

    for (i = 0; i < length; ++i) {
      if (date !== stopTimes[i].date) {
        date = stopTimes[i].date;
        rows.push(<DayHeaderRow key={date} date={date}/>);
      }

      let realTime;
      if (stopTimes[i].realTime) {
        realTime = {
          time: stopTimes[i].realTime.time,
          mode: stopTimes[i].realTime.mode,
          state: stopTimes[i].realTime.state
        }
      }

      rows.push(<StopTimeRow key={++SelectedTrips.rowKeyGenerator}
                             stopTime={stopTimes[i].stopTime}
                             realTime={realTime}
                             date={SNCFData.getTripDepartureDateByStopTime(stopTimes[i].stopTime, date)}
                             onStopTimeSelected={this.props.onStopTimeSelected}/>)
    }

    return rows;
  }
}

export default Line;
