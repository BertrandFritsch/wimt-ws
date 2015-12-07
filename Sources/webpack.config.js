var webpack = require('webpack');
var path = require('path');
var WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
  devServer: {
    historyApiFallback: true,
    hot: true,
    inline: true,
    progress: true,
    contentBase: './src',
    port: 83
  },
  entry: [
    'webpack/hot/dev-server',
    'webpack-dev-server/client?http://localhost:83',
    path.resolve(__dirname, 'src/app.jsx'),
    //path.resolve(__dirname, 'src/index.html')
  ],
  output: {
    path: __dirname + '/build',
    publicPath: '/',
    filename: './index.js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders:[
      { test: /\.css$/, include: path.resolve(__dirname, 'src'), loader: 'style-loader!css-loader' },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      //{ test: /\.jpg$|\.png$/, loader: "file-loader" },
      //{ test: require.resolve(path.resolve(__dirname, 'src/assets/SNCFData.min.js')), loader: "scripts" },
      //{ test: /\.html$/, loader: "html-loader" },
      { test: /\.js[x]?$/, include: path.resolve(__dirname, 'src'), exclude: /node_modules/, loader: 'babel-loader' }
    ],
    //noParse: new RegExp(path.resolve(__dirname, 'src/assets/SNCFData.min.js'))
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new WebpackNotifierPlugin()
  ],
  devtool: 'source-map'
};
