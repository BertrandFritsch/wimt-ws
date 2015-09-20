import React from 'react';

class AutoCompleteSelector extends React.Component {
  static defaultProps = {
    placeholder: '',
    data: [],
    value: null
  }

  componentDidMount = () => {
    $(React.findDOMNode(this)).kendoAutoComplete({
      placeholder: this.props.placeholder,
      dataSource: this.props.data,
      value: this.props.value,
      dataTextField: 'name',
      filter: 'contains',
      select: (e) => {
        this.props.onStopChange(this.dataItem(e.item.index()));
      }
    });
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.data !== this.props.data) {
      $(React.findDOMNode(this)).data("kendoAutoComplete").dataSource.data(nextProps.data);
    }

    if (nextProps.value !== this.props.value) {
      $(React.findDOMNode(this)).data("kendoAutoComplete").value(nextProps.value);
    }
  }

  render() {
    return <input style={{width:100 + '%'}} />;
  }
}

export default AutoCompleteSelector;
