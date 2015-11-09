import React from 'react';
import ReactDOM from 'react-dom';
import ExtendedArray from './extendedArray';
import ExtendedElement from './extendedElement';
import ExtendedString from './extendedString';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import BabelPolyfill from 'babel-polyfill';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducers from './reducers/reducers.js'

ReactDOM.render(<Provider store={createStore(reducers, {})}><Main /></Provider>, document.getElementById('main-container'));
GridLayout.initialize();
