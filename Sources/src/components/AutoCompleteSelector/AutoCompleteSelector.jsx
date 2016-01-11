import React from 'react';
import Autosuggest from 'react-autosuggest';
import SNCFData from '../../SNCFData.js';
import './AutoCompleteSelector.css';

const AutoCompleteSelector = React.createClass({
  propTypes: {
    data: React.PropTypes.array,
    onStopChange: React.PropTypes.func,
    placeholder: React.PropTypes.string,
    value: React.PropTypes.string
  },

  getDefaultProps() {
    return {
      placeholder: '',
      data: [],
      value: null
    };
  },

  //componentDidMount = () => {
  //  $(React.findDOMNode(this)).kendoAutoComplete({
  //    placeholder: this.props.placeholder,
  //    dataSource: this.props.data,
  //    value: this.props.value,
  //    dataTextField: 'name',
  //    filter: 'contains',
  //    select: (e) => {
  //      this.props.onStopChange(this.dataItem(e.item.index()));
  //    }
  //  });
  //}
  //
  //componentWillReceiveProps = (nextProps) => {
  //  if (nextProps.data !== this.props.data) {
  //    $(React.findDOMNode(this)).data("kendoAutoComplete").dataSource.data(nextProps.data);
  //  }
  //
  //  if (nextProps.value !== this.props.value) {
  //    $(React.findDOMNode(this)).data("kendoAutoComplete").value(nextProps.value);
  //  }
  //}

  render() {
    let getSuggestions = (input, callback) => {
      setTimeout(() => {
        input = input.toUpperCase();

        callback(null, this.props.data.filter(t => SNCFData.getStopName(t).toUpperCase().indexOf(input) > -1));
      }, 1);
    };

    let suggestionRenderer = (suggestion /*, input */) => {
      return SNCFData.getStopName(suggestion);
    };

    let suggestionValue = (suggestion) => {
      return SNCFData.getStopName(suggestion);
    };

    let onSuggestionSelected = (suggestion, event) => {
      event.preventDefault();
      this.props.onStopChange(suggestion);
    };

    let onInputChange = (value) => {
      if (value === '') {
        this.props.onStopChange(null);
      }
    };

    return (<Autosuggest id={this.props.placeholder}
                         value={this.props.value && SNCFData.getStopName(this.props.value) || ''}
                         inputAttributes={{
                           placeholder: this.props.placeholder,
                           onChange: onInputChange
                         }}
                         suggestions={getSuggestions}
                         suggestionRenderer={suggestionRenderer}
                         suggestionValue={suggestionValue}
                         onSuggestionSelected={onSuggestionSelected} />);
  }
});

export default AutoCompleteSelector;
