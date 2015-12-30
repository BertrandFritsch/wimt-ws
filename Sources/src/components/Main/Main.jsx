import React from 'react';
//import LayoutContainer from './../LayoutContainer/LayoutContainer.jsx';
//import DebuggingRow from './../DebuggingRow/DebuggingRow.jsx';
import './Main.css';

const Main = React.createClass({
  propTypes: {
    children: React.PropTypes.element
  },

  render() {
    return (
      <div className="root-container">
        <div id="gGridLayoutRoot" className="gLayoutMeasuring" data-g-layout-container="">
          <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true'/>
          <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true'
               data-g-layout-policy='"widthPolicy": "Fixed", "widthHint": "*"'>
            <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false'>
              {this.props.children}
            </div>
          </div>
          <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true'/>
          <div data-g-layout-item='"row": 1, "column": 0, "columnSpan": 3'>{(() => {
            //if (this.props.debuggingInfo) {
            //  return (
            //    <LayoutContainer>
            //      <DebuggingRow debuggingInfo={this.props.debuggingInfo}/>
            //    </LayoutContainer>
            //  );
            //}
          })()}</div>
        </div>
      </div>
    );
  }
});

export default Main;
