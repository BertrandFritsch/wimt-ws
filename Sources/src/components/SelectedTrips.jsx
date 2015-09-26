import React from 'react';
import DayHeaderRow from './DayHeaderRow';
import StopTimeRow from './StopTimeRow';
import Infinite from 'react-infinite';
import SNCFData from './SNCFData';
import GridLayout from '../gridlayout/gridlayout';

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

  onResize = () => {
    this.setState({
      containerHeight: React.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }

  componentWillUnmount = () => {
    GridLayout.resizeListeners.remove(this.onResize);
  }

  static firstStopTimes(props, expectedStopCount) {
    let minutesPerDay = 24 * 60,
      startStopTimes = props.startStopTimes,
      currentStopTime = -1,
      date = new Date(),
      result = [];

    function getDateAsString(date) {
      var year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();

      if (month < 10) {
        month = '0' + month;
      }

      if (day < 10) {
        day = '0' + day;
      }

      return day + '/' + month + '/' + year;
    }

    // add the currentStopTime if it is a valid one
    function nextStopTime(date, currentStopTime, result) {
      var stopTime = startStopTimes[currentStopTime],
        endStopTime, endSeq, d, doesRunAt;

      if (props.departureStop && props.arrivalStop) {
        // filter end stops trips
        endStopTime = SNCFData.trips[stopTime.trip].stopTimes.firstOrDefault(function (stopTime) {
          return SNCFData.stops[stopTime.stop].id === props.arrivalStop.id;
        });

        endSeq = endStopTime ? endStopTime.sequence : 0;

        if (stopTime.sequence >= endSeq) {
          return;
        }
      }

      d = date;
      // be aware of trips that starts the day before
      if (stopTime.time > minutesPerDay) {
        d = new Date(d.getTime());
        d.setDate(d.getDate() - 1);
      }

      doesRunAt = SNCFData.trips[stopTime.trip].serviceExceptions[getDateAsString(d)];

      if (doesRunAt === true
        || (doesRunAt === undefined && (function () {
        var endDate;

        if (SNCFData.services[SNCFData.trips[stopTime.trip].service] !== undefined) {
          if (new Date(SNCFData.services[SNCFData.trips[stopTime.trip].service].startDate).getTime() <= d.getTime()) {
            endDate = SNCFData.services[SNCFData.trips[stopTime.trip].service].endDate;
            endDate = new Date(endDate);
            endDate = new Date(endDate.getTime());
            endDate.setDate(endDate.getDate() + 1);

            if (d.getTime() < endDate.getTime()) {
              if (SNCFData.services[SNCFData.trips[stopTime.trip].service].days[d.getDay()]) {
                return true;
              }
            }
          }
        }
      })())) {
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
        if (time > minutesPerDay) {
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

      rows.push(<StopTimeRow key={stopTimes[i].stopTime.trip + stopTimes[i].stopTime.time} stopTime={stopTimes[i].stopTime} onStopTimeSelected={this.props.onStopTimeSelected} />)
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

  componentWillReceiveProps = (nextProps) => {
    var generator, rows;

    if (nextProps.departureStop !== this.props.departureStop || nextProps.arrivalStop !== this.props.arrivalStop) {
      generator = SelectedTrips.firstStopTimes(nextProps, 40) || null;
      rows = generator ? this.transformToElements(generator.stopTimes) : [];

      this.setState({
        generator: generator,
        rows: rows
      });
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
}

export default SelectedTrips;
