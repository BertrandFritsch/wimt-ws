'use strict';

var webpack = require('webpack');
var baseConfig = require('./webpack.config.base');

baseConfig.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify('production')
  }
}));

module.exports = baseConfig;
