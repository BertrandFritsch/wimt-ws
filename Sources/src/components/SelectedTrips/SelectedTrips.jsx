import React from 'react';
import ReactDOM from 'react-dom';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData.js';
import RealTimeRequester from './../../SNCFDataRTRequester.js';
import GridLayout from '../../gridlayout/gridlayout';
import theme from './SelectedTrips.css';

class SelectedTrips extends React.Component {
  constructor(props) {
    super(props);

    GridLayout.resizeListeners.add(this.onResize);

    let generator = SelectedTrips.firstStopTimes(this.props, 40) || null;
    let rows = generator ? this.transformToElements(generator.stopTimes) : [];

    this.state = {
      generator: generator,
      rows: rows,
      containerHeight: 250
    };

    if (this.props.departureStop !== undefined) {
      this.checkRealTimes(this.props);
    }
  }

  componentWillUnmount = () => {
    GridLayout.resizeListeners.remove(this.onResize);
  }

  componentWillReceiveProps = (nextProps) => {
    var generator, rows;

    if (nextProps.departureStop !== this.props.departureStop || nextProps.arrivalStop !== this.props.arrivalStop) {
      generator = SelectedTrips.firstStopTimes(nextProps, 40) || null;
      rows = generator ? this.transformToElements(generator.stopTimes) : [];

      this.setState({
        generator: generator,
        rows: rows
      });

      this.checkRealTimes(nextProps);
    }
  }

  render = () => {
    return (
      <Infinite elementHeight={50}
                containerHeight={this.state.containerHeight}
                infiniteLoadBeginEdgeOffset={200}
                onInfiniteLoad={this.handleInfiniteLoad}>
        {this.state.rows}
      </Infinite>
    )
  }

  onResize = () => {
    this.setState({
      containerHeight: ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }

  static firstStopTimes(props, expectedStopCount) {
    let minutesPerDay = 24 * 60,
      startStopTimes = props.startStopTimes,
      currentStopTime = -1,
      date = new Date(),
      result = [];

    // add the currentStopTime if it is a valid one
    function nextStopTime(date, currentStopTime, result) {
      let stopTime = startStopTimes[currentStopTime];

      if (props.departureStop && props.arrivalStop) {
        // filter end stops trips
        let stopTimes = SNCFData.getTripStopTimes(SNCFData.getTrip(SNCFData.getStopTimeTrip(stopTime)));
        let endStopTime = stopTimes.find(stopTime => {
          return SNCFData.getStopTimeStop(stopTime) === props.arrivalStop;
        });

        let endSeq = endStopTime ? stopTimes.indexOf(endStopTime) : 0;

        if (SNCFData.getStopTimeSequence(stopTime) >= endSeq) {
          return;
        }
      }

      if (SNCFData.doesRunAt(SNCFData.getTrip(SNCFData.getStopTimeTrip(stopTime)), date)) {
        result.push({date: date, stopTime: stopTime});
      }
    }

    // get the next expectedStopCount stops
    function nextStopTimes(result) {
      while (result.length < expectedStopCount) {
        ++currentStopTime;
        if (currentStopTime === startStopTimes.length) {
          currentStopTime = 0;
          date = new Date(date.getTime());
          date.setDate(date.getDate() + 1);
        }

        nextStopTime(date, currentStopTime, result);
      }

      return {
        stopTimes: result,
        nextStopTimes: function () {
          var result = [];
          return nextStopTimes(result);
        }
      };
    }

    // generate the first stop times, then return a function to get the next ones
    if (startStopTimes && startStopTimes.length > 0) {
      // progress to the stop time 0
      for (currentStopTime = 0; currentStopTime < startStopTimes.length; ++currentStopTime) {
        let time = SNCFData.getStopTimeTime(startStopTimes[currentStopTime]);
        if (time >= minutesPerDay) {
          time -= minutesPerDay;
        }

        if (time >= date.getHours() * 60 + date.getMinutes()) {
          break;
        }
      }

      // jump back to simulate the previous examined item
      // it's all right even if we go at the -1 index, as the first action is to go forward
      --currentStopTime;

      return nextStopTimes(result);
    }
  }

  static rowKeyGenerator = 0;

  transformToElements = (stopTimes, date) => {
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

  handleInfiniteLoad = () => {
    if (this.state.generator !== null) {
      let lastDate  = this.state.generator.stopTimes[this.state.generator.stopTimes.length - 1].date,
          generator = this.state.generator.nextStopTimes(),
          rows      = this.state.rows.concat(this.transformToElements(generator.stopTimes, lastDate));

      return this.setState({
        generator: generator,
        rows: rows
      });
    }
  }

  checkRealTimes = (props) => {
    var me = this;

    RealTimeRequester.get(props.departureStop, props.arrivalStop, trains => {
      for (let i = 0, iLength = me.state.generator.stopTimes.length; i < iLength; ++i) {
        let stopTime = me.state.generator.stopTimes[i];
        let trip = SNCFData.getTrip(SNCFData.getStopTimeTrip(stopTime.stopTime));
        let train = trains.find(t => SNCFData.isTripByNumber(trip, t.number));

        if (train) {
          stopTime.realTime = {
            time: train.time,
            mode: train.mode,
            state: train.state
          };
        }
        else {
          // no real time available, ensure that no real time is still attached on this train
          delete stopTime.realTime;
        }
      }

      me.setState({
        rows: me.transformToElements(me.state.generator.stopTimes)
      });
    });
  }
}

export default SelectedTrips;
