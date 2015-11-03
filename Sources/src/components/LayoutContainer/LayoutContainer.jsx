import React from 'react';
import theme from './LayoutContainer.css';
import GridLayout from '../../gridlayout/gridlayout';

class LayoutContainer extends React.Component {
  render = () => {
    return (
      <div ref={c => {
        if (c !== null) {
          GridLayout.updateLayoutOnInsertedElement(c);
          GridLayout.updateLayoutOnDocumentUpdated(true, false, true);
        }
      }}>{this.props.children}</div>
    )
  }
}

export default LayoutContainer;
