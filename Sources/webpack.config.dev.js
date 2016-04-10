'use strict';

var webpack = require('webpack');
var WebpackNotifierPlugin = require('webpack-notifier');
var baseConfig = require('./webpack.config.base');

Object.assign(baseConfig, {
  devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,
    contentBase: './src',
    port: 8083
  }
});

baseConfig.entry.push('webpack/hot/dev-server', 'webpack-dev-server/client?http://localhost:8083');

baseConfig.plugins.push(
  new webpack.HotModuleReplacementPlugin(),
  new WebpackNotifierPlugin({ alwaysNotify: true })
);

module.exports = baseConfig;
