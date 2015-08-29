/** @jsx React.DOM */

var SelectedTrips = React.createClass({
  firstStopTimes: function (expectedStopCount) {
    var me = this,
      minutesPerDay = 24 * 60,
      startStopTimes = me.props.startStopTimes,
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
        endStopTime, endSeq, d, doesRunAt, endDate;

      if (me.props.departureStop && me.props.arrivalStop) {
        // filter end stops trips
        endStopTime = stopTime.trip.getStopTimes().firstOrDefault(function (stopTime) {
          return stopTime.stop.id === me.props.arrivalStop.id;
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

      doesRunAt = stopTime.trip.getServiceExceptions()[getDateAsString(d)];
      endDate = stopTime.trip.service && stopTime.trip.service.endDate;
      if (endDate) {
        endDate = new Date(endDate.getTime());
        endDate.setDate(endDate.getDate() + 1);
      }

      if (doesRunAt === true || (doesRunAt === undefined && stopTime.trip.service !== null && stopTime.trip.service.startDate.getTime() <= d.getTime() && d < endDate && stopTime.trip.service.days[d.getDay()])) {
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

  render: function () {
    var me = this,
      stopTimes, length, i,
      rows = [],
      date;

    if (me.props.startStopTimes) {
      stopTimes = me.firstStopTimes(10).stopTimes;
      length = stopTimes.length;

      for (i = 0; i < length; ++i) {
        if (date !== stopTimes[i].date) {
          date = stopTimes[i].date;
          rows.push(<DayHeaderRow key={date} date={date} />);
        }

        rows.push(<StopTimeRow key={i} stopTime={stopTimes[i].stopTime} />)
      }
    }

    return (
      <div>{rows}</div>
    )
  }
});
