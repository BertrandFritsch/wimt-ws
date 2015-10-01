import React from 'react';
import ExtendedArray from './extendedArray';
import ExtendedElement from './extendedElement';
import ExtendedString from './extendedString';
import Main from './components/Main/Main';
import GridLayout from './gridlayout/gridlayout';

React.render(<Main />, document.body);
GridLayout.initialize();
