import React from 'react';
import theme from './LayoutContainer.css';
import GridLayout from '../../gridlayout/gridlayout';

class LayoutContainer extends React.Component {
  componentDidMount = () => {
    GridLayout.updateLayoutOnInsertedElement(this.refs.container);
    GridLayout.updateLayoutOnDocumentUpdated(true, false, true);
  }

  render = () => {
    return (
      <div ref="container">{this.props.children}</div>
    )
  }
}

export default LayoutContainer;
