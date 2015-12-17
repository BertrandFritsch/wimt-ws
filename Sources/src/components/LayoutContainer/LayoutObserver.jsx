import React from 'react';
import GridLayout from '../../gridlayout/gridlayout';

export function connectToLayoutObserver(Component, axe, initialSize, propName) {
  return React.createClass({
    propTypes: {
      //initialSize: React.PropTypes.number.isRequired,
      //axe: React.PropTypes.string.isRequired
    },

    getInitialState() {
      return {
        [propName]: initialSize
      };
    },

    componentWillMount() {
      GridLayout.resizeListeners.add(this.onResize);
    },

    componentWillUnmount() {
      GridLayout.resizeListeners.remove(this.onResize);
    },

    render() {
      return (
        // assume the node can stretch inside its container
        <div ref="containerNode" style={{ width: '100%', height: '100%' }}>
          <Component {...this.props} {...this.state} />
        </div>
      );
    },

    onResize() {
      const size = this.refs.containerNode.getBoundingClientRect()[axe];
      if (this.state[propName] !== size) {
        this.setState({
          [propName]: size
        });
      }
    }
  });
}
