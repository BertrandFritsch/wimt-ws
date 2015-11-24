import React from 'react';
import SNCFData from './../SNCFData';
import Trips from './../Trips/Trips';
import Trip from './../Trip/Trip';
import LayoutContainer from './../LayoutContainer/LayoutContainer.jsx';
import DebuggingRow from './../DebuggingRow/DebuggingRow.jsx'
import theme from './Main.css';
import { connect } from 'react-redux'
import { viewTrip, unviewTrip } from '../../actions/actions.js';

class Main extends React.Component {
  constructor(props) {
    super(props);

    this.setUpHistoryNavigation();
  }

  state = {
    stops: SNCFData.getStopsArray(),
    departureStop: null,
    arrivalStop: null
  }

  render = () => {
    return (
      <div className="root-container">
        <div id="gGridLayoutRoot" className="gLayoutMeasuring" data-g-layout-container="">
        <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true'/>
        <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true' data-g-layout-policy='"widthPolicy": "Fixed", "widthHint": "*"'>
          <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false'>
            {(() => { if (this.state.stops.length > 0) {
              return (
                  <LayoutContainer>
                    <Trips actionDispatcher={this.props.dispatch}
                           stops={this.state.stops}
                           departureStop={this.state.departureStop}
                           arrivalStop={this.state.arrivalStop}
                           onDepartureStopChange={this.onDepartureStopChange}
                           onArrivalStopChange={this.onArrivalStopChange}
                           onStopTimeSelected={stopTime => this.onStopTimeSelected(SNCFData.getTripId(SNCFData.getStopTimeTrip(stopTime)))}/>
                  </LayoutContainer>
                )
            } })()}
            {(() => {
              if (this.state.stops.length > 0 && this.props.viewTrip && this.props.viewTrip.trip) {
                return (
                  <LayoutContainer>
                    <Trip actionDispatcher={this.props.dispatch} viewTrip={this.props.viewTrip} departureStop={this.state.departureStop} arrivalStop={this.state.arrivalStop} />
                  </LayoutContainer>
                )
              }
            })()}
            {(() => {
              if (this.state.stops.length === 0) {
                return <p>The data are loading...</p>
              }
            })()}
          </div>
        </div>
        <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true'/>
        <div data-g-layout-item='"row": 1, "column": 0, "columnSpan": 3'>{(() => {
          if (this.props.debuggingInfo) {
            return (
              <LayoutContainer>
                <DebuggingRow debuggingInfo={this.props.debuggingInfo} />
              </LayoutContainer>
            )
          }
        })()}</div>
      </div>
      </div>
    )
  }

  setUpHistoryNavigation = () => {
    window.addEventListener('popstate', (event) => {
      event.preventDefault();

      if (event.state === null) {
        this.props.dispatch(unviewTrip());
      }
      else if (event.state.trip) {
        this.props.dispatch(viewTrip(event.state.trip));
      }
    });
  }

  onStopTimeSelected = (trip) => {
    this.props.dispatch(viewTrip(trip));
    window.history.pushState({ trip }, "Voyage d'un train", String.format("#trip={0}", trip));
  }

  onDepartureStopChange = (stop) => {
    this.setState({
      departureStop: stop
    });
  }

  onArrivalStopChange = (stop) => {
    this.setState({
      arrivalStop: stop
    });
  }
}

function select(state) {
  return state;
}

export default connect(select)(Main);
