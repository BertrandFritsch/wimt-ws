import React from 'react';
import GridLayout from '../../gridlayout/gridlayout';

export function connectToLayoutMeasurer(Component, axe, initialSize, propName) {
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
        <Component {...this.props} {...this.state} onLayoutElementAdded={element => this.onLayoutElementAdded(element)} onLayoutElementRemoved={element => this.onLayoutElementRemoved(element)}  />
      );
    },

    layoutElement: null,

    onLayoutElementAdded(element) {
      if (!this.layoutElement) {
        this.layoutElement = element;
      }
    },

    onLayoutElementRemoved(element) {
      if (this.layoutElement === element) {
        this.layoutElement = null;
      }
    },

    onResize() {
      const size = this.layoutElement ? this.layoutElement.getBoundingClientRect()[axe] : initialSize;
      if (this.state[propName] !== size) {
        this.setState({
          [propName]: size
        });
      }
    }
  });
}
