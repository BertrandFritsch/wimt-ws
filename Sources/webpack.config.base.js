'use strict';

var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: [
    'font-awesome/css/font-awesome.min.css',
    path.resolve(__dirname, 'src/extendedArray.js'),
    path.resolve(__dirname, 'src/extendedElement.js'),
    'babel-polyfill',
    path.resolve(__dirname, 'src/app.jsx')
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
    filename: 'bundle.js'
  },
  resolve: {
    extensions: [ '', '.js', '.jsx' ]
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.(otf|eot|svg|ttf|woff|woff2)(\?.+)?$/, loader: 'url-loader?limit=8192' },
      { test: /\.js[x]?$/, include: path.resolve(__dirname, 'src'), exclude: /node_modules/, loader: 'babel-loader' }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: './src/assets/SNCFData.min.js', to: __dirname }
    ]),
    new HtmlWebpackPlugin({
      template: 'src/index.html',
      inject: 'body',
      filename: 'index.html'
    })
  ]
};
