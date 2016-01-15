import React from 'react';
import Autosuggest from 'react-autosuggest';
import SNCFData from '../../SNCFData.js';
import './AutoCompleteSelector.css';

const AutoCompleteSelector = React.createClass({
  propTypes: {
    data: React.PropTypes.array,
    onStopChange: React.PropTypes.func,
    placeholder: React.PropTypes.string,
    value: React.PropTypes.array
  },

  getDefaultProps() {
    return {
      placeholder: '',
      data: [],
      value: null
    };
  },

  getInitialState() {
    return {
      suggestions: [],
      value: this.getSuggestionValue(this.props.value)
    };
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.setState({ value: this.getSuggestionValue(nextProps.value) });
    }
  },

  render() {
    return (<Autosuggest id={this.props.placeholder}
                         inputProps={{
                           placeholder: this.props.placeholder,
                           onChange: this.onInputChange,
                           value: this.state.value
                         }}
                         suggestions={this.state.suggestions}
                         getSuggestionValue={this.getSuggestionValue}
                         renderSuggestion={suggestion => <span>{SNCFData.getStopName(suggestion)}</span>}
                         onSuggestionSelected={this.onSuggestionSelected}
                         onSuggestionsUpdateRequested={this.onSuggestionsUpdateRequested} />);
  },

  getSuggestionValue(suggestion) {
    return suggestion && SNCFData.getStopName(suggestion) || '';
  },

  onSuggestionSelected(event, { suggestion }) {
    event.preventDefault();
    this.props.onStopChange(suggestion);
  },

  onInputChange(event, { newValue }) {
    this.setState({ value: newValue });
    if (newValue === '') {
      this.props.onStopChange(null);
    }
  },

  onSuggestionsUpdateRequested({ value }) {
    value = value.toUpperCase();

    this.setState({
      suggestions: this.props.data.filter(t => SNCFData.getStopName(t).toUpperCase().indexOf(value) > -1)
    });
  }
});

export default AutoCompleteSelector;
