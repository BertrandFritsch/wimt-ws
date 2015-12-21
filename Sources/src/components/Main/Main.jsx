import React from 'react';
import SNCFData from './../../SNCFData';
import Trips from './../Trips/Trips';
import Line from './../Line/Line';
import Trip from './../Trip/Trip';
import LayoutContainer from './../LayoutContainer/LayoutContainer.jsx';
import DebuggingRow from './../DebuggingRow/DebuggingRow.jsx';
import './Main.css';
import { connect } from 'react-redux';
import { viewTrip, unviewTrip, viewStop, unviewStop } from '../../actions/actions.js';
import { ViewTripAccessor } from '../../reducers/viewTrip.js';

const Main = React.createClass({
  propTypes: {
    debuggingInfo: React.PropTypes.any,
    dispatch: React.PropTypes.func,
    viewStop: React.PropTypes.any,
    viewTrip: React.PropTypes.any
  },

  componentDidMount() {
    this.setUpHistoryNavigation();
  },

  render() {
    const stops = SNCFData.getStopsArray();
    const state = ViewTripAccessor.create(this.props.viewTrip);

    let replaceViewStop = (departureStop, arrivalStop) => {
      this.props.dispatch(unviewStop());

      if (departureStop || arrivalStop) {
        this.props.dispatch(viewStop(departureStop && SNCFData.getStopId(departureStop), arrivalStop && SNCFData.getStopId(arrivalStop)));
      }
    };

    return (
      <div className="root-container">
        <div id="gGridLayoutRoot" className="gLayoutMeasuring" data-g-layout-container="">
          <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true'/>
          <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true'
               data-g-layout-policy='"widthPolicy": "Fixed", "widthHint": "*"'>
            <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false'>
              {(() => {
                return (
                  <LayoutContainer>
                    <Trips actionDispatcher={this.props.dispatch}
                           stops={stops}
                           onDepartureStopChange={stop => replaceViewStop(stop, state.stop.getArrivalStop())}
                           onArrivalStopChange={stop => replaceViewStop(state.stop.getDepartureStop(), stop)}
                           viewTrip={this.props.viewTrip}
                           onStopTimeSelected={(trip, date) => this.onStopTimeSelected(trip, date)}/>
                  </LayoutContainer>
                );
              })()}
              {(() => {
                if (state.line.hasLine()) {
                  return (
                    <LayoutContainer>
                      <Line actionDispatcher={this.props.dispatch}
                            viewTrip={this.props.viewTrip}
                            onStopTimeSelected={(trip, date) => this.onStopTimeSelected(trip, date)}/>
                    </LayoutContainer>
                  );
                }
              })()}
              {(() => {
                if (state.trip.hasTrip()) {
                  return (
                    <LayoutContainer>
                      <Trip actionDispatcher={this.props.dispatch} viewTrip={this.props.viewTrip} />
                    </LayoutContainer>
                  );
                }
              })()}
            </div>
          </div>
          <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true'/>
          <div data-g-layout-item='"row": 1, "column": 0, "columnSpan": 3'>{(() => {
            if (this.props.debuggingInfo) {
              return (
                <LayoutContainer>
                  <DebuggingRow debuggingInfo={this.props.debuggingInfo}/>
                </LayoutContainer>
              );
            }
          })()}</div>
        </div>
      </div>
    );
  },

  setUpHistoryNavigation() {
    window.addEventListener('popstate', (event) => {
      event.preventDefault();

      if (event.state === null) {
        this.props.dispatch(unviewTrip());
      }
      else if (event.state.trip) {
        this.props.dispatch(viewTrip(event.state.trip, event.state.date));
      }
    });
  },

  onStopTimeSelected(trip, date) {
    this.props.dispatch(viewTrip(trip, date));
    window.history.pushState({ trip, date }, "Voyage d'un train", `#trip=${trip}&date=${date.getTime()}`);
  }
});

function select(state) {
  return state;
}

export default connect(select)(Main);
