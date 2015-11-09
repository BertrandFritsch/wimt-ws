import React from 'react';
import ReactDOM from 'react-dom';
import ExtendedArray from './extendedArray';
import ExtendedElement from './extendedElement';
import ExtendedString from './extendedString';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';
import BabelPolyfill from 'babel-polyfill';

ReactDOM.render(<Main />, document.getElementById('main-container'));
GridLayout.initialize();
