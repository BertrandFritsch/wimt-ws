/** @jsx React.DOM */

var AutoCompleteSelector = React.createClass({
  getDefaultProps: function () {
    return {
      placeholder: '',
      data: [],
      value: null
    }
  },

  componentDidMount: function () {
    var me = this;

    $(this.getDOMNode()).kendoAutoComplete({
      placeholder: this.props.placeholder,
      dataSource: this.props.data,
      value: this.props.value,
      dataTextField: 'name',
      filter: 'contains',
      select: function (e) {
        me.props.onStopChange(this.dataItem(e.item.index()));
      }
    });
  },

  componentWillReceiveProps: function (nextProps) {
    if(nextProps.data !== this.props.data) {
      $(this.getDOMNode()).data("kendoAutoComplete").dataSource.data(nextProps.data);
    }

    if (nextProps.value !== this.props.value) {
      $(this.getDOMNode()).data("kendoAutoComplete").value(nextProps.value);
    }
  },

  render: function () {
    return (
      <input style={{width:100 + '%'}} />
      )
}
});

var StopTimeRow = React.createClass({
  render: function () {
    var hours = Math.floor(this.props.stopTime.time / 60),
      minutes = this.props.stopTime.time - (hours * 60),
      lastStop;

    if (hours >= 24) {
      hours -= 24;
    }

    if (hours < 10) {
      hours = '0' + hours;
    }

    if (minutes < 10) {
      minutes = '0' + minutes;
    }

    lastStop = this.props.stopTime.trip.getStopTimes()[this.props.stopTime.trip.getStopTimes().length - 1].stop.name;

    return (
      <div className="stop-time-row">{hours}:{minutes} - {this.props.stopTime.trip.mission} - {lastStop}</div>
      )
}
});

var DayHeaderRow = React.createClass({
  render: function () {
    return (
      <div className="day-header-row">{this.props.date.toLocaleString('fr-FR', { weekday: 'long' })}</div>
      )
}
});

var SelectedTrips = React.createClass({
  nextStopTimes: function() {
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

        if (doesRunAt === true || (doesRunAt === undefined && stopTime.trip.service !== null && stopTime.trip.service.startDate.getTime() <= d.getTime() && d < endDate && stopTime.trip.service.days[d.getDay()]))
        {
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

var Trips = React.createClass({
  render: function () {
    var me = this,
        departureStops = me.props.stops,
        arrivalStops,
        startStopTimes;

    function onStopChange(stop, eventToCall) {
      var index;

      //TODO: ensure the name has been found
      me.props[eventToCall](stop);
    }

    function onDepartureStopChange(stop) {
      onStopChange(stop, 'onDepartureStopChange');
    }

    function onArrivalStopChange(stop) {
      onStopChange(stop, 'onArrivalStopChange');
    }

    if (me.props.departureStop) {
      // filter the possible arrival stops
      arrivalStops = (function () {
        var stopsMap;

        // use a map to make stops being unique
        stopsMap = me.props.departureStop.getTrips().reduce(function (res, trip) {
          return trip.getStopTimes().reduce(function (res, stopTime) {
            // !!! stop object references cannot be compared as they are two distinct objects !!!
            if (stopTime.stop.id !== me.props.departureStop.id) {
              res[stopTime.stop.id] = stopTime.stop;
            }

            return res;
          }, res)
        }, {});

        // use the initial stops list to keep the arrival stop list sorted
        return departureStops.filter(function (stop) {
          return stopsMap[stop.id] !== undefined;
        });
      })();

      startStopTimes = me.props.departureStop.getStopTimes();
    }
    else {
      arrivalStops = departureStops;
    }

    return (
        <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false' className="main-frame">
          <div data-g-layout-item='"row": 0'>
            <AutoCompleteSelector ref="from"
                                  placeholder="De..."
                                  data={departureStops}
                                  value={this.props.departureStop}
                                  onStopChange={onDepartureStopChange} />
          </div>
          <div className="trips-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
            <SelectedTrips departureStop={this.props.departureStop} 
                           startStopTimes={startStopTimes}
                           arrivalStop={this.props.arrivalStop} />
          </div>
          <div data-g-layout-item='"row": 2'>
            <AutoCompleteSelector ref="to"
                                  placeholder="Vers..."
                                  data={arrivalStops}
                                  value={this.props.arrivalStop}
                                  onStopChange={onArrivalStopChange} />
          </div>
        </div>
      )
  }
});

var Main = React.createClass({
  getDefaultProps: function () {
    return {
      stops: (function () {
        var stops = [], stop;

        for (stop in Stops) {
          stops.push(Stops[stop]);
        }

        return stops.sort(function (stop1, stop2) {
          return stop1.name < stop2.name ? -1 : 1;
        });
      })()
    };
  },

  getInitialState: function () {
    return {
      departureStop: null,
      arrivalStop: null
    };
  },

  onDepartureStopChange: function (stop) {
    this.setState({
      departureStop: stop
    });
  },

  onArrivalStopChange: function (stop) {
    this.setState({
      arrivalStop: stop
    });
  },

  render: function () {
    return (
        <div id="gGridLayoutRoot"
             className="gLayoutMeasuring"
             data-g-layout-container="">
          <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true' />
          <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true'
               data-g-layout-policy='"widthPolicy": "Container", "widthHint": "600px"'
               className="root-container">
            <Trips stops={this.props.stops}
                   departureStop={this.state.departureStop}
                   arrivalStop={this.state.arrivalStop}
                   onDepartureStopChange={this.onDepartureStopChange}
                   onArrivalStopChange={this.onArrivalStopChange} />
          </div>
          <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true' />
        </div>
      )
  }
});

React.render(<Main />, document.body);
GridLayout.initialize();
