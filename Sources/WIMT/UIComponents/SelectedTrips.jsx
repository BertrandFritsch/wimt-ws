/** @jsx React.DOM */

var SelectedTrips = React.createClass({
  nextStopTimes: function () {
    var me = this,
      startStopTimes = me.props.startStopTimes,
      currentStopTime = -1,
      dayInMinutes = 24 * 60,
      date = new Date(),
      time,
      stopTime, endStopTime, endSeq, d,
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

    // generate the 10 first stop times, then return a function to get the next 10 ones
    if (startStopTimes) {
      // progress to the stop time 0
      for (currentStopTime = 0; currentStopTime < startStopTimes.length; ++currentStopTime) {
        time = startStopTimes[currentStopTime].time
        if (time > dayInMinutes) {
          time -= dayInMinutes;
        }

        if (time >= date.getHours() * 60 + date.getMinutes()) {
          break;
        }
      }

      // jump back to simulate the previous examined item
      // it's all right even if we go at the -1 index, as the first action is to go forward
      --currentStopTime;

      while (true) {
        ++currentStopTime;
        if (currentStopTime === startStopTimes.length) {
          currentStopTime = 0;
          date.setDate(date.getDate() + 1);
        }

        stopTime = startStopTimes[currentStopTime];

        if (me.props.departureStop && me.props.arrivalStop) {
          // filter end stops trips
          endStopTime = stopTime.trip.getStopTimes().firstOrDefault(function (stopTime) {
            return stopTime.stop.id === me.props.arrivalStop.id;
          });

          endSeq = endStopTime ? endStopTime.sequence : 0;

          if (stopTime.sequence >= endSeq) {
            continue;
          }
        }

        d = date;
        // be aware of trips that starts the day before
        if (stopTime.time > dayInMinutes) {
          d.setDate(d.getDate() - 1);
        }

        var doesRunAt = stopTime.trip.getServiceExceptions()[getDateAsString(d)];
        var endDate = stopTime.trip.service && stopTime.trip.service.endDate;
        if (endDate) {
          endDate.setDate(endDate.getDate() + 1);
        }

        if (doesRunAt === true || (doesRunAt === undefined && stopTime.trip.service !== null && stopTime.trip.service.startDate.getTime() <= d.getTime() && d < endDate && stopTime.trip.service.days[d.getDay()])) {
          result.push({ date: date, stopTime: stopTime });
        }

        if (result.length === 10) {
          return result;
        }
      }
    }

    return result;
  },

  render: function () {
    var me = this,
      stopTimes, length, i,
      rows = [],
      date;

    stopTimes = me.nextStopTimes();
    length = stopTimes.length;

    for (i = 0; i < length; ++i) {
      if (date !== stopTimes[i].date) {
        date = stopTimes[i].date;
        rows.push(<DayHeaderRow key={date} date={date} />);
      }

      rows.push(<StopTimeRow key={i} stopTime={stopTimes[i].stopTime} />)
    }

    return (
      <div>{rows}</div>
    )
  }
});
