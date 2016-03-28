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
    port: 8083
  },
  entry: [
    'webpack/hot/dev-server',
    'webpack-dev-server/client?http://localhost:8083',
    'font-awesome/css/font-awesome.min.css',
    path.resolve(__dirname, 'src/extendedArray.js'),
    path.resolve(__dirname, 'src/extendedElement.js'),
    'babel-polyfill',
    path.resolve(__dirname, 'src/app.jsx')
  ],
  output: {
    path: __dirname + '/build',
    publicPath: '/wimt/',
    filename: 'index.js'
  },
  resolve: {
    extensions: [ '', '.js', '.jsx' ]
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.png$/, loader: "url-loader?limit=100000" },
      { test: /\.(otf|eot|svg|ttf|woff|woff2)(\?.+)?$/, loader: 'url-loader?limit=8192' },
      //{ test: /\.jpg$|\.png$/, loader: "file-loader" },
      //{ test: require.resolve(path.resolve(__dirname, 'src/assets/SNCFData.min.js')), loader: "scripts" },
      //{ test: /\.html$/, loader: "html-loader" },
      { test: /\.js[x]?$/, include: path.resolve(__dirname, 'src'), exclude: /node_modules/, loader: 'babel-loader' }
    ]
    //noParse: new RegExp(path.resolve(__dirname, 'src/assets/SNCFData.min.js'))
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new WebpackNotifierPlugin({ alwaysNotify: true })
  ],
  devtool: 'source-map'
};
