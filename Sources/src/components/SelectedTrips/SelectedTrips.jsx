import React from 'react';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeRow from './../StopTimeRow/StopTimeRow';
import Infinite from 'react-infinite';
import SNCFData, { RealTimeRequester } from './../SNCFData';
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
                infiniteLoadBeginBottomOffset={200}
                onInfiniteLoad={this.handleInfiniteLoad}>
        {this.state.rows}
      </Infinite>
    )
  }

  onResize = () => {
    this.setState({
      containerHeight: React.findDOMNode(this).parentNode.getBoundingClientRect().height
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
        let endStopTime = SNCFData.getTrip(stopTime.trip).stopTimes.find(stopTime => {
          return SNCFData.getStop(stopTime.stop).id === props.arrivalStop.id;
        });

        let endSeq = endStopTime ? endStopTime.sequence : 0;

        if (stopTime.sequence >= endSeq) {
          return;
        }
      }

      if (SNCFData.doesRunAt(SNCFData.getTrip(stopTime.trip), date)) {
        result.push({ date: date, stopTime: stopTime });
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
        let time = startStopTimes[currentStopTime].time;
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

  transformToElements = (stopTimes, date) => {
    var length, i,
      rows = [];

    length = stopTimes.length;

    for (i = 0; i < length; ++i) {
      if (date !== stopTimes[i].date) {
        date = stopTimes[i].date;
        rows.push(<DayHeaderRow key={date} date={date} />);
      }

      let realTime;
      if (stopTimes[i].realTime) {
        realTime = {
          time: stopTimes[i].realTime,
          mode: stopTimes[i].realTime.mode,
          state: stopTimes[i].realTime.state
        }
      }

      rows.push(<StopTimeRow key={stopTimes[i].stopTime.trip + stopTimes[i].stopTime.time}
                             stopTime={stopTimes[i].stopTime}
                             realTime={realTime}
                             onStopTimeSelected={this.props.onStopTimeSelected} />)
    }

    return rows;
  }

  handleInfiniteLoad = () => {
    var lastDate = this.state.generator.stopTimes[this.state.generator.stopTimes.length - 1].date,
      generator = this.state.generator.nextStopTimes(),
      rows = this.state.rows.concat(this.transformToElements(generator.stopTimes, lastDate));

    return this.setState({
      generator: generator,
      rows: rows
    });
  }

  checkRealTimes = (props) => {
    var me = this;

    RealTimeRequester.get(props.departureStop, props.arrivalStop, trains => {
      for (let i = 0, iTrain = 0, iLength = me.state.generator.stopTimes.length, iTrainsLength = trains.length; i < iLength; ++i) {
        let stop = me.state.generator.stopTimes[i];
        if (iTrain < iTrainsLength) {
          let train = trains[iTrain];
          let trip = SNCFData.getTrip(stop.stopTime.trip);
          if (trip.number === train.number) {
            stop.realTime = {
              time: train.time,
              mode: train.mode,
              state: train.state
            };

            ++iTrain;
          }
          else {
            // no more real times available for this stop time, ensure that no real time is still attached on this train
            delete stop.realTime;
          }
        }
        else {
          // no more real times available, ensure that no real time is still attached on this train
          delete stop.realTime;
        }
      }

      me.setState({
        rows: me.transformToElements(me.state.generator.stopTimes)
      });
    });
  }
}

export default SelectedTrips;
