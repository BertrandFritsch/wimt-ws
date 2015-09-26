import React from 'react';
import Autosuggest from 'react-autosuggest';
import theme from './AutoCompleteSelector.css';

class AutoCompleteSelector extends React.Component {
  static defaultProps = {
    placeholder: '',
    data: [],
    value: null
  }

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
    let me = this,
      inputAttributes = {
        placeholder: this.props.placeholder,
        value: this.props.value && this.props.value.name || ''
      };

    let getSuggestions = (input, callback) => {
      setTimeout(() => {
        input = input.toUpperCase();

        callback(null, me.props.data.filter(t => t.name.indexOf(input) > -1))
      }, 1);
    };

    let suggestionRenderer = (suggestion, input) => {
      return suggestion.name;
    };

    let suggestionValue = (suggestion) => {
      return suggestion.name;
    };

    let onSuggestionSelected = (suggestion, event) => {
      event.preventDefault();
      me.props.onStopChange(suggestion);
    };

    let id = ++this.id;

    return <Autosuggest id={this.props.placeholder}
                        theme={theme}
                        inputAttributes={inputAttributes}
                        suggestions={getSuggestions}
                        suggestionRenderer={suggestionRenderer}
                        suggestionValue={suggestionValue}
                        onSuggestionSelected={onSuggestionSelected} />;
  }

  static id = 0
}

export default AutoCompleteSelector;
