import React from 'react';
import TripHeaderRow from './../TripHeaderRow/TripHeaderRow';
import TripStopRow from './../TripStopRow/TripStopRow';
import GridLayout from '../../gridlayout/gridlayout';
import theme from './Trip.css'

class Trip extends React.Component {
  constructor(props) {
    super(props);
    
    GridLayout.resizeListeners.add(this.onResize);
  }

  onResize = () => {
    this.setState({
      containerHeight: React.findDOMNode(this).parentNode.getBoundingClientRect().height
    });
  }

  render = () => {
    return (
        <div className="trip-frame">
          <TripHeaderRow trip={this.props.trip} />
          {(() => {
            return this.props.trip.stopTimes.map((stopTime, index) => <TripStopRow key={index} stopTime={stopTime} />);
          })()}
        </div>
        )
  }
}

export default Trip;
