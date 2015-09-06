/** @jsx React.DOM */

var Trip = React.createClass({

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

  render: function () {
    var me = this;

    return (
        <div className="trip-frame">
          {(function() {
            return me.props.trip.stopTimes.map(function(stopTime, index) {
              return <TripStopRow key={index} stopTime={stopTime} />
            });
          })()}
        </div>
        )
  }
});
