import React from 'react';

/**
 * Connects a React component to transparently watch a dimension of the root element of a React component.
 * @param {ReactClass} Component The wrapped component.
 * @returns {ReactClass} A React class.
 */
export function connectToLayoutWrapper(Component) {
  return React.createClass({
    propTypes: {
      onLayoutElementAdded: React.PropTypes.func.isRequired,
      onLayoutElementRemoved: React.PropTypes.func.isRequired
    },

    componentDidMount() {
      this.props.onLayoutElementAdded(this.refs.containerNode);
    },

    componentWillUnmount() {
      this.props.onLayoutElementRemoved(this.refs.containerNode);
    },

    render() {
      const { onLayoutElementAdded, onLayoutElementRemoved, ...props } = this.props; //eslint-disable-line no-unused-vars
      return (
        // assume the node can stretch inside its container
        <div ref="containerNode" style={{ width: '100%', height: '100%' }}>
          <Component {...props} />
        </div>
      );
    }
  });
}
