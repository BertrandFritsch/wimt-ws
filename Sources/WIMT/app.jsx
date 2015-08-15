/** @jsx React.DOM */

var MainFrame = React.createClass({
  render: function () {
    return (
        <div data-g-layout-container='"horizontalBubbling": false, "verticalBubbling": false' className="main-frame">
          <input type="text"
                 placeholder="De..."
                 ref="from"
                 data-g-layout-item='"row": 0' />
          <div data-g-layout-item='"row": 1, "isXSpacer": true, "isYSpacer": true' />
          <input type="text"
                 placeholder="Vers..."
                 ref="to"
                 data-g-layout-item='"row": 2' />
        </div>
      )
  }
});

var Main = React.createClass({
  render: function () {
    return (
        <div id="gGridLayoutRoot" 
             className="gLayoutMeasuring"
             data-g-layout-container=""
        >
          <div data-g-layout-item='"row": 0, "column": 0, "isXSpacer": true' />
          <div data-g-layout-item='"row": 0, "column": 1, "isYSpacer": true'
               data-g-layout-policy='"widthPolicy": "Container", "widthHint": "600px"' 
               className="root-container">
            <MainFrame />
          </div>
          <div data-g-layout-item='"row": 0, "column": 2, "isXSpacer": true' />
        </div>
      )
  }
});

React.render(<Main />, document.body);
GridLayout.initialize();

for (var s in Stops) {
  console.log(Stops[s].name);
}