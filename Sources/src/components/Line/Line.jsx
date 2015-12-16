import React from 'react';
import ReactDOM from 'react-dom';
import DayHeaderRow from './../DayHeaderRow/DayHeaderRow';
import StopTimeLine from './../StopTimeLine/StopTimeLine';
import Infinite from 'react-infinite';
import SNCFData from './../../SNCFData.js';
import GridLayout from '../../gridlayout/gridlayout';
import './Line.css';
import { viewLineNextTrips } from '../../actions/actions.js';
import FontAwesome from 'react-fontawesome';
import { ViewTripAccessor } from '../../reducers/viewTrip.js';

const Line = React.createClass({
  propTypes: {
    viewTrip: React.PropTypes.any,
    onStopTimeSelected: React.PropTypes.func,
    actionDispatcher: React.PropTypes.func
  },

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
    const viewTrip = ViewTripAccessor.create(this.props.viewTrip);
    const rows = (() => {
      let date;

      return viewTrip.line.getTrips().reduce((rows, e, index) => {
        if (date !== e.date) {
          date = e.date;
          rows.push(<DayHeaderRow key={date.getTime()} date={date}/>);
        }

        rows.push(<StopTimeLine key={index}
                                trip={e.trip}
                                date={e.date}
                                tripState={viewTrip.states.getTripState(e.trip, e.date.getTime())}
                                onStopTimeSelected={this.props.onStopTimeSelected}/>);

        return rows;
      }, []);
    })();


    return (
      <div data-g-layout-container='' className="line-frame">
        <div data-g-layout-item='"row": 0'>
          <div className="line-header">{viewTrip.line.getDepartureStop() && SNCFData.getStopName(viewTrip.line.getDepartureStop())}<FontAwesome className="line-header-separator" name="arrow-circle-o-right" size="lg" />{viewTrip.line.getArrivalStop() && SNCFData.getStopName(viewTrip.line.getArrivalStop())}</div>
        </div>
        <div className="line-container" data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true'>
          <Infinite elementHeight={50}
                    containerHeight={this.state.containerHeight}
                    infiniteLoadBeginEdgeOffset={200}
                    onInfiniteLoad={() => this.props.actionDispatcher(viewLineNextTrips(40))}>
            {rows}
          </Infinite>
        </div>
      </div>
    );
  },

  onResize() {
    const containerHeight = ReactDOM.findDOMNode(this).parentNode.getBoundingClientRect().height;
    if (this.state.containerHeight !== containerHeight) {
      this.setState({
        containerHeight: containerHeight
      });
    }
  }
});

export default Line;
