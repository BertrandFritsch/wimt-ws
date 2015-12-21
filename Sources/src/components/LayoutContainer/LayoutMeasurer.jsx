import React from 'react';
import GridLayout from '../../gridlayout/gridlayout';

/**
 * Helper function to measure a DOM element when the layout change.
 * The new size is only forwarded if it does change compared to the previous known one.
 * The component can be shared to manage the size of a set of same-sized DOM elements.
 * Only one DOM element is retained at one time.
 *
 * @param {string} axe 'width' | 'height'
 * @param {number} initialSize the initial size of the DOM element
 * @returns {object} the interface to communicate with the object
 */
export function createMeasurer(axe, initialSize = 0) {
  let listeners = new Set();
  let layoutElement = null;
  let containerSize = initialSize;

  function onResize() {
    const size = layoutElement.getBoundingClientRect()[axe];
    if (containerSize !== size) {
      containerSize = size;
      listeners.forEach(listener => listener.onContainerSizeUpdated(containerSize));
    }
  }

  return {
    /**
     * Gets the current size of the DOM element
     * @returns {number} the current size.
     */
    get containerSize() {
      return containerSize;
    },

    /**
     * Add a listener interested in size changes of the DOM element.
     * @param {object} listener The listener interested in DOM element changes.
     * It should implement an interface containing a onContainerSizeUpdated function.
     */
    addListener(listener) {
      listeners.add(listener);
    },

    /**
     * Remove a listener interested in size changes of the DOM element.
     * @param {object} listener The listener interested in DOM element changes.
     */
    removeListener(listener) {
      listeners.delete(listener);
    },

    /**
     * Notifies the object that the reference DOM element may have changed.
     * It will only be taken into account if no other DOM element is currently registered.
     * @param {Element} element the DOM element
     */
    onLayoutElementAdded(element) {
      if (!layoutElement) {
        layoutElement = element;
        GridLayout.resizeListeners.add(onResize);
      }
    },

    /**
     * Notifies the object that the reference DOM element may have changed.
     * The current registered element will be removed if its the provided element.
     * @param {Element} element the DOM element
     */
    onLayoutElementRemoved(element) {
      if (layoutElement === element) {
        GridLayout.resizeListeners.remove(onResize);
        layoutElement = null;
      }
    }
  };
}

/**
 * Connects a React component to watch a dimension of a DOM element.
 * The real dimension observing is delegated to the object created by the createMeasurer function.
 * @param {ReactClass} Component The wrapped component.
 * The component must support the callbacks to report the DOM element to measure.
 * If the DOM element to measure is the root element, the LayoutWrapper higher-order component cab used
 * to transparently handle the feature.
 * @param {object} measurer Object created by the createMeasurer function.
 * @param {string} propName The property expected by the component to report the size of the DOM element.
 * @returns {ReactClass} A React class.
 */
export function connectToLayoutMeasurer(Component, measurer, propName) {
  return React.createClass({
    getInitialState() {
      return {
        [propName]: measurer.containerSize
      };
    },

    componentWillMount() {
      measurer.addListener(this);
    },

    componentWillUnmount() {
      measurer.removeListener(this);
    },

    render() {
      return (
        <Component {...this.props} {...this.state} onLayoutElementAdded={element => measurer.onLayoutElementAdded(element)} onLayoutElementRemoved={element => measurer.onLayoutElementRemoved(element)} />
      );
    },

    onContainerSizeUpdated(size) {
      this.setState({
        [propName]: size
      });
    }
  });
}
