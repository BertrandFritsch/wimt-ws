/** @jsx React.DOM */

var AutoCompleteSelector = React.createClass({
  getDefaultProps: function () {
    return {
      placeholder: '',
      data: [],
      value: null
    }
  },

  componentDidMount: function () {
    var me = this;

    $(this.getDOMNode()).kendoAutoComplete({
      placeholder: this.props.placeholder,
      dataSource: this.props.data,
      value: this.props.value,
      dataTextField: 'name',
      filter: 'contains',
      select: function (e) {
        me.props.onStopChange(this.dataItem(e.item.index()));
      }
    });
  },

  componentWillReceiveProps: function (nextProps) {
    if (nextProps.data !== this.props.data) {
      $(this.getDOMNode()).data("kendoAutoComplete").dataSource.data(nextProps.data);
    }

    if (nextProps.value !== this.props.value) {
      $(this.getDOMNode()).data("kendoAutoComplete").value(nextProps.value);
    }
  },

  render: function () {
    return (
      <input style={{width:100 + '%'}} />
      )
  }
});
