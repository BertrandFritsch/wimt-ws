import React from 'react';
import ExtendedArray from './extendedArray';
import ExtendedElement from './extendedElement';
import Main from './components/Main';
import GridLayout from './gridlayout/gridlayout';

React.render(<Main />, document.body);
GridLayout.initialize();
