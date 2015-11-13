import React from 'react';
import theme from './LayoutContainer.css';
import GridLayout from '../../gridlayout/gridlayout';

class LayoutContainer extends React.Component {
  constructor(props) { super(props); }

  domNode = null;

  render = () => {
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
      }}>{this.props.children}</div>
    )
  }
}

export default LayoutContainer;
