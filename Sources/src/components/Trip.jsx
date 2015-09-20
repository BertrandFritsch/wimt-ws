import React from 'react';
import TripStopRow from './TripStopRow';
import GridLayout from '../gridlayout/gridlayout';

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
          {(() => {
            return this.props.trip.stopTimes.map((stopTime, index) => <TripStopRow key={index} stopTime={stopTime} />);
          })()}
        </div>
        )
  }
}

export default Trip;
