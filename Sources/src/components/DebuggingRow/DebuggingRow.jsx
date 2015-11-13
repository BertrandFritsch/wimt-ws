import React from 'react';
import theme from './DebuggingRow.css';

class DebuggingRow extends React.Component {
  constructor(props) { super(props); }

  render = () => {
    return (
      <div className="debugging-row">{(() => {
        let e = [];
        for (var p in this.props.debuggingInfo) {
          e.push(<span key={p}>{p}: {this.props.debuggingInfo[p]}</span>)
        }
        return e;
      })()}</div>
    )
  }
}

export default DebuggingRow;
