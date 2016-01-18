import React from 'react';
import './LayoutContainer.css';
import GridLayout from '../../gridlayout/gridlayout';

export default function connectToLayoutContainer(Component) {
  return React.createClass({
    propTypes: {
      children: React.PropTypes.any
    },

    domNode: null,

    render() {
      return (
        <div ref={c => {
          if (c !== null) {
            if (c !== this.domNode) {
              this.domNode = c;
              GridLayout.updateLayoutOnInsertedElement(c);
              GridLayout.updateLayoutOnDocumentUpdated(true, false, true);
            }
            else {
              GridLayout.invalidLayout(c, false, false);
            }
          }
        }}><Component {...this.props} /></div>
      );
    }
  });
}
