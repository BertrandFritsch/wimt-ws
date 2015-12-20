import React from 'react';

export function connectToLayoutWrapper(Component) {
  return React.createClass({
    propTypes: {
      //initialSize: React.PropTypes.number.isRequired,
      //axe: React.PropTypes.string.isRequired
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
      const { onLayoutElementAdded, onLayoutElementRemoved, ...props } = this.props;
      return (
        // assume the node can stretch inside its container
        <div ref="containerNode" style={{ width: '100%', height: '100%' }}>
          <Component {...props} />
        </div>
      );
    }
  });
}
