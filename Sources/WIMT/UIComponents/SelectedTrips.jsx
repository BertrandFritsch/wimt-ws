/** @jsx React.DOM */

var SelectedTrips = React.createClass({
  getInitialState: function () {
    var me = this,
      generator = SelectedTrips.firstStopTimes(me.props, 40) || null,
      rows = generator ? SelectedTrips.transformToElements(generator.stopTimes) : [];

    return {
      generator: generator,
      rows: rows,
      containerHeight: 250
    }
  },

  onResize: function () {
    var me = this;

    me.setState({
      containerHeight: me.getDOMNode().parentNode.getBoundingClientRect().height
    });
  },

  componentWillMount: function () {
    var me = this;

    GridLayout.resizeListeners.add(me.onResize);
  },

  componentWillUnmount: function () {
    var me = this;

    GridLayout.resizeListeners.remove(me.onResize);
  },

  statics: {
    firstStopTimes: function (props, expectedStopCount) {
      var me = this,
        minutesPerDay = 24 * 60,
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
      if (startStopTimes) {
        // progress to the stop time 0
        for (currentStopTime = 0; currentStopTime < startStopTimes.length; ++currentStopTime) {
          time = startStopTimes[currentStopTime].time
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
    },

    transformToElements: function (stopTimes, date) {
      var me = this,
        length, i,
        rows = [];

      length = stopTimes.length;

      for (i = 0; i < length; ++i) {
        if (date !== stopTimes[i].date) {
          date = stopTimes[i].date;
          rows.push(<DayHeaderRow key={date} date={date} />);
        }

        rows.push(<StopTimeRow key={i} stopTime={stopTimes[i].stopTime} />)
      }

      return rows;
    }
  },

  handleInfiniteLoad: function () {
    var me = this,
      lastDate = me.state.generator.stopTimes[me.state.generator.stopTimes.length - 1].date,
      generator = me.state.generator.nextStopTimes(),
      rows = me.state.rows.concat(SelectedTrips.transformToElements(generator.stopTimes, lastDate));

    return me.setState({
      generator: generator,
      rows: rows
    });
  },

  componentWillReceiveProps: function (nextProps) {
    var me = this,
      generator, rows;

    if (nextProps.departureStop !== me.props.departureStop || nextProps.arrivalStop !== me.props.arrivalStop) {
      generator = SelectedTrips.firstStopTimes(nextProps, 40) || null;
      rows = generator ? SelectedTrips.transformToElements(generator.stopTimes) : [];

      me.setState({
        generator: generator,
        rows: rows
      });
    }
  },

  render: function () {
    var me = this;

    return (
      <Infinite elementHeight={50}
                containerHeight={me.state.containerHeight}
                infiniteLoadBeginBottomOffset={200}
                onInfiniteLoad={this.handleInfiniteLoad}>
        {this.state.rows}
      </Infinite>
    )
  }
});
