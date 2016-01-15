import React from 'react';

const RouteSelector = React.createClass({
  propTypes: {
    route: React.PropTypes.func
  },

  render() {
    const { route, ...props } = this.props;
    return route ? React.createElement(route, props) : null;
  }
});

export default RouteSelector;
